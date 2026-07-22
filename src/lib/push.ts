import * as webPush from "web-push";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  suscripcionesPush,
} from "@/db/schema";

type DatosPush = {
  titulo: string;
  mensaje: string;
  url?: string;
};

export async function enviarPushAUsuarios(
  usuarioIds: number[],
  datos: DatosPush,
): Promise<void> {
  const idsUnicos = [
    ...new Set(
      usuarioIds.filter(
        (id) =>
          Number.isInteger(id) &&
          id > 0,
      ),
    ),
  ];

  if (idsUnicos.length === 0) {
    return;
  }

  const clavePublica =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const clavePrivada =
    process.env.VAPID_PRIVATE_KEY;

  const asunto =
    process.env.VAPID_SUBJECT;

  if (
    !clavePublica ||
    !clavePrivada ||
    !asunto
  ) {
    console.error(
      "No están configuradas las variables VAPID.",
    );
    return;
  }

  webPush.setVapidDetails(
    asunto,
    clavePublica,
    clavePrivada,
  );

  const suscripciones = await db
    .select()
    .from(suscripcionesPush)
    .where(
      inArray(
        suscripcionesPush.usuarioId,
        idsUnicos,
      ),
    );

  const payload = JSON.stringify({
    titulo: datos.titulo,
    mensaje: datos.mensaje,
    url:
      datos.url ??
      "/notificaciones",
  });

  for (const suscripcion of suscripciones) {
    try {
      await webPush.sendNotification(
        {
          endpoint:
            suscripcion.endpoint,
          keys: {
            p256dh:
              suscripcion.p256dh,
            auth:
              suscripcion.auth,
          },
        },
        payload,
      );
    } catch (error) {
      const errorPush =
        error as {
          statusCode?: number;
        };

      console.error(
        "No se pudo enviar una notificación push:",
        error,
      );

      if (
        errorPush.statusCode === 404 ||
        errorPush.statusCode === 410
      ) {
        await db
          .delete(suscripcionesPush)
          .where(
            eq(
              suscripcionesPush.endpoint,
              suscripcion.endpoint,
            ),
          );
      }
    }
  }
}