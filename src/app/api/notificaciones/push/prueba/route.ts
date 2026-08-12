import {
  obtenerSesion,
} from "@/lib/auth";
import {
  enviarPushAUsuarios,
} from "@/lib/push";

export async function POST() {
  try {
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
          error:
            "Este usuario todavía no tiene un celular/navegador registrado.",
          resultado,
        },
        {
          status: 404,
        },
      );
    }

    return Response.json({
      ok: true,
      resultado,
    });
  } catch (error) {
    console.error(
      "[AC911 PUSH PRUEBA]",
      error,
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la notificación de prueba.",
      },
      {
        status: 500,
      },
    );
  }
}