const EXPRESION_PERMISO_ORIGEN =
  /^\[PERMISO:(\d+)\]\s*/;

export const DIAS_VACACIONES_ANUALES = 15;

type DatosObservacionPermiso = {
  permisoId: number;
  tipo: string;
  motivo: string;
};

const NOMBRES_TIPO_PERMISO: Record<
  string,
  string
> = {
  PERSONAL: "personal",
  CITA_MEDICA: "cita médica",
  ENFERMEDAD: "enfermedad",
};

function parsearFechaLocal(
  fecha: string,
): Date | null {
  const partes = fecha
    .split("-")
    .map(Number);

  if (partes.length !== 3) {
    return null;
  }

  const [anio, mes, dia] = partes;

  if (!anio || !mes || !dia) {
    return null;
  }

  const valor = new Date(
    Date.UTC(
      anio,
      mes - 1,
      dia,
    ),
  );

  if (
    Number.isNaN(
      valor.getTime(),
    )
  ) {
    return null;
  }

  return valor;
}

/*
 * Cuenta lunes a viernes.
 *
 * Por ahora no descuenta feriados oficiales porque
 * el proyecto todavía no tiene un calendario de
 * feriados. Esa regla puede agregarse después.
 */
export function calcularDiasHabiles(
  fechaInicio: string,
  fechaFin: string,
): number {
  const inicio =
    parsearFechaLocal(fechaInicio);

  const fin =
    parsearFechaLocal(fechaFin);

  if (!inicio || !fin) {
    return 0;
  }

  if (
    fin.getTime() <
    inicio.getTime()
  ) {
    return 0;
  }

  let total = 0;

  const actual = new Date(
    inicio.getTime(),
  );

  while (
    actual.getTime() <=
    fin.getTime()
  ) {
    const diaSemana =
      actual.getUTCDay();

    if (
      diaSemana !== 0 &&
      diaSemana !== 6
    ) {
      total += 1;
    }

    actual.setUTCDate(
      actual.getUTCDate() + 1,
    );
  }

  return total;
}

export function obtenerAnioFecha(
  fecha: string,
): number | null {
  const anio = Number(
    fecha.slice(0, 4),
  );

  return Number.isInteger(anio) &&
    anio >= 2000
    ? anio
    : null;
}

export function obtenerRangoAnual(
  fecha: string,
) {
  const anio =
    obtenerAnioFecha(fecha);

  if (!anio) {
    return null;
  }

  return {
    inicio: `${anio}-01-01`,
    fin: `${anio}-12-31`,
  };
}

export function calcularSaldoVacaciones(
  diasDescontadosPorPermisos: number,
) {
  return Math.max(
    0,
    DIAS_VACACIONES_ANUALES -
      Math.max(
        0,
        diasDescontadosPorPermisos,
      ),
  );
}

/*
 * Funciones LEGACY.
 *
 * Se mantienen para que registros viejos creados con
 * [PERMISO:id] sigan pudiendo identificarse.
 * La lógica nueva YA NO crea registros de vacaciones
 * por permiso.
 */
export function crearPrefijoVacacionPorPermiso(
  permisoId: number,
): string {
  return `[PERMISO:${permisoId}]`;
}

export function crearObservacionVacacionPorPermiso({
  permisoId,
  tipo,
  motivo,
}: DatosObservacionPermiso): string {
  const nombreTipo =
    NOMBRES_TIPO_PERMISO[tipo] ??
    tipo
      .toLowerCase()
      .replaceAll("_", " ");

  return `${crearPrefijoVacacionPorPermiso(
    permisoId,
  )} Registro histórico de la lógica anterior. Tipo ${nombreTipo}. Motivo: ${motivo}`;
}

export function obtenerPermisoOrigenId(
  observacion:
    | string
    | null
    | undefined,
): number | null {
  if (!observacion) {
    return null;
  }

  const coincidencia =
    observacion.match(
      EXPRESION_PERMISO_ORIGEN,
    );

  if (!coincidencia) {
    return null;
  }

  const permisoId = Number(
    coincidencia[1],
  );

  return Number.isInteger(
    permisoId,
  ) && permisoId > 0
    ? permisoId
    : null;
}

export function esVacacionGeneradaPorPermiso(
  observacion:
    | string
    | null
    | undefined,
): boolean {
  return (
    obtenerPermisoOrigenId(
      observacion,
    ) !== null
  );
}

export function limpiarObservacionVacacion(
  observacion:
    | string
    | null
    | undefined,
): string | null {
  if (!observacion) {
    return null;
  }

  const textoLimpio =
    observacion
      .replace(
        EXPRESION_PERMISO_ORIGEN,
        "",
      )
      .trim();

  return textoLimpio || null;
}


export function calcularSaldoAnualVacaciones(
  diasVacacionesAprobadas: number,
  diasDescontadosPorPermisos: number,
) {
  const usados =
    Math.max(
      0,
      diasVacacionesAprobadas,
    ) +
    Math.max(
      0,
      diasDescontadosPorPermisos,
    );

  return {
    total: DIAS_VACACIONES_ANUALES,
    usados,
    disponibles: Math.max(
      0,
      DIAS_VACACIONES_ANUALES - usados,
    ),
    agotado:
      usados >=
      DIAS_VACACIONES_ANUALES,
  };
}



export function permisoConsumeVacacionesPorFecha(
  fechaPermiso: string,
  primeraVacacionAprobada: string | null,
): boolean {
  if (!primeraVacacionAprobada) {
    return true;
  }

  return fechaPermiso < primeraVacacionAprobada;
}