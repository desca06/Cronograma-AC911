ALTER TABLE articulos_inventario
ADD COLUMN IF NOT EXISTS numero_serie text;

CREATE UNIQUE INDEX IF NOT EXISTS articulos_inventario_serie_unique
  ON articulos_inventario (lower(btrim(numero_serie)))
  WHERE numero_serie IS NOT NULL
    AND btrim(numero_serie) <> '';