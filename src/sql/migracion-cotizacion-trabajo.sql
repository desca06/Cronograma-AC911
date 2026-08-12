CREATE TABLE IF NOT EXISTS "cotizacion_trabajos" (
  "id" serial PRIMARY KEY NOT NULL,
  "cotizacion_id" integer NOT NULL,
  "trabajo_id" integer NOT NULL,
  "creado_en" timestamp DEFAULT now() NOT NULL,

  CONSTRAINT "cotizacion_trabajos_cotizacion_fk"
    FOREIGN KEY ("cotizacion_id")
    REFERENCES "cotizaciones"("id")
    ON DELETE RESTRICT,

  CONSTRAINT "cotizacion_trabajos_trabajo_fk"
    FOREIGN KEY ("trabajo_id")
    REFERENCES "trabajos"("id")
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS
  "cotizacion_trabajos_cotizacion_unique"
ON "cotizacion_trabajos" ("cotizacion_id");

CREATE UNIQUE INDEX IF NOT EXISTS
  "cotizacion_trabajos_trabajo_unique"
ON "cotizacion_trabajos" ("trabajo_id");

CREATE INDEX IF NOT EXISTS
  "cotizacion_trabajos_cotizacion_idx"
ON "cotizacion_trabajos" ("cotizacion_id");

CREATE INDEX IF NOT EXISTS
  "cotizacion_trabajos_trabajo_idx"
ON "cotizacion_trabajos" ("trabajo_id");