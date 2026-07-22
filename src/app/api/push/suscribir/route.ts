import { db } from "@/db";
import { suscripcionesPush } from "@/db/schema";
import { obtenerSesion } from "@/lib/auth";

type CuerpoSuscripcion = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

export async function POST(request: Request) {
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

    const cuerpo =
      (await request.json()) as CuerpoSuscripcion;

    const endpoint = cuerpo.endpoint;
    const p256dh = cuerpo.keys?.p256dh;
    const auth = cuerpo.keys?.auth;

    if (
      typeof endpoint !== "string" ||
      !endpoint.trim() ||
      typeof p256dh !== "string" ||
      !p256dh.trim() ||
      typeof auth !== "string" ||
      !auth.trim()
    ) {
      return Response.json(
        {
          error:
            "La suscripción push recibida no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    const navegador =
      request.headers.get("user-agent") ?? null;

    await db
      .insert(suscripcionesPush)
      .values({
        usuarioId: sesion.usuarioId,
        endpoint,
        p256dh,
        auth,
        navegador,
      })
      .onConflictDoUpdate({
        target: suscripcionesPush.endpoint,
        set: {
          usuarioId: sesion.usuarioId,
          p256dh,
          auth,
          navegador,
          actualizadoEn: new Date().toISOString(),
        },
      });

    return Response.json({
      ok: true,
      mensaje:
        "Suscripción push guardada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error al guardar la suscripción push:",
      error,
    );

    return Response.json(
      {
        error:
          "No se pudo guardar la suscripción push.",
      },
      {
        status: 500,
      },
    );
  }
}