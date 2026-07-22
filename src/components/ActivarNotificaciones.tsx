"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

type Estado =
  | "inactivo"
  | "cargando"
  | "activado"
  | "bloqueado"
  | "no-compatible"
  | "error";

function convertirBase64AUint8Array(
  claveBase64: string,
): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat(
    (4 - (claveBase64.length % 4)) % 4,
  );

  const base64 = (
    claveBase64 + relleno
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const datosCrudos = window.atob(base64);

  return Uint8Array.from(
    [...datosCrudos].map((caracter) =>
      caracter.charCodeAt(0),
    ),
  );
}

export default function ActivarNotificaciones() {
  const [estado, setEstado] = useState<Estado>("inactivo");
  const [mensaje, setMensaje] = useState("");

  async function activarNotificaciones() {
    try {
      setEstado("cargando");
      setMensaje("");

      if (
        !("serviceWorker" in navigator) ||
        !("Notification" in window)
      ) {
        setEstado("no-compatible");
        setMensaje(
          "Este navegador no admite notificaciones.",
        );
        return;
      }

      const registro =
        await navigator.serviceWorker.register("/sw.js");

      await navigator.serviceWorker.ready;

      const permiso =
        await Notification.requestPermission();

      if (permiso === "denied") {
        setEstado("bloqueado");
        setMensaje(
          "Las notificaciones fueron bloqueadas.",
        );
        return;
      }

      if (permiso !== "granted") {
        setEstado("inactivo");
        setMensaje(
          "No se concedió permiso para notificaciones.",
        );
        return;
      }

      const clavePublica =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

if (!clavePublica) {
  throw new Error(
    "No está configurada NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  );
}

let suscripcion =
  await registro.pushManager.getSubscription();

if (!suscripcion) {
  suscripcion =
    await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey:
        convertirBase64AUint8Array(
          clavePublica,
        ),
    });
}

const respuesta = await fetch(
  "/api/push/suscribir",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      suscripcion.toJSON(),
    ),
  },
);

const resultado = await respuesta.json();

if (!respuesta.ok) {
  throw new Error(
    resultado.error ??
      "No se pudo guardar la suscripción.",
  );
}

console.log(
  "Suscripción guardada:",
  resultado,
);

console.log(
  "Suscripción push creada:",
  suscripcion.toJSON(),
);

await registro.showNotification("AC911", {
  body: "El dispositivo quedó registrado para notificaciones push.",
  icon: "/icons/icon-192x192.png",
  badge: "/icons/icon-192x192.png",
  tag: "ac911-activacion",
});

setEstado("activado");
      setMensaje(
        "Notificaciones activadas correctamente.",
      );
    } catch (error) {
      console.error(
        "Error al activar las notificaciones:",
        error,
      );

      setEstado("error");
      setMensaje(
        "No se pudieron activar las notificaciones.",
      );
    }
  }

  if (estado === "activado") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 font-medium text-green-700">
          <Bell className="h-5 w-5" />
          Notificaciones activadas
        </div>

        <p className="mt-1 text-sm text-green-600">
          {mensaje}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
          {estado === "bloqueado" ? (
            <BellOff className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1">
          <p className="font-semibold">
            Notificaciones push
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Activá las notificaciones para recibir avisos
            de nuevos trabajos.
          </p>

          <button
            type="button"
            onClick={activarNotificaciones}
            disabled={estado === "cargando"}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {estado === "cargando" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Activar notificaciones
              </>
            )}
          </button>

          {mensaje && (
            <p
              className={`mt-2 text-sm ${
                estado === "bloqueado" ||
                estado === "error"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {mensaje}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}