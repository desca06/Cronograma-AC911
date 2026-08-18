"use client";

import { useState, useTransition } from "react";
import { PadFirma } from "./pad-firma";

type CierreTrabajoProps = {
  trabajoId: number;
  estadoActual: string;
  rutaRetorno: string;
  formAction: (formData: FormData) => Promise<void>;
  firmaActual?: string | null;
  nombreFirmaActual?: string | null;
  fechaFirmaActual?: Date | string | null;
  mostrarObservacion?: boolean;
};

const ESTADOS = ["Pendiente", "En camino", "En proceso", "Finalizado"] as const;

export function CierreTrabajo({
  trabajoId,
  estadoActual,
  rutaRetorno,
  formAction,
  firmaActual,
  nombreFirmaActual,
  fechaFirmaActual,
  mostrarObservacion = true,
}: CierreTrabajoProps) {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(estadoActual);
  const [nombreCliente, setNombreCliente] = useState(nombreFirmaActual || "");
  const [firmaDataUrl, setFirmaDataUrl] = useState<string | null>(firmaActual || null);
  const [observacion, setObservacion] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorFirma, setErrorFirma] = useState("");

  const esFinalizado = estadoSeleccionado === "Finalizado";
  const requiereFirma = esFinalizado;
  const tieneFirmaPrevia = Boolean(firmaActual);

  const handleFirmaChange = (dataUrl: string | null) => {
    setFirmaDataUrl(dataUrl);
    if (dataUrl) setErrorFirma("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Validación en cliente antes de enviar al server
    if (esFinalizado) {
      if (!nombreCliente.trim()) {
        e.preventDefault();
        setErrorFirma("Debes ingresar el nombre del cliente que firma.");
        return;
      }
      // Si no hay firma previa ni nueva, bloquear
      if (!firmaDataUrl && !tieneFirmaPrevia) {
        e.preventDefault();
        setErrorFirma("Debes capturar la firma del cliente para finalizar.");
        return;
      }
    }

    // Si pasa validación, dejar que el form haga submit hacia server action
    // Usamos transition para feedback
    setErrorFirma("");
  };

  const formatearFecha = (fecha?: Date | string | null) => {
    if (!fecha) return "";
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return new Intl.DateTimeFormat("es-GT", {
      timeZone: "America/Guatemala",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-5 border-t border-slate-200 pt-5"
    >
      <input type="hidden" name="trabajoId" value={trabajoId} />
      <input type="hidden" name="rutaRetorno" value={rutaRetorno} />
      {/* Campos ocultos para firma */}
      <input type="hidden" name="firmaCliente" value={firmaDataUrl || ""} />
      {/* El nombre se envía con input visible name=firmaClienteNombre */}

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
          value={estadoSeleccionado}
          onChange={(e) => setEstadoSeleccionado(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium"
        >
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>

        {esFinalizado && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            ✔ Al finalizar se solicitará la firma del cliente para conformidad.
          </p>
        )}
      </div>

      {mostrarObservacion && (
        <div>
          <label
            htmlFor={`observaciones-tecnico-${trabajoId}`}
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Nueva observación del técnico
          </label>

          <textarea
            id={`observaciones-tecnico-${trabajoId}`}
            name="observacionesTecnico"
            rows={4}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Escribe una nueva observación, avance, problema, material utilizado o resultado. Ej: Instalación completada, cliente conforme."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <p className="mt-2 text-xs text-slate-500">
            Al guardar, esta observación se agregará al historial y no reemplazará las anteriores.
          </p>
        </div>
      )}

      {esFinalizado && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
          <h4 className="text-base font-bold text-emerald-900">
            Cierre y conformidad del cliente
          </h4>
          <p className="mt-1 text-sm text-emerald-800">
            Para finalizar, pide al cliente que ingrese su nombre y firme en el recuadro.
            Esta información aparecerá en el PDF del trabajo.
          </p>

          {tieneFirmaPrevia && (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Firma actual registrada
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {nombreFirmaActual || "Cliente"}
              </p>
              {fechaFirmaActual && (
                <p className="text-xs text-slate-500">
                  Firmado el {formatearFecha(fechaFirmaActual)}
                </p>
              )}
              <img
                src={firmaActual!}
                alt="Firma actual"
                className="mt-3 max-h-32 w-full rounded-lg border border-slate-200 bg-white object-contain"
              />
              <p className="mt-2 text-xs text-slate-500">
                Si el cliente vuelve a firmar, se reemplazará la firma anterior.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label
                htmlFor={`firma-nombre-${trabajoId}`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nombre completo del cliente / responsable *
              </label>

              <input
                id={`firma-nombre-${trabajoId}`}
                name="firmaClienteNombre"
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                placeholder="Ej: Juan Pérez - Bodega Central"
                required={esFinalizado}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <PadFirma
              value={firmaActual || undefined}
              onChange={handleFirmaChange}
              label="Firma del cliente *"
            />

            {errorFirma && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {errorFirma}
              </div>
            )}

            <div className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-600 ring-1 ring-emerald-200">
              <strong className="text-emerald-900">Conformidad:</strong> Al firmar, el cliente
              declara que el trabajo descrito fue realizado, revisado y recibido a conformidad en la
              fecha indicada. La firma quedará registrada con fecha y hora.
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full rounded-xl px-5 py-3.5 font-bold text-white shadow-sm transition ${
          esFinalizado
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-blue-600 hover:bg-blue-700"
        } disabled:opacity-60`}
      >
        {isPending
          ? "Guardando..."
          : esFinalizado
            ? tieneFirmaPrevia
              ? "Actualizar con nueva firma"
              : "Finalizar y guardar firma del cliente"
            : "Guardar actualización"}
      </button>

      {esFinalizado && !tieneFirmaPrevia && (
        <p className="text-center text-xs text-slate-500">
          Asegúrate de tener evidencias fotográficas antes de finalizar.
        </p>
      )}
    </form>
  );
}
