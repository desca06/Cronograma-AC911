INSERT INTO vacaciones (
  empleado_id,
  fecha_inicio,
  fecha_fin,
  cantidad_dias,
  estado,
  observacion,
  autorizado_por,
  creado_en,
  actualizado_en
)
SELECT
  p.empleado_id,
  p.fecha,
  p.fecha,
  1,
  'APROBADA',
  '[PERMISO:' || p.id || '] Descuento automático de 1 día de vacaciones por permiso aprobado de tipo ' ||
    LOWER(REPLACE(p.tipo, '_', ' ')) || '. Motivo: ' || p.motivo,
  p.autorizado_por,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM permisos AS p
WHERE p.estado = 'APROBADO'
  AND NOT EXISTS (
    SELECT 1
    FROM vacaciones AS v
    WHERE v.observacion LIKE ('[PERMISO:' || p.id || ']%')
  );