"use client";

import {
  Bell,
  BellOff,
  CheckCircle2,
  LoaderCircle,
  Send,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  activarPushOneSignal,
  desactivarPushOneSignal,
  estadoPushOneSignal,
} from "@/lib/onesignal-client";

type EstadoPush = {
  soportado: boolean;
  permiso: boolean;
  suscrito: boolean;
};

export function NotificacionesPushPanel() {
  const [estado, setEstado] =
    useState<EstadoPush | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [accion, setAccion] = useState<
    "activar" | "desactivar" | "prueba" | null
  >(null);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const actualizarEstado = useCallback(
    async () => {
      try {
        const actual =
          await estadoPushOneSignal();

        setEstado(actual);
      } catch (err) {
        console.error(err);
        setError(
          "No se pudo consultar el estado de las notificaciones.",
        );
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    void actualizarEstado();
  }, [actualizarEstado]);

  async function activar() {
    setAccion("activar");
    setMensaje("");
    setError("");

    try {
      const nuevoEstado =
        await activarPushOneSignal();

      setEstado(nuevoEstado);

      setMensaje(
        "Notificaciones activadas correctamente en este dispositivo.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron activar las notificaciones.",
      );
    } finally {
      setAccion(null);
    }
  }

  async function desactivar() {
    setAccion("desactivar");
    setMensaje("");
    setError("");

    try {
      const nuevoEstado =
        await desactivarPushOneSignal();

      setEstado(nuevoEstado);

      setMensaje(
        "Las notificaciones push fueron desactivadas en este dispositivo.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron desactivar las notificaciones.",
      );
    } finally {
      setAccion(null);
    }
  }

  async function enviarPrueba() {
    setAccion("prueba");
    setMensaje("");
    setError("");

    try {
      const response = await fetch(
        "/api/notificaciones/push/prueba",
        {
          method: "POST",
        },
      );

      const data = (await response.json()) as {
        ok?: boolean;
        mensaje?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo enviar la notificación de prueba.",
        );
      }

      setMensaje(
        data.mensaje ||
          "Notificación enviada.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar la notificación de prueba.",
      );
    } finally {
      setAccion(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <LoaderCircle
          className="animate-spin text-blue-600"
          size={32}
        />
      </div>
    );
  }

  if (!estado?.soportado) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <TriangleAlert
            className="mt-0.5 text-amber-600"
            size={26}
          />

          <div>
            <h2 className="font-bold text-amber-950">
              Push no disponible
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Este navegador o dispositivo no permite
              notificaciones push en la configuración actual.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border p-6 ${
          estado.suscrito
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                estado.suscrito
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {estado.suscrito ? (
                <CheckCircle2 size={24} />
              ) : (
                <Smartphone size={24} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {estado.suscrito
                  ? "Este dispositivo recibe alertas"
                  : "Activar alertas en este dispositivo"}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                AC911 podrá avisarte cuando tengas un trabajo,
                cambio importante o una notificación administrativa,
                incluso cuando no tengas abierta la página.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  Permiso:{" "}
                  {estado.permiso
                    ? "Concedido"
                    : "Pendiente"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 ${
                    estado.suscrito
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  Push:{" "}
                  {estado.suscrito
                    ? "Activo"
                    : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {estado.suscrito ? (
              <>
                <button
                  type="button"
                  onClick={enviarPrueba}
                  disabled={accion !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {accion === "prueba" ? (
                    <LoaderCircle
                      className="animate-spin"
                      size={18}
                    />
                  ) : (
                    <Send size={18} />
                  )}
                  Enviar prueba
                </button>

                <button
                  type="button"
                  onClick={desactivar}
                  disabled={accion !== null}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {accion === "desactivar" ? (
                    <LoaderCircle
                      className="animate-spin"
                      size={18}
                    />
                  ) : (
                    <BellOff size={18} />
                  )}
                  Desactivar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={activar}
                disabled={accion !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {accion === "activar" ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <Bell size={18} />
                )}
                Activar notificaciones
              </button>
            )}
          </div>
        </div>
      </div>

      {mensaje && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}