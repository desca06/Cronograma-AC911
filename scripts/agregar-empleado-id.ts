import Database from "better-sqlite3";

type ColumnaSQLite = {
  name: string;
};

const sqlite = new Database(
  "./data/control-trabajos.db",
);

const columnas = sqlite
  .prepare("PRAGMA table_info(usuarios)")
  .all() as ColumnaSQLite[];

const columnaExiste = columnas.some(
  (columna) => columna.name === "empleado_id",
);

if (columnaExiste) {
  console.log(
    "La columna empleado_id ya existe.",
  );
} else {
  sqlite.exec(`
    ALTER TABLE usuarios
    ADD COLUMN empleado_id INTEGER
    REFERENCES empleados(id);
  `);

  console.log(
    "Columna empleado_id agregada correctamente.",
  );
}

sqlite.close();