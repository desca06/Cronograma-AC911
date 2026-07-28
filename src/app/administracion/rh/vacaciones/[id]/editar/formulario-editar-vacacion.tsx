"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Save } from "lucide-react";
import { useFormStatus } from "react-dom";

import { actualizarVacacion } from "@/app/administracion/rh/vacaciones/actions";

type Empleado = {
  id: number;
  nombre: string;
  puesto: string;
};

type FormularioEditarVacacionProps = {
  vacacion: {
    id: number;
    empleadoId: number;
    fechaInicio: string;
    fechaFin: string;
    cantidadDias: number,
    observacion: string | null;
  };
  empleados: Empleado[];
};

function BotonGuardar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save size={18} />

      {pending
        ? "Guardando cambios..."
        : "Guardar cambios"}
    </button>
  );
}

export function FormularioEditarVacacion({
  vacacion,
  empleados,
}: FormularioEditarVacacionProps) {
  const actualizarActual =
    actualizarVacacion.bind(null, vacacion.id);

  const cantidadDias = useMemo(() => {
    if (!vacacion.fechaInicio || !vacacion.fechaFin) {
      return vacacion.cantidadDias;
    }

    const inicio = new Date(
      `${vacacion.fechaInicio}T00:00:00`,
    );

    const fin = new Date(
      `${vacacion.fechaFin}T00:00:00`,
    );

    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fin.getTime()) ||
      fin < inicio
    ) {
      return 0;
    }

    const diferencia =
      fin.getTime() - inicio.getTime();

    return Math.floor(diferencia / 86_400_000) + 1;
  }, [
    vacacion.fechaInicio,
    vacacion.fechaFin,
    vacacion.cantidadDias,
  ]);

  return (
    <form
      action={actualizarActual}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
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
            defaultValue={vacacion.empleadoId}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">
              Seleccioná un empleado
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
            defaultValue={vacacion.fechaInicio}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            defaultValue={vacacion.fechaFin}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-800">
              Días registrados actualmente
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-900">
              {cantidadDias}
            </p>
          </div>
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
            defaultValue={vacacion.observacion ?? ""}
            rows={5}
            placeholder="Agregá una observación opcional..."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/administracion/rh/vacaciones/${vacacion.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <BotonGuardar />
      </div>
    </form>
  );
}