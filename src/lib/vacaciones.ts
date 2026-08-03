const EXPRESION_PERMISO_ORIGEN = /^\[PERMISO:(\d+)\]\s*/;

type DatosObservacionPermiso = {
  permisoId: number;
  tipo: string;
  motivo: string;
};

const NOMBRES_TIPO_PERMISO: Record<string, string> = {
  PERSONAL: "personal",
  CITA_MEDICA: "cita médica",
  ENFERMEDAD: "enfermedad",
};

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
    tipo.toLowerCase().replaceAll("_", " ");

  return `${crearPrefijoVacacionPorPermiso(
    permisoId,
  )} Descuento automático de 1 día de vacaciones por permiso aprobado de tipo ${nombreTipo}. Motivo: ${motivo}`;
}

export function obtenerPermisoOrigenId(
  observacion: string | null | undefined,
): number | null {
  if (!observacion) {
    return null;
  }

  const coincidencia = observacion.match(
    EXPRESION_PERMISO_ORIGEN,
  );

  if (!coincidencia) {
    return null;
  }

  const permisoId = Number(coincidencia[1]);

  return Number.isInteger(permisoId) && permisoId > 0
    ? permisoId
    : null;
}

export function esVacacionGeneradaPorPermiso(
  observacion: string | null | undefined,
): boolean {
  return obtenerPermisoOrigenId(observacion) !== null;
}

export function limpiarObservacionVacacion(
  observacion: string | null | undefined,
): string | null {
  if (!observacion) {
    return null;
  }

  const textoLimpio = observacion
    .replace(EXPRESION_PERMISO_ORIGEN, "")
    .trim();

  return textoLimpio || null;
}