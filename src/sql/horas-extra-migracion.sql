ALTER TABLE empleados
ADD COLUMN IF NOT EXISTS limite_minutos_extra_mensuales integer
DEFAULT 0 NOT NULL;

ALTER TABLE asistencias
ADD COLUMN IF NOT EXISTS minutos_hora_extra integer
DEFAULT 0 NOT NULL;