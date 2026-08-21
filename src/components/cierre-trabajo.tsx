"use client";

import { useState } from "react";

import { PadFirma } from "@/components/pad-firma";

type CierreTrabajoProps = {
  trabajoId: number;
  estadoInicial: string;
  incluirPendiente?: boolean;
  vehiculoNombre?: string | null;
  kmActual?: number | null;
  kmSalidaInicial?: number | null;
  kmLlegadaInicial?: number | null;
};

export function CierreTrabajo({
  trabajoId,
  estadoInicial,
  incluirPendiente = false,
  vehiculoNombre = null,
  kmActual = 0,
  kmSalidaInicial = null,
  kmLlegadaInicial = null,
}: CierreTrabajoProps) {
  const [estado, setEstado] = useState(estadoInicial);

  const pideFirma = estado === "Finalizado";
  const pideKm = Boolean(vehiculoNombre) && pideFirma;

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

      {pideKm && (
        <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div>
            <h3 className="font-bold text-blue-950">
              Kilometraje · {vehiculoNombre}
            </h3>
            <p className="mt-1 text-sm text-blue-800">
              Km actual del vehículo: {kmActual ?? 0} km. La llegada no
              puede ser menor que la salida.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`km-salida-${trabajoId}`}
                className="mb-2 block text-sm font-semibold text-blue-950"
              >
                Km de salida
              </label>
              <input
                id={`km-salida-${trabajoId}`}
                name="kmSalida"
                type="number"
                min={kmActual ?? 0}
                step={1}
                required
                defaultValue={kmSalidaInicial ?? kmActual ?? 0}
                className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3"
              />
            </div>

            <div>
              <label
                htmlFor={`km-llegada-${trabajoId}`}
                className="mb-2 block text-sm font-semibold text-blue-950"
              >
                Km de llegada
              </label>
              <input
                id={`km-llegada-${trabajoId}`}
                name="kmLlegada"
                type="number"
                min={kmActual ?? 0}
                step={1}
                required
                defaultValue={kmLlegadaInicial ?? ""}
                className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3"
              />
            </div>
          </div>
        </section>
      )}

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