ALTER TABLE empleado_qr
ADD COLUMN IF NOT EXISTS dispositivo_token text;

ALTER TABLE empleado_qr
ADD COLUMN IF NOT EXISTS dispositivo_registrado_en timestamp;