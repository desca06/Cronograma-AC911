"use client";

import { useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  aprobarVacacion,
  rechazarVacacion,
} from "../actions";

type BotonesAutorizacionProps = {
  vacacionId: number;
  empleado: string;
};

function BotonConfirmar({
  tipo,
}: {
  tipo: "APROBAR" | "RECHAZAR";
}) {
  const { pending } = useFormStatus();

  const esAprobar = tipo === "APROBAR";

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        esAprobar
          ? "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {pending ? (
        <>
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
          Procesando...
        </>
      ) : esAprobar ? (
        <>
          <CheckCircle2 size={18} />
          Sí, aprobar
        </>
      ) : (
        <>
          <XCircle size={18} />
          Sí, rechazar
        </>
      )}
    </button>
  );
}

export function BotonesAutorizacion({
  vacacionId,
  empleado,
}: BotonesAutorizacionProps) {
  const [accion, setAccion] = useState<
    "APROBAR" | "RECHAZAR" | null
  >(null);

  const aprobarActual =
    aprobarVacacion.bind(null, vacacionId);

  const rechazarActual =
    rechazarVacacion.bind(null, vacacionId);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setAccion("RECHAZAR")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          <XCircle size={18} />
          Rechazar
        </button>

        <button
          type="button"
          onClick={() => setAccion("APROBAR")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <CheckCircle2 size={18} />
          Aprobar
        </button>
      </div>

      {accion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                accion === "APROBAR"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {accion === "APROBAR" ? (
                <CheckCircle2 size={25} />
              ) : (
                <XCircle size={25} />
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {accion === "APROBAR"
                ? "Aprobar vacaciones"
                : "Rechazar vacaciones"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {accion === "APROBAR"
                ? `¿Confirmás que deseas aprobar la solicitud de vacaciones de ${empleado}?`
                : `¿Confirmás que deseas rechazar la solicitud de vacaciones de ${empleado}?`}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAccion(null)}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <form
                action={
                  accion === "APROBAR"
                    ? aprobarActual
                    : rechazarActual
                }
              >
                <BotonConfirmar tipo={accion} />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}