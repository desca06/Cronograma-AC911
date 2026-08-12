import {
  eq,
} from "drizzle-orm";

import { db } from "@/db";
import {
  suscripcionesPush,
} from "@/db/schema";
import {
  obtenerSesion,
} from "@/lib/auth";

type SuscripcionEntrada = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
  navegador?: unknown;
};

export async function POST(
  request: Request,
) {
  const sesion =
    await obtenerSesion();

  if (!sesion) {
    return Response.json(
      {
        error:
          "No hay una sesión activa.",
      },
      {
        status: 401,
      },
    );
  }

  const body =
    await request.json() as SuscripcionEntrada;

  const endpoint =
    typeof body.endpoint ===
    "string"
      ? body.endpoint.trim()
      : "";

  const p256dh =
    typeof body.keys
      ?.p256dh === "string"
      ? body.keys.p256dh.trim()
      : "";

  const auth =
    typeof body.keys
      ?.auth === "string"
      ? body.keys.auth.trim()
      : "";

  const navegador =
    typeof body.navegador ===
    "string"
      ? body.navegador
          .trim()
          .slice(
            0,
            500,
          )
      : null;

  if (
    !endpoint ||
    !p256dh ||
    !auth
  ) {
    return Response.json(
      {
        error:
          "Suscripción push inválida.",
      },
      {
        status: 400,
      },
    );
  }

  const [existente] =
    await db
      .select({
        id:
          suscripcionesPush.id,
      })
      .from(
        suscripcionesPush,
      )
      .where(
        eq(
          suscripcionesPush.endpoint,
          endpoint,
        ),
      )
      .limit(1);

  if (existente) {
    await db
      .update(
        suscripcionesPush,
      )
      .set({
        usuarioId:
          sesion.usuarioId,
        p256dh,
        auth,
        navegador,
        actualizadoEn:
          new Date().toISOString(),
      })
      .where(
        eq(
          suscripcionesPush.id,
          existente.id,
        ),
      );
  } else {
    await db
      .insert(
        suscripcionesPush,
      )
      .values({
        usuarioId:
          sesion.usuarioId,
        endpoint,
        p256dh,
        auth,
        navegador,
      });
  }

  return Response.json({
    ok: true,
  });
}