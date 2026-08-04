CREATE TABLE IF NOT EXISTS "cronograma_notas" (
  "id" serial PRIMARY KEY NOT NULL,
  "fecha" date NOT NULL,
  "contenido" text DEFAULT '' NOT NULL,
  "importancia" varchar(20) DEFAULT 'PENDIENTE' NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL,
  "actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "cronograma_notas_fecha_unique" UNIQUE("fecha")
);