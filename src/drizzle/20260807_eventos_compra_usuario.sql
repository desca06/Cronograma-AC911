ALTER TABLE orden_compra_eventos
ADD COLUMN IF NOT EXISTS usuario_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orden_compra_eventos_usuario_id_fkey'
  ) THEN
    ALTER TABLE orden_compra_eventos
    ADD CONSTRAINT orden_compra_eventos_usuario_id_fkey
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orden_eventos_usuario_idx
ON orden_compra_eventos(usuario_id);