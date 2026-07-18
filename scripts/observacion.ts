import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

const carpetaDatos = path.join(
  process.cwd(),
  "data",
);

mkdirSync(carpetaDatos, {
  recursive: true,
});

const rutaBaseDatos = path.join(
  carpetaDatos,
  "control-trabajos.db",
);

const sqlite = new Database(
  rutaBaseDatos,
);

try {
  const columnas = sqlite
    .prepare(
      "PRAGMA table_info(trabajos)",
    )
    .all() as Array<{
      name: string;
    }>;

  const columnaExiste = columnas.some(
    (columna) =>
      columna.name ===
      "observaciones_tecnico",
  );

  if (columnaExiste) {
    console.log(
      "La columna observaciones_tecnico ya existe.",
    );
  } else {
    sqlite.exec(`
      ALTER TABLE trabajos
      ADD COLUMN observaciones_tecnico TEXT;
    `);

    console.log(
      "Columna observaciones_tecnico creada correctamente.",
    );
  }
} catch (error) {
  console.error(
    "Error al agregar observaciones_tecnico:",
    error,
  );

  process.exitCode = 1;
} finally {
  sqlite.close();
}