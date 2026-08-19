CREATE TABLE IF NOT EXISTS cliente_subtiendas (
  id serial PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cliente_subtiendas_cliente_idx
  ON cliente_subtiendas (cliente_id);

CREATE TABLE IF NOT EXISTS cliente_areas (
  id serial PRIMARY KEY,
  subtienda_id integer NOT NULL REFERENCES cliente_subtiendas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cliente_areas_subtienda_idx
  ON cliente_areas (subtienda_id);

ALTER TABLE trabajos
ADD COLUMN IF NOT EXISTS subtienda_id integer
REFERENCES cliente_subtiendas(id) ON DELETE SET NULL;

ALTER TABLE trabajos
ADD COLUMN IF NOT EXISTS area_id integer
REFERENCES cliente_areas(id) ON DELETE SET NULL;