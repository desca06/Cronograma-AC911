"use client";

import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

type BotonEliminarNotificacionProps = {
  notificacionId: number;
  titulo: string;
  action: (
    formData: FormData,
  ) => Promise<void>;
};

function BotonConfirmarEliminacion() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={18} />

      {pending
        ? "Eliminando..."
        : "Eliminar"}
    </button>
  );
}

export function BotonEliminarNotificacion({
  notificacionId,
  titulo,
  action,
}: BotonEliminarNotificacionProps) {
  const [modalAbierto, setModalAbierto] =
    useState(false);

  useEffect(() => {
    if (!modalAbierto) {
      return;
    }

    function cerrarConEscape(
      evento: KeyboardEvent,
    ) {
      if (evento.key === "Escape") {
        setModalAbierto(false);
      }
    }

    document.addEventListener(
      "keydown",
      cerrarConEscape,
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        cerrarConEscape,
      );

      document.body.style.overflow = "";
    };
  }, [modalAbierto]);

  return (
    <>
      <button
        type="button"
        onClick={(evento) => {
          evento.stopPropagation();
          setModalAbierto(true);
        }}
        aria-label="Eliminar notificación"
        title="Eliminar notificación"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100"
      >
        <Trash2 size={18} />
      </button>

      {modalAbierto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-eliminar"
          onClick={() =>
            setModalAbierto(false)
          }
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-2xl sm:p-9"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                setModalAbierto(false)
              }
              aria-label="Cerrar"
              className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={36} />
            </div>

            <h2
              id="titulo-modal-eliminar"
              className="mt-6 text-2xl font-bold text-slate-900"
            >
              Eliminar notificación
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              ¿Seguro que deseas eliminar esta
              notificación?
            </p>

            <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
              “{titulo}”
            </p>

            <form
              action={action}
              className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center"
            >
              <input
                type="hidden"
                name="notificacionId"
                value={notificacionId}
              />

              <button
                type="button"
                onClick={() =>
                  setModalAbierto(false)
                }
                className="min-w-28 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <BotonConfirmarEliminacion />
            </form>
          </div>
        </div>
      )}
    </>
  );
}