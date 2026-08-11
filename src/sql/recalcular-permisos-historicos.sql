UPDATE "permisos"
SET
  "afecta_vacaciones" = false,
  "dias_descontados_vacaciones" = 0
WHERE "estado" = 'APROBADO';


UPDATE "permisos" p
SET
  "afecta_vacaciones" = true,
  "dias_descontados_vacaciones" =
    GREATEST(COALESCE(p."dias_solicitados", 1), 1)
WHERE
  p."estado" = 'APROBADO'
  AND (
    (
      SELECT MIN(v."fecha_inicio")
      FROM "vacaciones" v
      WHERE
        v."empleado_id" = p."empleado_id"
        AND v."estado" = 'APROBADA'
        AND EXTRACT(YEAR FROM v."fecha_inicio")
            = EXTRACT(YEAR FROM p."fecha")
        AND (
          v."observacion" IS NULL
          OR v."observacion" NOT LIKE '[PERMISO:%'
        )
    ) IS NULL
    OR p."fecha" < (
      SELECT MIN(v."fecha_inicio")
      FROM "vacaciones" v
      WHERE
        v."empleado_id" = p."empleado_id"
        AND v."estado" = 'APROBADA'
        AND EXTRACT(YEAR FROM v."fecha_inicio")
            = EXTRACT(YEAR FROM p."fecha")
        AND (
          v."observacion" IS NULL
          OR v."observacion" NOT LIKE '[PERMISO:%'
        )
    )
  );