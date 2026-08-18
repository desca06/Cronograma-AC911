-- Migración: Firma del cliente al finalizar trabajo
-- Fecha: 2026-08-18
-- Descripción: Agrega columnas para almacenar la firma del cliente,
-- nombre del firmante y fecha de firma en la tabla trabajos.

ALTER TABLE "trabajos"
ADD COLUMN IF NOT EXISTS "firma_cliente" TEXT;

ALTER TABLE "trabajos"
ADD COLUMN IF NOT EXISTS "firma_cliente_nombre" TEXT;

ALTER TABLE "trabajos"
ADD COLUMN IF NOT EXISTS "firma_cliente_fecha" TIMESTAMP;

-- Índice para consultas de trabajos finalizados con firma
CREATE INDEX IF NOT EXISTS "trabajos_firma_cliente_fecha_idx"
ON "trabajos" ("firma_cliente_fecha");

-- Comentarios para documentación
COMMENT ON COLUMN "trabajos"."firma_cliente" IS 'Firma del cliente en formato base64 data URL (image/png)';
COMMENT ON COLUMN "trabajos"."firma_cliente_nombre" IS 'Nombre completo de la persona que firma como cliente/responsable';
COMMENT ON COLUMN "trabajos"."firma_cliente_fecha" IS 'Fecha y hora en que el cliente firmó la conformidad del trabajo';
