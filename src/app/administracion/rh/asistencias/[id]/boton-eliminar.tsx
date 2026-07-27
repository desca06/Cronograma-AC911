"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

import { eliminarAsistencia } from "../actions";

type BotonEliminarProps = {
  asistenciaId: number;
  empleado: string;
};

export function BotonEliminar({
  asistenciaId,
  empleado,
}: BotonEliminarProps) {
  const [confirmando, setConfirmando] = useState(false);

  const eliminarRegistro =
    eliminarAsistencia.bind(null, asistenciaId);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        <Trash2 size={17} />
        Eliminar
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Eliminar asistencia
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              ¿Estás seguro de eliminar el registro de{" "}
              <span className="font-semibold text-slate-900">
                {empleado}
              </span>
              ?
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar confirmación"
          >
            <X size={19} />
          </button>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Esta acción eliminará permanentemente la asistencia
          y no se puede deshacer.
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="inline-flex justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancelar
          </button>

          <form action={eliminarRegistro}>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Trash2 size={17} />
              Sí, eliminar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}