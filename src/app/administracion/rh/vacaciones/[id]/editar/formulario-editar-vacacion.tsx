"use client";

import Link from "next/link";
import {
  CalendarDays,
  LoaderCircle,
  Save,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import {
  useFormStatus,
} from "react-dom";

import {
  calcularDiasHabiles,
} from "@/lib/vacaciones";
import {
  actualizarVacacion,
} from "../../actions";

type Empleado = {
  id: number;
  nombre: string;
  puesto: string;
};

type Vacacion = {
  id: number;
  empleadoId: number;
  fechaInicio: string;
  fechaFin: string;
  cantidadDias: number;
  observacion:
    | string
    | null;
  estado: string;
};

type FormularioEditarVacacionProps = {
  vacacion: Vacacion;
  empleados: Empleado[];
};

function BotonGuardar() {
  const { pending } =
    useFormStatus();

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
          Guardar cambios
        </>
      )}
    </button>
  );
}

export function FormularioEditarVacacion({
  vacacion,
  empleados,
}: FormularioEditarVacacionProps) {
  const actualizarActual =
    actualizarVacacion.bind(
      null,
      vacacion.id,
    );

  const [
    fechaInicio,
    setFechaInicio,
  ] = useState(
    vacacion.fechaInicio,
  );

  const [
    fechaFin,
    setFechaFin,
  ] = useState(
    vacacion.fechaFin,
  );

  const cantidadDias =
    useMemo(
      () =>
        calcularDiasHabiles(
          fechaInicio,
          fechaFin,
        ),
      [
        fechaInicio,
        fechaFin,
      ],
    );

  return (
    <form
      action={
        actualizarActual
      }
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <CalendarDays
            size={22}
          />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Editar vacaciones
          </h2>

          <p className="text-sm text-slate-500">
            Los días se calculan de lunes a viernes.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
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
            defaultValue={
              vacacion.empleadoId
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
          >
            {empleados.map(
              (empleado) => (
                <option
                  key={
                    empleado.id
                  }
                  value={
                    empleado.id
                  }
                >
                  {empleado.nombre} —{" "}
                  {empleado.puesto}
                </option>
              ),
            )}
          </select>
        </div>

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
            onChange={(
              evento,
            ) => {
              const valor =
                evento.target.value;

              setFechaInicio(
                valor,
              );

              if (
                fechaFin &&
                valor >
                  fechaFin
              ) {
                setFechaFin(
                  valor,
                );
              }
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
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
            min={fechaInicio}
            value={fechaFin}
            onChange={(
              evento,
            ) =>
              setFechaFin(
                evento.target
                  .value,
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            Días hábiles
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-950">
            {cantidadDias > 0
              ? `${cantidadDias} ${
                  cantidadDias ===
                  1
                    ? "día"
                    : "días"
                }`
              : "Rango inválido"}
          </p>

          <p className="mt-1 text-xs text-blue-800">
            Máximo permitido: 15 días hábiles.
          </p>
        </div>

        <div className="md:col-span-2">
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
            defaultValue={
              vacacion.observacion ??
              ""
            }
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <Link
          href={`/administracion/rh/vacaciones/${vacacion.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <BotonGuardar />
      </div>
    </form>
  );
}