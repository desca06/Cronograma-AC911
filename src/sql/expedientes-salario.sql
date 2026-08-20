ALTER TABLE expedientes
ADD COLUMN IF NOT EXISTS salario_inicial integer;

ALTER TABLE expedientes
ADD COLUMN IF NOT EXISTS salario_actual integer;