import Database from "better-sqlite3";

const sqlite = new Database(
  "./data/control-trabajos.db",
);

sqlite.pragma("foreign_keys = ON");

try {
  const tablaExistente = sqlite
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'evidencias'
    `)
    .get();

  if (tablaExistente) {
    console.log(
      "La tabla evidencias ya existe.",
    );
  } else {
    sqlite.exec(`
      CREATE TABLE evidencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trabajo_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        archivo_url TEXT NOT NULL,
        nombre_original TEXT NOT NULL,
        descripcion TEXT,
        creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (trabajo_id)
          REFERENCES trabajos(id)
          ON DELETE CASCADE,

        FOREIGN KEY (usuario_id)
          REFERENCES usuarios(id)
      );

      CREATE INDEX IF NOT EXISTS
        evidencias_trabajo_id_idx
      ON evidencias(trabajo_id);
    `);

    console.log(
      "Tabla evidencias creada correctamente.",
    );
  }
} catch (error) {
  console.error(
    "Error al crear la tabla evidencias:",
    error,
  );

  process.exitCode = 1;
} finally {
  sqlite.close();
}