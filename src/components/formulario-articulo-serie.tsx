"use client";

import type { ReactNode } from "react";

type FormularioArticuloSerieProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
};

export function FormularioArticuloSerie({
  action,
  children,
  className,
}: FormularioArticuloSerieProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(evento) => {
        const datos = new FormData(evento.currentTarget);
        const tipo = String(datos.get("tipo") ?? "");
        const serie = String(datos.get("numeroSerie") ?? "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "");

        if (tipo !== "ACTIVO") {
          return;
        }

        if (!serie) {
          evento.preventDefault();
          window.alert(
            "Los bienes o activos deben llevar número de serie.",
          );
          return;
        }

        if (!/^[A-Z0-9-]{4,40}$/.test(serie)) {
          evento.preventDefault();
          window.alert(
            "El número de serie solo puede tener letras, números y guiones. Mínimo 4 caracteres.",
          );
          return;
        }

        const confirmado = window.confirm(
          `¿Confirmás que el número de serie ${serie} es correcto?\n\nRevisalo bien. Si está mal, después cuesta rastrear el equipo.`,
        );

        if (!confirmado) {
          evento.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}