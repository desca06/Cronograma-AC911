import "server-only";

import { db } from "@/db";
import { notificaciones } from "@/db/schema";

import {
  enviarPushUsuarios,
  type ResultadoPush,
} from "./onesignal";

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
        (id) => Number.isInteger(id) && id > 0,
      ),
    ),
  ];

  if (ids.length === 0) {
    return {
      creadas: 0,
      push: null,
    };
  }

  await db.insert(notificaciones).values(
    ids.map((usuarioId) => ({
      usuarioId,
      trabajoId:
        trabajoId && trabajoId > 0
          ? trabajoId
          : null,
      titulo,
      mensaje,
      tipo,
      leida: false,
    })),
  );

  const push = enviarPush
    ? await enviarPushUsuarios({
        usuarioIds: ids,
        titulo,
        mensaje,
        url,
      })
    : null;

  return {
    creadas: ids.length,
    push,
  };
}