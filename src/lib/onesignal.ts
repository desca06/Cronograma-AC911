import "server-only";

type EnviarPushOpciones = {
  usuarioIds: number[];
  titulo: string;
  mensaje: string;
  url?: string;
};

export type ResultadoPush = {
  ok: boolean;
  id?: string;
  destinatarios: number;
  error?: string;
};

export function externalIdUsuario(usuarioId: number) {
  return `usuario-${usuarioId}`;
}

function obtenerUrlAbsoluta(ruta?: string) {
  if (!ruta) return undefined;

  if (ruta.startsWith("http://") || ruta.startsWith("https://")) {
    return ruta;
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!base) return undefined;

  try {
    return new URL(ruta, base).toString();
  } catch {
    return undefined;
  }
}

export async function enviarPushUsuarios({
  usuarioIds,
  titulo,
  mensaje,
  url,
}: EnviarPushOpciones): Promise<ResultadoPush> {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  const ids = [
    ...new Set(
      usuarioIds.filter(
        (id) => Number.isInteger(id) && id > 0,
      ),
    ),
  ];

  if (ids.length === 0) {
    return {
      ok: true,
      destinatarios: 0,
    };
  }

  if (!appId || !apiKey) {
    console.warn(
      "OneSignal: faltan NEXT_PUBLIC_ONESIGNAL_APP_ID u ONESIGNAL_REST_API_KEY.",
    );

    return {
      ok: false,
      destinatarios: ids.length,
      error: "Faltan variables de entorno de OneSignal.",
    };
  }

  const urlAbsoluta = obtenerUrlAbsoluta(url);

  const body: Record<string, unknown> = {
    app_id: appId,
    target_channel: "push",
    include_aliases: {
      external_id: ids.map(externalIdUsuario),
    },
    headings: {
      en: titulo,
      es: titulo,
    },
    contents: {
      en: mensaje,
      es: mensaje,
    },
  };

  if (urlAbsoluta) {
    body.url = urlAbsoluta;
  }

  try {
    const response = await fetch(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as {
      id?: string;
      errors?: string[] | Record<string, unknown>;
    };

    if (!response.ok) {
      const detalle = data.errors
        ? JSON.stringify(data.errors)
        : `HTTP ${response.status}`;

      console.error("OneSignal rechazó el push:", detalle);

      return {
        ok: false,
        destinatarios: ids.length,
        error: detalle,
      };
    }

    return {
      ok: true,
      id: data.id,
      destinatarios: ids.length,
    };
  } catch (error) {
    console.error("Error enviando push con OneSignal:", error);

    return {
      ok: false,
      destinatarios: ids.length,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido enviando push.",
    };
  }
}