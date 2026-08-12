import "server-only";

import { db } from "@/db";
import {
  notificaciones,
} from "@/db/schema";
import {
  enviarPushAUsuarios,
  type ResultadoPush,
} from "@/lib/push";

type CrearNotificacionOpciones = {
  usuarioIds: number[];
  titulo: string;
  mensaje: string;
  tipo?: string;
  trabajoId?: number | null;
  url?: string;
  enviarPush?: boolean;
};

export async function crearNotificacionConPush({
  usuarioIds,
  titulo,
  mensaje,
  tipo = "GENERAL",
  trabajoId = null,
  url,
  enviarPush = true,
}: CrearNotificacionOpciones): Promise<{
  creadas: number;
  push: ResultadoPush | null;
}> {
  const ids = [
    ...new Set(
      usuarioIds.filter(
        (id) =>
          Number.isInteger(id) &&
          id > 0,
      ),
    ),
  ];

  if (ids.length === 0) {
    return {
      creadas: 0,
      push: null,
    };
  }

  await db
    .insert(notificaciones)
    .values(
      ids.map(
        (usuarioId) => ({
          usuarioId,
          trabajoId:
            trabajoId &&
            trabajoId > 0
              ? trabajoId
              : null,
          titulo,
          mensaje,
          tipo,
          leida: false,
        }),
      ),
    );

  if (!enviarPush) {
    return {
      creadas:
        ids.length,
      push: null,
    };
  }

  try {
    const push =
      await enviarPushAUsuarios(
        ids,
        {
          titulo,
          mensaje,
          url:
            url ??
            (
              trabajoId
                ? `/mis-trabajos/${trabajoId}`
                : "/notificaciones"
            ),
        },
      );

    return {
      creadas:
        ids.length,
      push,
    };
  } catch (error) {
    /*
     * El trabajo y la notificación interna NO deben
     * fallar solo porque el teléfono no pudo recibir
     * Web Push o porque todavía no configuraron VAPID.
     */
    console.error(
      "[AC911 NOTIFICACIONES] La notificación interna se creó, pero el push falló:",
      error,
    );

    return {
      creadas:
        ids.length,
      push: null,
    };
  }
}

export async function notificarTrabajoAsignado(
  opciones: {
    usuarioIds: number[];
    trabajoId: number;
    tipoTrabajo: string;
    fecha: string;
  },
) {
  return crearNotificacionConPush({
    usuarioIds:
      opciones.usuarioIds,
    trabajoId:
      opciones.trabajoId,
    titulo:
      "Nuevo trabajo asignado",
    mensaje:
      `${opciones.tipoTrabajo} programado para el ${opciones.fecha}.`,
    tipo:
      "ASIGNACION",
    url:
      `/mis-trabajos/${opciones.trabajoId}`,
  });
}

export async function notificarEstadoTrabajo(
  opciones: {
    usuarioIds: number[];
    trabajoId: number;
    tipoTrabajo: string;
    fecha: string;
    estado: string;
  },
) {
  const cancelado =
    opciones.estado ===
    "Cancelado";

  return crearNotificacionConPush({
    usuarioIds:
      opciones.usuarioIds,
    trabajoId:
      opciones.trabajoId,
    titulo:
      cancelado
        ? "Trabajo cancelado"
        : "Estado actualizado",
    mensaje:
      `El trabajo "${opciones.tipoTrabajo}" del ${opciones.fecha} cambió a ${opciones.estado}.`,
    tipo:
      cancelado
        ? "CANCELACION"
        : "ESTADO",
    url:
      `/mis-trabajos/${opciones.trabajoId}`,
  });
}

export async function notificarTrabajoActualizado(
  opciones: {
    usuarioIds: number[];
    trabajoId: number;
    tipoTrabajo: string;
    fecha: string;
    horaInicio?: string | null;
  },
) {
  const detalleHora =
    opciones.horaInicio
      ? ` a las ${opciones.horaInicio}`
      : "";

  return crearNotificacionConPush({
    usuarioIds:
      opciones.usuarioIds,
    trabajoId:
      opciones.trabajoId,
    titulo:
      "Trabajo actualizado",
    mensaje:
      `${opciones.tipoTrabajo} fue actualizado para ${opciones.fecha}${detalleHora}.`,
    tipo:
      "ACTUALIZACION",
    url:
      `/mis-trabajos/${opciones.trabajoId}`,
  });
}