"use client";

import Link from "next/link";
import { LoaderCircle, Save } from "lucide-react";
import { useFormStatus } from "react-dom";

import { actualizarPermiso } from "../../actions";

type Empleado = {
  id: number;
  nombre: string;
  puesto: string;
};

type FormularioEditarPermisoProps = {
  permiso: {
    id: number;
    empleadoId: number;
    tipo: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    motivo: string;
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
      {pending ? (
        <>
          <LoaderCircle size={18} className="animate-spin" />
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

export function FormularioEditarPermiso({
  permiso,
  empleados,
}: FormularioEditarPermisoProps) {
  const actualizarActual = actualizarPermiso.bind(
    null,
    permiso.id,
  );

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
            required
            defaultValue={permiso.empleadoId}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
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
            htmlFor="tipo"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Tipo de permiso
          </label>

          <select
            id="tipo"
            name="tipo"
            required
            defaultValue={permiso.tipo}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
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
            defaultValue={permiso.fecha}
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
            defaultValue={permiso.horaInicio.slice(0, 5)}
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
            defaultValue={permiso.horaFin.slice(0, 5)}
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
            defaultValue={permiso.motivo}
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
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
            rows={3}
            defaultValue={permiso.observacion ?? ""}
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/administracion/rh/permisos/${permiso.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <BotonGuardar />
      </div>
    </form>
  );
}