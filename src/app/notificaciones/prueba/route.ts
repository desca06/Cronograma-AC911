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

/*
 * Ruta antigua conservada únicamente por compatibilidad.
 *
 * El sistema nuevo usa:
 * /api/notificaciones/push/prueba
 *
 * Esta ruta ya NO usa OneSignal.
 */
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
      resultado.suscripciones === 0
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Este usuario todavía no tiene un dispositivo registrado.",
          resultado,
        },
        {
          status: 404,
        },
      );
    }

    if (
      resultado.enviadas === 0
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Existe una suscripción, pero no se pudo enviar la notificación.",
          resultado,
        },
        {
          status: 502,
        },
      );
    }

    return Response.json({
      ok: true,
      mensaje:
        "Notificación enviada.",
      resultado,
    });
  } catch (error) {
    console.error(
      "[AC911 NOTIFICACIONES PRUEBA COMPATIBILIDAD]",
      error,
    );

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la notificación.",
      },
      {
        status: 500,
      },
    );
  }
}