"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { eliminarExpediente } from "../actions";

type BotonEliminarProps = {
  expedienteId: number;
  codigo: string;
};

function BotonConfirmar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
          Eliminando...
        </>
      ) : (
        <>
          <Trash2 size={17} />
          Eliminar expediente
        </>
      )}
    </button>
  );
}

export function BotonEliminar({
  expedienteId,
  codigo,
}: BotonEliminarProps) {
  const eliminarActual = eliminarExpediente.bind(
    null,
    expedienteId,
  );

  function confirmarEliminacion(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    const confirmado = window.confirm(
      `¿Estás seguro de eliminar el expediente ${codigo}?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      evento.preventDefault();
    }
  }

  return (
    <form
      action={eliminarActual}
      onSubmit={confirmarEliminacion}
    >
      <BotonConfirmar />
    </form>
  );
}