import "dotenv/config";

import path from "node:path";

import Database from "better-sqlite3";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Falta DATABASE_URL en .env o .env.local",
  );
}

const rutaSqlite = path.join(
  process.cwd(),
  "data",
  "control-trabajos.db",
);

const sqlite = new Database(rutaSqlite, {
  readonly: true,
});

const postgres = new Client({
  connectionString: databaseUrl,
});

type Fila = Record<string, unknown>;

function convertirBooleanos(
  filas: Fila[],
  columnas: string[],
): Fila[] {
  return filas.map((fila) => {
    const copia = { ...fila };

    for (const columna of columnas) {
      if (columna in copia) {
        copia[columna] = Boolean(
          copia[columna],
        );
      }
    }

    return copia;
  });
}

async function insertarFilas(
  tabla: string,
  filas: Fila[],
): Promise<void> {
  if (filas.length === 0) {
    console.log(
      `- ${tabla}: sin registros`,
    );
    return;
  }

  for (const fila of filas) {
    const columnas = Object.keys(fila);

    const nombresColumnas = columnas
      .map((columna) => `"${columna}"`)
      .join(", ");

    const parametros = columnas
      .map((_, indice) => `$${indice + 1}`)
      .join(", ");

    const valores = columnas.map(
      (columna) => fila[columna],
    );

    await postgres.query(
      `
        INSERT INTO "${tabla}"
          (${nombresColumnas})
        VALUES
          (${parametros})
      `,
      valores,
    );
  }

  console.log(
    `✓ ${tabla}: ${filas.length} registros`,
  );
}

async function ajustarSecuencia(
  tabla: string,
): Promise<void> {
  await postgres.query(
    `
      SELECT setval(
        pg_get_serial_sequence($1, 'id'),
        COALESCE(
          (SELECT MAX(id) FROM "${tabla}"),
          1
        ),
        EXISTS(
          SELECT 1 FROM "${tabla}"
        )
      )
    `,
    [tabla],
  );
}

async function migrar(): Promise<void> {
  try {
    await postgres.connect();

    console.log(
      "Conectado a PostgreSQL.",
    );

    await postgres.query("BEGIN");

    /*
     * La base PostgreSQL debe estar recién creada.
     * Si ejecutás otra vez el script, limpia primero
     * los datos migrados para evitar duplicados.
     */
    await postgres.query(`
      TRUNCATE TABLE
        suscripciones_push,
        evidencias,
        notificaciones,
        trabajo_empleados,
        usuarios,
        trabajos,
        vehiculos,
        clientes,
        empleados
      RESTART IDENTITY CASCADE
    `);

    const empleados = convertirBooleanos(
      sqlite
        .prepare("SELECT * FROM empleados")
        .all() as Fila[],
      ["activo"],
    );

    const clientes = convertirBooleanos(
      sqlite
        .prepare("SELECT * FROM clientes")
        .all() as Fila[],
      ["activo"],
    );

    const vehiculos = convertirBooleanos(
      sqlite
        .prepare("SELECT * FROM vehiculos")
        .all() as Fila[],
      ["activo"],
    );

    const trabajos = sqlite
      .prepare("SELECT * FROM trabajos")
      .all() as Fila[];

    const trabajoEmpleados = sqlite
      .prepare(
        "SELECT * FROM trabajo_empleados",
      )
      .all() as Fila[];

    const usuarios = convertirBooleanos(
      sqlite
        .prepare("SELECT * FROM usuarios")
        .all() as Fila[],
      ["activo"],
    );

    const notificaciones =
      convertirBooleanos(
        sqlite
          .prepare(
            "SELECT * FROM notificaciones",
          )
          .all() as Fila[],
        ["leida"],
      );

    const evidencias = sqlite
      .prepare("SELECT * FROM evidencias")
      .all() as Fila[];

    const existeSuscripciones =
      sqlite
        .prepare(
          `
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
              AND name = 'suscripciones_push'
          `,
        )
        .get();

    const suscripcionesPush =
      existeSuscripciones
        ? (sqlite
            .prepare(
              "SELECT * FROM suscripciones_push",
            )
            .all() as Fila[])
        : [];

    await insertarFilas(
      "empleados",
      empleados,
    );
    await insertarFilas(
      "clientes",
      clientes,
    );
    await insertarFilas(
      "vehiculos",
      vehiculos,
    );
    await insertarFilas(
      "trabajos",
      trabajos,
    );
    await insertarFilas(
      "trabajo_empleados",
      trabajoEmpleados,
    );
    await insertarFilas(
      "usuarios",
      usuarios,
    );
    await insertarFilas(
      "notificaciones",
      notificaciones,
    );
    await insertarFilas(
      "evidencias",
      evidencias,
    );
    await insertarFilas(
      "suscripciones_push",
      suscripcionesPush,
    );

    for (const tabla of [
      "empleados",
      "clientes",
      "vehiculos",
      "trabajos",
      "usuarios",
      "notificaciones",
      "evidencias",
      "suscripciones_push",
    ]) {
      await ajustarSecuencia(tabla);
    }

    await postgres.query("COMMIT");

    console.log(
      "\n✅ Migración completada correctamente.",
    );
  } catch (error) {
    await postgres.query("ROLLBACK");

    console.error(
      "\n❌ Falló la migración:",
      error,
    );

    process.exitCode = 1;
  } finally {
    sqlite.close();
    await postgres.end();
  }
}

void migrar();
