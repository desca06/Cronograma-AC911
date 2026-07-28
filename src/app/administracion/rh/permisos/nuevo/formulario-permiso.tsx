"use client";

import Link from "next/link";
import {
  CalendarDays,
  LoaderCircle,
  Save,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import { crearPermiso } from "../actions";

type Empleado = {
  id: number;
  nombre: string;
};

type FormularioPermisoProps = {
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
          Guardar permiso
        </>
      )}
    </button>
  );
}

export function FormularioPermiso({
  empleados,
}: FormularioPermisoProps) {
  return (
    <form
      action={crearPermiso}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <CalendarDays size={22} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Información del permiso
          </h2>

          <p className="text-sm text-slate-500">
            Completá los datos de la solicitud.
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
            defaultValue=""
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="" disabled>
              Seleccioná un empleado
            </option>

            {empleados.map((empleado) => (
              <option
                key={empleado.id}
                value={empleado.id}
              >
                {empleado.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="tipo"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Tipo de permiso
          </label>

          <select
            id="tipo"
            name="tipo"
            required
            defaultValue=""
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="" disabled>
              Seleccioná el tipo
            </option>

            <option value="PERSONAL">
              Personal
            </option>

            <option value="CITA_MEDICA">
              Cita médica
            </option>

            <option value="ENFERMEDAD">
              Enfermedad
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="fecha"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Fecha
          </label>

          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="horaInicio"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Hora de inicio
          </label>

          <input
            id="horaInicio"
            name="horaInicio"
            type="time"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="horaFin"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Hora de finalización
          </label>

          <input
            id="horaFin"
            name="horaFin"
            type="time"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="motivo"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Motivo
          </label>

          <textarea
            id="motivo"
            name="motivo"
            rows={4}
            required
            placeholder="Describe el motivo del permiso..."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/administracion/rh/permisos"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <BotonGuardar />
      </div>
    </form>
  );
}