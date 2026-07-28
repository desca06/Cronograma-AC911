"use client";

import { useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  aprobarPermiso,
  rechazarPermiso,
} from "@/app/administracion/rh/permisos/actions";

type Accion = "APROBAR" | "RECHAZAR";

type BotonesAutorizacionProps = {
  permisoId: number;
  empleado: string;
  permitido: boolean;
};

function BotonConfirmar({
  accion,
}: {
  accion: Accion;
}) {
  const { pending } = useFormStatus();

  const aprobar = accion === "APROBAR";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
        aprobar
          ? "bg-emerald-600 hover:bg-emerald-700"
          : "bg-red-600 hover:bg-red-700"
      }`}
    >
      {pending ? (
        <>
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
          Procesando...
        </>
      ) : aprobar ? (
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
  permisoId,
  empleado,
  permitido,
}: BotonesAutorizacionProps) {
  const [accion, setAccion] =
    useState<Accion | null>(null);

  const aprobarActual =
    aprobarPermiso.bind(null, permisoId);

  const rechazarActual =
    rechazarPermiso.bind(null, permisoId);

  if (!permitido) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-400"
        >
          <CheckCircle2 size={17} />
          Aprobar
        </button>

        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-400"
        >
          <XCircle size={17} />
          Rechazar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setAccion("APROBAR")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <CheckCircle2 size={17} />
          Aprobar
        </button>

        <button
          type="button"
          onClick={() => setAccion("RECHAZAR")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <XCircle size={17} />
          Rechazar
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
              <TriangleAlert size={25} />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {accion === "APROBAR"
                ? "Aprobar permiso"
                : "Rechazar permiso"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              ¿Confirmás que deseas{" "}
              {accion === "APROBAR"
                ? "aprobar"
                : "rechazar"}{" "}
              el permiso de{" "}
              <span className="font-bold text-slate-900">
                {empleado}
              </span>
              ?
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
                <BotonConfirmar accion={accion} />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}