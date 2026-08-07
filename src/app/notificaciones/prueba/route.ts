import { obtenerSesion } from "@/lib/auth";
import { enviarPushUsuarios } from "@/lib/onesignal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
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

  const resultado = await enviarPushUsuarios({
    usuarioIds: [sesion.usuarioId],
    titulo: "AC911 · Notificación de prueba",
    mensaje:
      `Hola ${sesion.nombre}. ` +
      "Las alertas externas de AC911 ya están funcionando.",
    url: "/notificaciones/configuracion",
  });

  if (!resultado.ok) {
    return Response.json(
      {
        error:
          resultado.error ||
          "OneSignal no pudo enviar la notificación.",
      },
      {
        status: 502,
      },
    );
  }

  return Response.json({
    ok: true,
    mensaje: "Notificación enviada. Revisá este dispositivo.",
    id: resultado.id ?? null,
  });
}