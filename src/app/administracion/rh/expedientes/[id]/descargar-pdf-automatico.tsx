"use client";

import { useEffect } from "react";

type DescargarPdfAutomaticoProps = {
  expedienteId: number;
  activar: boolean;
};

export function DescargarPdfAutomatico({
  expedienteId,
  activar,
}: DescargarPdfAutomaticoProps) {
  useEffect(() => {
    if (!activar) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        const enlace =
          document.createElement(
            "a",
          );

        enlace.href =
          `/administracion/rh/expedientes/${expedienteId}/pdf?download=1`;

        enlace.style.display =
          "none";

        document.body.appendChild(
          enlace,
        );

        enlace.click();
        enlace.remove();

        const url =
          new URL(
            window.location.href,
          );

        url.searchParams.delete(
          "pdf",
        );

        window.history.replaceState(
          {},
          "",
          `${url.pathname}${url.search}`,
        );
      }, 450);

    return () => {
      window.clearTimeout(
        temporizador,
      );
    };
  }, [
    activar,
    expedienteId,
  ]);

  return null;
}