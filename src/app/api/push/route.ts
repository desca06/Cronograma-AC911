import {
  obtenerSesion,
} from "@/lib/auth";
import {
  enviarPushAUsuarios,
} from "@/lib/push";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function POST() {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return Response.json(
        {
          ok: false,
          error:
            "No hay una sesión activa.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const resultado =
      await enviarPushAUsuarios(
        [
          sesion.usuarioId,
        ],
        {
          titulo:
            "AC911",
          mensaje:
            "Notificación push de prueba recibida correctamente.",
          url:
            "/notificaciones",
        },
      );

    if (
      resultado.suscripciones ===
      0
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "El usuario no tiene ninguna suscripción guardada en suscripciones_push.",
          resultado,
        },
        {
          status: 404,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    if (
      resultado.enviadas ===
      0
    ) {
      return Response.json(
        {
          ok: false,
          error:
            resultado.errores[0] ??
            "Existe una suscripción, pero el proveedor Web Push rechazó el envío.",
          resultado,
        },
        {
          status: 502,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    return Response.json(
      {
        ok: true,
        mensaje:
          "Notificación push enviada correctamente.",
        resultado,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo enviar la notificación.";

    console.error(
      "[AC911 PUSH PRUEBA]",
      error,
    );

    return Response.json(
      {
        ok: false,
        error:
          mensaje,
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}