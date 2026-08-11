ALTER TABLE "permisos"
  ADD COLUMN IF NOT EXISTS "fecha_fin" date;

ALTER TABLE "permisos"
  ADD COLUMN IF NOT EXISTS "dias_solicitados" integer NOT NULL DEFAULT 1;

ALTER TABLE "permisos"
  ADD COLUMN IF NOT EXISTS "dias_descontados_vacaciones" integer NOT NULL DEFAULT 0;

ALTER TABLE "permisos"
  ADD COLUMN IF NOT EXISTS "afecta_vacaciones" boolean NOT NULL DEFAULT false;

-- Permisos antiguos de una sola fecha:
UPDATE "permisos"
SET "fecha_fin" = "fecha"
WHERE "fecha_fin" IS NULL;

UPDATE "permisos"
SET "dias_solicitados" = 1
WHERE "dias_solicitados" IS NULL
   OR "dias_solicitados" <= 0;

CREATE INDEX IF NOT EXISTS "permisos_empleado_idx"
  ON "permisos" ("empleado_id");

CREATE INDEX IF NOT EXISTS "permisos_fecha_idx"
  ON "permisos" ("fecha");

CREATE INDEX IF NOT EXISTS "permisos_estado_idx"
  ON "permisos" ("estado");
