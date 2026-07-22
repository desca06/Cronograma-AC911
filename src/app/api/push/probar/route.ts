import webPush from "web-push";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { suscripcionesPush } from "@/db/schema";
import { obtenerSesion } from "@/lib/auth";

export async function POST() {
  try {
    const sesion = await obtenerSesion();

    if (!sesion) {
      return Response.json(
        {
          error: "No hay una sesión activa.",
        },
        {
          status: 401,
        },
      );
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
      return Response.json(
        {
          error:
            "Faltan las variables VAPID.",
        },
        {
          status: 500,
        },
      );
    }

    webPush.setVapidDetails(
      asunto,
      clavePublica,
      clavePrivada,
    );

    const suscripciones =
      await db
        .select()
        .from(suscripcionesPush)
        .where(
          eq(
            suscripcionesPush.usuarioId,
            sesion.usuarioId,
          ),
        );

    if (suscripciones.length === 0) {
      return Response.json(
        {
          error:
            "Este usuario no tiene suscripciones push.",
        },
        {
          status: 404,
        },
      );
    }

    const payload = JSON.stringify({
      titulo: "AC911",
      mensaje:
        "Esta es tu primera notificación push real 🔥",
      url: "/notificaciones",
    });

    let enviadas = 0;

    for (const suscripcion of suscripciones) {
      try {
        await webPush.sendNotification(
          {
            endpoint: suscripcion.endpoint,
            keys: {
              p256dh: suscripcion.p256dh,
              auth: suscripcion.auth,
            },
          },
          payload,
        );

        enviadas++;
      } catch (error) {
        console.error(
          "Error enviando push:",
          error,
        );
      }
    }

    return Response.json({
      ok: true,
      enviadas,
      mensaje: `Se enviaron ${enviadas} notificaciones.`,
    });
  } catch (error) {
    console.error(
      "Error al probar notificaciones push:",
      error,
    );

    return Response.json(
      {
        error:
          "No se pudo enviar la notificación.",
      },
      {
        status: 500,
      },
    );
  }
}