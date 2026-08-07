"use client";

import { useEffect } from "react";

import {
  identificarUsuarioOneSignal,
  inicializarOneSignal,
} from "@/lib/onesignal-client";

type OneSignalProviderProps = {
  usuarioId: number | null;
  rol?: string;
};

export function OneSignalProvider({
  usuarioId,
  rol,
}: OneSignalProviderProps) {
  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      try {
        await inicializarOneSignal();

        if (cancelado || !usuarioId) {
          return;
        }

        await identificarUsuarioOneSignal(
          usuarioId,
          rol,
        );
      } catch (error) {
        console.error(
          "No se pudo inicializar OneSignal:",
          error,
        );
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
    };
  }, [usuarioId, rol]);

  return null;
}