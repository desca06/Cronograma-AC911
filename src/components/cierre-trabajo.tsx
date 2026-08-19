"use client";

import { useState } from "react";

import { PadFirma } from "./pad-firma";

type CierreTrabajoProps = {
  trabajoId: number;
  estadoInicial: string;
  incluirPendiente?: boolean;
};

export function CierreTrabajo({
  trabajoId,
  estadoInicial,
  incluirPendiente = false,
}: CierreTrabajoProps) {
  const [estado, setEstado] = useState(estadoInicial);

  const pideFirma = estado === "Finalizado";

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={`estado-${trabajoId}`}
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Estado del trabajo
        </label>

        <select
          id={`estado-${trabajoId}`}
          name="estado"
          value={estado}
          onChange={(evento) => setEstado(evento.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        >
          {incluirPendiente && (
            <option value="Pendiente">Pendiente</option>
          )}

          <option value="En camino">En camino</option>
          <option value="En proceso">En proceso</option>
          <option value="Finalizado">Finalizado</option>
        </select>
      </div>

      {pideFirma && (
        <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <h3 className="font-bold text-emerald-950">
              Firma del cliente
            </h3>

            <p className="mt-1 text-sm text-emerald-800">
              Para finalizar el trabajo, el cliente o responsable
              debe firmar aquí. Esta firma aparecerá en el PDF.
            </p>
          </div>

          <div>
            <label
              htmlFor={`firma-nombre-${trabajoId}`}
              className="mb-2 block text-sm font-semibold text-emerald-950"
            >
              Nombre de quien firma
            </label>

            <input
              id={`firma-nombre-${trabajoId}`}
              name="firmaClienteNombre"
              required
              placeholder="Ejemplo: Juan Pérez"
              className="w-full rounded-xl border border-emerald-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <PadFirma />
        </section>
      )}
    </div>
  );
}