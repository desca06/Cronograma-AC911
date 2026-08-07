CREATE TABLE IF NOT EXISTS orden_compra_items (
  id serial PRIMARY KEY,
  orden_compra_id integer NOT NULL
    REFERENCES ordenes_compra(id)
    ON DELETE CASCADE,
  tipo varchar(20) NOT NULL,
  articulo_id integer
    REFERENCES articulos_inventario(id)
    ON DELETE RESTRICT,
  descripcion text NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario integer NOT NULL DEFAULT 0,
  subtotal integer NOT NULL DEFAULT 0,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orden_items_orden_idx
  ON orden_compra_items(orden_compra_id);

CREATE INDEX IF NOT EXISTS orden_items_articulo_idx
  ON orden_compra_items(articulo_id);

CREATE TABLE IF NOT EXISTS orden_compra_eventos (
  id serial PRIMARY KEY,
  orden_compra_id integer NOT NULL
    REFERENCES ordenes_compra(id)
    ON DELETE CASCADE,
  tipo varchar(20) NOT NULL,
  estado_anterior varchar(20),
  estado_nuevo varchar(20),
  descripcion text,
  creado_en timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orden_eventos_orden_idx
  ON orden_compra_eventos(orden_compra_id);

CREATE INDEX IF NOT EXISTS orden_eventos_tipo_idx
  ON orden_compra_eventos(tipo);

CREATE INDEX IF NOT EXISTS orden_eventos_fecha_idx
  ON orden_compra_eventos(creado_en);

  