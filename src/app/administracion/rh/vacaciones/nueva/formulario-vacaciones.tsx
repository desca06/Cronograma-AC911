"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  LoaderCircle,
  Save,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import { crearVacacion } from "../actions";

type Empleado = {
  id: number;
  nombre: string;
  puesto: string;
};

type FormularioVacacionesProps = {
  empleados: Empleado[];
};

function calcularDias(
  fechaInicio: string,
  fechaFin: string,
) {
  if (!fechaInicio || !fechaFin) {
    return 0;
  }

  const inicio = new Date(`${fechaInicio}T00:00:00Z`);
  const fin = new Date(`${fechaFin}T00:00:00Z`);

  const diferencia = fin.getTime() - inicio.getTime();

  return Math.floor(diferencia / 86_400_000) + 1;
}

function BotonGuardar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
          Guardando...
        </>
      ) : (
        <>
          <Save size={18} />
          Guardar solicitud
        </>
      )}
    </button>
  );
}

export function FormularioVacaciones({
  empleados,
}: FormularioVacacionesProps) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const cantidadDias = useMemo(
    () => calcularDias(fechaInicio, fechaFin),
    [fechaInicio, fechaFin],
  );

  const fechasInvalidas =
    Boolean(fechaInicio && fechaFin) &&
    cantidadDias <= 0;

  return (
    <form
      action={crearVacacion}
      className="space-y-6"
    >
      <div>
        <label
          htmlFor="empleadoId"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Empleado
        </label>

        <select
          id="empleadoId"
          name="empleadoId"
          required
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="" disabled>
            Seleccione un empleado
          </option>

          {empleados.map((empleado) => (
            <option
              key={empleado.id}
              value={empleado.id}
            >
              {empleado.nombre} — {empleado.puesto}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="fechaInicio"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Fecha de inicio
          </label>

          <input
            id="fechaInicio"
            name="fechaInicio"
            type="date"
            required
            value={fechaInicio}
            onChange={(evento) => {
              const nuevaFecha = evento.target.value;

              setFechaInicio(nuevaFecha);

              if (
                fechaFin &&
                nuevaFecha > fechaFin
              ) {
                setFechaFin("");
              }
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="fechaFin"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Fecha de finalización
          </label>

          <input
            id="fechaFin"
            name="fechaFin"
            type="date"
            required
            min={fechaInicio || undefined}
            value={fechaFin}
            onChange={(evento) =>
              setFechaFin(evento.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div
        className={`rounded-xl border p-4 ${
          fechasInvalidas
            ? "border-red-200 bg-red-50"
            : "border-blue-200 bg-blue-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-2 ${
              fechasInvalidas
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <CalendarDays size={21} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cantidad de días
            </p>

            <p
              className={`mt-1 text-xl font-bold ${
                fechasInvalidas
                  ? "text-red-700"
                  : "text-slate-900"
              }`}
            >
              {cantidadDias > 0
                ? `${cantidadDias} ${
                    cantidadDias === 1
                      ? "día"
                      : "días"
                  }`
                : "Seleccioná ambas fechas"}
            </p>
          </div>
        </div>

        {fechasInvalidas && (
          <p className="mt-3 text-sm font-medium text-red-700">
            La fecha final no puede ser anterior a la
            fecha de inicio.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="observacion"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Observación
        </label>

        <textarea
          id="observacion"
          name="observacion"
          rows={4}
          placeholder="Escribí una observación opcional..."
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/administracion/rh/vacaciones"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <BotonGuardar />
      </div>
    </form>
  );
}