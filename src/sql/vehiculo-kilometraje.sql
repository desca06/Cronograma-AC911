ALTER TABLE vehiculos
ADD COLUMN IF NOT EXISTS km_actual integer NOT NULL DEFAULT 0;

ALTER TABLE trabajos
ADD COLUMN IF NOT EXISTS km_salida integer;

ALTER TABLE trabajos
ADD COLUMN IF NOT EXISTS km_llegada integer;

CREATE TABLE IF NOT EXISTS vehiculo_kilometraje (
  id serial PRIMARY KEY,
  vehiculo_id integer NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
  trabajo_id integer REFERENCES trabajos(id) ON DELETE SET NULL,
  usuario_id integer REFERENCES usuarios(id) ON DELETE SET NULL,
  km_anterior integer NOT NULL DEFAULT 0,
  km_salida integer,
  km_llegada integer NOT NULL,
  km_recorridos integer NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'TRABAJO',
  nota text,
  creado_en timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehiculo_kilometraje_vehiculo_idx
  ON vehiculo_kilometraje (vehiculo_id);

CREATE INDEX IF NOT EXISTS vehiculo_kilometraje_trabajo_idx
  ON vehiculo_kilometraje (trabajo_id);