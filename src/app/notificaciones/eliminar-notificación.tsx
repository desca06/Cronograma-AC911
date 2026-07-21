"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type BotonEliminarNotificacionProps = {
  notificacionId: number;
  action: (
    formData: FormData,
  ) => Promise<void>;
};

function BotonEnviar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Eliminar notificación"
      title="Eliminar notificación"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 size={18} />
    </button>
  );
}

export function BotonEliminarNotificacion({
  notificacionId,
  action,
}: BotonEliminarNotificacionProps) {
  function confirmarEliminacion(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    const confirmado = window.confirm(
      "¿Deseas eliminar esta notificación?",
    );

    if (!confirmado) {
      evento.preventDefault();
    }
  }

  return (
    <form
      action={action}
      onSubmit={confirmarEliminacion}
      onClick={(evento) =>
        evento.stopPropagation()
      }
      className="shrink-0"
    >
      <input
        type="hidden"
        name="notificacionId"
        value={notificacionId}
      />

      <BotonEnviar />
    </form>
  );
}