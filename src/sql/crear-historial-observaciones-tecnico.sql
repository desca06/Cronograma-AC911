CREATE TABLE IF NOT EXISTS "trabajo_observaciones_tecnico" (
  "id" serial PRIMARY KEY NOT NULL,
  "trabajo_id" integer NOT NULL,
  "usuario_id" integer,
  "observacion" text NOT NULL,
  "estado_trabajo" text NOT NULL,
  "creado_en" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "trabajo_observaciones_tecnico_trabajo_id_trabajos_id_fk"
    FOREIGN KEY ("trabajo_id")
    REFERENCES "public"."trabajos"("id")
    ON DELETE cascade
    ON UPDATE no action,
  CONSTRAINT "trabajo_observaciones_tecnico_usuario_id_usuarios_id_fk"
    FOREIGN KEY ("usuario_id")
    REFERENCES "public"."usuarios"("id")
    ON DELETE set null
    ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "trabajo_obs_tecnico_trabajo_idx"
  ON "trabajo_observaciones_tecnico" ("trabajo_id");

CREATE INDEX IF NOT EXISTS "trabajo_obs_tecnico_usuario_idx"
  ON "trabajo_observaciones_tecnico" ("usuario_id");

CREATE INDEX IF NOT EXISTS "trabajo_obs_tecnico_fecha_idx"
  ON "trabajo_observaciones_tecnico" ("creado_en");

-- Recupera como primera entrada histórica la observación actual
-- que ya exista en trabajos.observaciones_tecnico.
-- usuario_id queda NULL porque el campo antiguo no registra quién la escribió.
INSERT INTO "trabajo_observaciones_tecnico" (
  "trabajo_id",
  "usuario_id",
  "observacion",
  "estado_trabajo",
  "creado_en"
)
SELECT
  t."id",
  NULL,
  t."observaciones_tecnico",
  t."estado",
  COALESCE(t."creado_en", now())
FROM "trabajos" t
WHERE
  t."observaciones_tecnico" IS NOT NULL
  AND btrim(t."observaciones_tecnico") <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "trabajo_observaciones_tecnico" h
    WHERE
      h."trabajo_id" = t."id"
      AND h."observacion" = t."observaciones_tecnico"
  );