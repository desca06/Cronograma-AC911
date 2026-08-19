ALTER TABLE trabajos
ADD COLUMN IF NOT EXISTS firma_cliente_url text;

ALTER TABLE trabajos
ADD COLUMN IF NOT EXISTS firma_cliente_nombre text;

ALTER TABLE trabajos
ADD COLUMN IF NOT EXISTS firma_cliente_en timestamp;