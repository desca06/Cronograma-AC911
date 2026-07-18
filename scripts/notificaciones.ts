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

const sqlite = new Database(rutaBaseDatos);

sqlite.pragma("foreign_keys = ON");

try {
  const tablaExistente = sqlite
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'notificaciones'
    `)
    .get();

  if (tablaExistente) {
    console.log(
      "La tabla notificaciones ya existe.",
    );
  } else {
    sqlite.exec(`
      CREATE TABLE notificaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        usuario_id INTEGER NOT NULL,

        trabajo_id INTEGER,

        titulo TEXT NOT NULL,

        mensaje TEXT NOT NULL,

        tipo TEXT NOT NULL
          DEFAULT 'ASIGNACION',

        leida INTEGER NOT NULL
          DEFAULT 0,

        creado_en TEXT NOT NULL
          DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (usuario_id)
          REFERENCES usuarios(id)
          ON DELETE CASCADE,

        FOREIGN KEY (trabajo_id)
          REFERENCES trabajos(id)
          ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS
        notificaciones_usuario_id_idx
      ON notificaciones(usuario_id);

      CREATE INDEX IF NOT EXISTS
        notificaciones_trabajo_id_idx
      ON notificaciones(trabajo_id);

      CREATE INDEX IF NOT EXISTS
        notificaciones_leida_idx
      ON notificaciones(leida);
    `);

    console.log(
      "Tabla notificaciones creada correctamente.",
    );
  }
} catch (error) {
  console.error(
    "Error al crear la tabla notificaciones:",
    error,
  );

  process.exitCode = 1;
} finally {
  sqlite.close();
}