"use client";

import { useState } from "react";
import {
  LoaderCircle,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import { eliminarPermiso } from "../actions";

type BotonEliminarProps = {
  permisoId: number;
  empleado: string;
  permitido: boolean;
};

function BotonConfirmar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
          Eliminando...
        </>
      ) : (
        <>
          <Trash2 size={18} />
          Sí, eliminar
        </>
      )}
    </button>
  );
}

export function BotonEliminar({
  permisoId,
  empleado,
  permitido,
}: BotonEliminarProps) {
  const [abierto, setAbierto] = useState(false);

  const eliminarActual =
    eliminarPermiso.bind(null, permisoId);

  return (
    <>
      <button
        type="button"
        disabled={!permitido}
        onClick={() => setAbierto(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          permitido
            ? "bg-red-600 text-white hover:bg-red-700"
            : "cursor-not-allowed bg-red-100 text-red-400"
        }`}
      >
        <Trash2 size={17} />
        Eliminar
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <TriangleAlert size={26} />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Eliminar permiso
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              ¿Deseás eliminar el permiso de{" "}
              <span className="font-bold text-slate-900">
                {empleado}
              </span>
              ?
            </p>

            <p className="mt-2 text-sm text-red-600">
              Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <form action={eliminarActual}>
                <BotonConfirmar />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}