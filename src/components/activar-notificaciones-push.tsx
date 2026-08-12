"use client";

import {
  BellRing,
  CheckCircle2,
  LoaderCircle,
  Send,
  ShieldAlert,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

type EstadoPush =
  | "verificando"
  | "inactivo"
  | "activo"
  | "bloqueado"
  | "no-compatible";

function urlBase64ToUint8Array(
  base64String: string,
) {
  const padding =
    "=".repeat(
      (
        4 -
        (
          base64String.length %
          4
        )
      ) %
        4,
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (caracter) =>
        caracter.charCodeAt(0),
    ),
  );
}

async function obtenerRegistroServiceWorker() {
  const registroExistente =
    await navigator.serviceWorker.getRegistration(
      "/",
    );

  if (registroExistente) {
    return registroExistente;
  }

  return navigator.serviceWorker.register(
    "/sw.js",
    {
      scope: "/",
    },
  );
}

export function ActivarNotificacionesPush() {
  const [
    estado,
    setEstado,
  ] = useState<EstadoPush>(
    "verificando",
  );

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    probando,
    setProbando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  useEffect(() => {
    let activo = true;

    async function verificar() {
      try {
        if (
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {
          if (activo) {
            setEstado(
              "no-compatible",
            );
          }

          return;
        }

        if (
          Notification.permission ===
          "denied"
        ) {
          if (activo) {
            setEstado(
              "bloqueado",
            );
          }

          return;
        }

        const registro =
          await navigator.serviceWorker.getRegistration(
            "/",
          );

        const suscripcion =
          registro
            ? await registro.pushManager.getSubscription()
            : null;

        if (activo) {
          setEstado(
            suscripcion
              ? "activo"
              : "inactivo",
          );
        }
      } catch {
        if (activo) {
          setEstado(
            "inactivo",
          );
        }
      }
    }

    void verificar();

    return () => {
      activo = false;
    };
  }, []);

  async function guardarSuscripcion(
    suscripcion: PushSubscription,
  ) {
    const json =
      suscripcion.toJSON();

    const respuesta =
      await fetch(
        "/api/push/suscribir",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            endpoint:
              json.endpoint,
            keys:
              json.keys,
            navegador:
              navigator.userAgent,
          }),
        },
      );

    const resultado =
      await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error ??
          "No se pudo guardar la suscripción.",
      );
    }
  }

  async function activar() {
    setCargando(true);
    setMensaje("");

    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setEstado(
          "no-compatible",
        );

        throw new Error(
          "Este navegador no soporta notificaciones Push.",
        );
      }

      const clavePublica =
        process.env
          .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!clavePublica) {
        throw new Error(
          "Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en el .env.",
        );
      }

      const permiso =
        await Notification.requestPermission();

      if (
        permiso !== "granted"
      ) {
        setEstado(
          permiso === "denied"
            ? "bloqueado"
            : "inactivo",
        );

        throw new Error(
          "Debes permitir las notificaciones del navegador.",
        );
      }

      const registro =
        await obtenerRegistroServiceWorker();

      await navigator.serviceWorker.ready;

      let suscripcion =
        await registro.pushManager.getSubscription();

      if (!suscripcion) {
        suscripcion =
          await registro.pushManager.subscribe(
            {
              userVisibleOnly:
                true,
              applicationServerKey:
                urlBase64ToUint8Array(
                  clavePublica,
                ),
            },
          );
      }

      await guardarSuscripcion(
        suscripcion,
      );

      setEstado("activo");
      setMensaje(
        "Listo. Este dispositivo quedó registrado para recibir avisos de AC911.",
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudieron activar las notificaciones.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function enviarPrueba() {
    setProbando(true);
    setMensaje("");

    try {
      const respuesta =
        await fetch(
          "/api/notificaciones/push/prueba",
          {
            method: "POST",
          },
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ??
            "No se pudo enviar la notificación de prueba.",
        );
      }

      const enviadas =
        resultado.resultado
          ?.enviadas ?? 0;

      setMensaje(
        enviadas > 0
          ? `Prueba enviada. Se enviaron ${enviadas} notificación${enviadas === 1 ? "" : "es"}.`
          : "La prueba terminó, pero no se envió ninguna notificación.",
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la prueba.",
      );
    } finally {
      setProbando(false);
    }
  }

  const activo =
    estado === "activo";

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${
        activo
          ? "border-emerald-200 bg-emerald-50"
          : estado === "bloqueado"
            ? "border-red-200 bg-red-50"
            : "border-blue-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
              activo
                ? "bg-emerald-100 text-emerald-700"
                : estado === "bloqueado"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
            }`}
          >
            {estado ===
            "verificando" ? (
              <LoaderCircle
                size={24}
                className="animate-spin"
              />
            ) : activo ? (
              <CheckCircle2
                size={24}
              />
            ) : estado ===
              "bloqueado" ? (
              <ShieldAlert
                size={24}
              />
            ) : (
              <BellRing
                size={24}
              />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Notificaciones en este dispositivo
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  activo
                    ? "bg-emerald-100 text-emerald-800"
                    : estado === "bloqueado"
                      ? "bg-red-100 text-red-800"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {estado ===
                "verificando"
                  ? "Verificando"
                  : activo
                    ? "Activas"
                    : estado ===
                        "bloqueado"
                      ? "Bloqueadas"
                      : "No activas"}
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Activa este teléfono o navegador una sola vez para recibir nuevos trabajos y cambios aunque AC911 no esté abierta.
            </p>

            {estado ===
              "bloqueado" && (
              <p className="mt-2 text-sm font-semibold text-red-700">
                Chrome tiene bloqueado el permiso. Debes habilitar las notificaciones para este sitio desde la configuración del navegador.
              </p>
            )}

            {estado ===
              "no-compatible" && (
              <p className="mt-2 text-sm font-semibold text-red-700">
                Este navegador o este origen no permite Web Push.
              </p>
            )}

            {mensaje && (
              <p
                className={`mt-3 text-sm font-semibold ${
                  mensaje.startsWith(
                    "Listo",
                  ) ||
                  mensaje.startsWith(
                    "Prueba enviada",
                  )
                    ? "text-emerald-700"
                    : "text-slate-700"
                }`}
              >
                {mensaje}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={activar}
            disabled={
              cargando ||
              estado ===
                "no-compatible"
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : activo ? (
              <CheckCircle2
                size={18}
              />
            ) : (
              <BellRing
                size={18}
              />
            )}

            {cargando
              ? "Activando..."
              : activo
                ? "Revalidar dispositivo"
                : "Activar notificaciones"}
          </button>

          {activo && (
            <button
              type="button"
              onClick={
                enviarPrueba
              }
              disabled={
                probando
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {probando ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={18}
                />
              )}

              {probando
                ? "Enviando..."
                : "Enviar prueba"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}