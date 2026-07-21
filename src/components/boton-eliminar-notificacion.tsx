"use client";

import { useFormStatus } from "react-dom";

type BotonEliminarNotificacionProps = {
  notificacionId: number;
  titulo: string;
  action: (formData: FormData) => Promise<void>;
};

function BotonSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title="Eliminar notificación"
      aria-label="Eliminar notificación"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Eliminando..." : "🗑️ Eliminar"}
    </button>
  );
}

export function BotonEliminarNotificacion({
  notificacionId,
  titulo,
  action,
}: BotonEliminarNotificacionProps) {
  function confirmarEliminacion(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar la notificación "${titulo}"?`,
    );

    if (!confirmado) {
      evento.preventDefault();
    }
  }

  return (
    <form
      action={action}
      onSubmit={confirmarEliminacion}
    >
      <input
        type="hidden"
        name="notificacionId"
        value={notificacionId}
      />

      <BotonSubmit />
    </form>
  );
}