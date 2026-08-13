import "server-only";

import {
  eq,
  inArray,
} from "drizzle-orm";
import * as webPush from "web-push";

import { db } from "@/db";
import {
  suscripcionesPush,
} from "@/db/schema";

export type ResultadoPush = {
  usuarios: number;
  suscripciones: number;
  enviadas: number;
  fallidas: number;
  eliminadas: number;
  errores: string[];
};

type DatosPush = {
  titulo: string;
  mensaje: string;
  url?: string;
};

let vapidConfigurado = false;

function obtenerMensajeError(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  try {
    return JSON.stringify(
      error,
    );
  } catch {
    return "Error desconocido.";
  }
}

function configurarVapid(): void {
  if (vapidConfigurado) {
    return;
  }

  const clavePublica =
    process.env
      .NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ?.trim();

  const clavePrivada =
    process.env
      .VAPID_PRIVATE_KEY
      ?.trim();

  const asunto =
    process.env
      .VAPID_SUBJECT
      ?.trim();

  if (
    !clavePublica ||
    !clavePrivada ||
    !asunto
  ) {
    throw new Error(
      "Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o VAPID_SUBJECT.",
    );
  }

  if (
    !(
      asunto.startsWith(
        "mailto:",
      ) ||
      asunto.startsWith(
        "https://",
      )
    )
  ) {
    throw new Error(
      'VAPID_SUBJECT debe comenzar con "mailto:" o "https://".',
    );
  }

  try {
    webPush.setVapidDetails(
      asunto,
      clavePublica,
      clavePrivada,
    );

    vapidConfigurado =
      true;
  } catch (error) {
    throw new Error(
      `No se pudo configurar VAPID: ${obtenerMensajeError(error)}`,
    );
  }
}

export async function enviarPushAUsuarios(
  usuarioIds: number[],
  datos: DatosPush,
): Promise<ResultadoPush> {
  const idsUnicos = [
    ...new Set(
      usuarioIds.filter(
        (id) =>
          Number.isInteger(id) &&
          id > 0,
      ),
    ),
  ];

  if (
    idsUnicos.length ===
    0
  ) {
    return {
      usuarios: 0,
      suscripciones: 0,
      enviadas: 0,
      fallidas: 0,
      eliminadas: 0,
      errores: [],
    };
  }

  configurarVapid();

  const suscripciones =
    await db
      .select({
        id:
          suscripcionesPush.id,
        usuarioId:
          suscripcionesPush.usuarioId,
        endpoint:
          suscripcionesPush.endpoint,
        p256dh:
          suscripcionesPush.p256dh,
        auth:
          suscripcionesPush.auth,
      })
      .from(
        suscripcionesPush,
      )
      .where(
        inArray(
          suscripcionesPush.usuarioId,
          idsUnicos,
        ),
      );

  const payload =
    JSON.stringify({
      titulo:
        datos.titulo,
      mensaje:
        datos.mensaje,
      url:
        datos.url ??
        "/notificaciones",
    });

  let enviadas = 0;
  let fallidas = 0;
  let eliminadas = 0;

  const errores: string[] =
    [];

  for (
    const suscripcion
    of suscripciones
  ) {
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

      enviadas += 1;
    } catch (error) {
      fallidas += 1;

      const errorPush =
        error as {
          statusCode?: number;
          body?: string;
          headers?: unknown;
        };

      const detalle =
        [
          `Usuario ${suscripcion.usuarioId}`,
          errorPush.statusCode
            ? `HTTP ${errorPush.statusCode}`
            : null,
          obtenerMensajeError(
            error,
          ),
          errorPush.body
            ? `Respuesta: ${errorPush.body}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

      errores.push(
        detalle,
      );

      console.error(
        "[AC911 PUSH]",
        detalle,
        error,
      );

      if (
        errorPush.statusCode ===
          404 ||
        errorPush.statusCode ===
          410
      ) {
        await db
          .delete(
            suscripcionesPush,
          )
          .where(
            eq(
              suscripcionesPush.endpoint,
              suscripcion.endpoint,
            ),
          );

        eliminadas += 1;
      }
    }
  }

  return {
    usuarios:
      idsUnicos.length,
    suscripciones:
      suscripciones.length,
    enviadas,
    fallidas,
    eliminadas,
    errores,
  };
}