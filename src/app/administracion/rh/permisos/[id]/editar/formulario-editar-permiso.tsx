"use client";

import Link from "next/link";
import {
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
  actualizarPermiso,
} from "../../actions";

type Empleado = {
  id: number;
  nombre: string;
};

type FormularioEditarPermisoProps = {
  permiso: {
    id: number;
    empleadoId: number;
    tipo: string;
    fecha: string;
    fechaFin: string | null;
    horaInicio: string;
    horaFin: string;
    motivo: string;
    observacion:
      | string
      | null;
  };
  empleados: Empleado[];
};

function BotonGuardar() {
  const { pending } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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

export function FormularioEditarPermiso({
  permiso,
  empleados,
}: FormularioEditarPermisoProps) {
  const actualizarActual =
    actualizarPermiso.bind(
      null,
      permiso.id,
    );

  const [
    fechaInicio,
    setFechaInicio,
  ] = useState(
    permiso.fecha,
  );

  const [
    fechaFin,
    setFechaFin,
  ] = useState(
    permiso.fechaFin ??
      permiso.fecha,
  );

  const diasHabiles =
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
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Empleado
          </label>

          <select
            name="empleadoId"
            required
            defaultValue={
              permiso.empleadoId
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
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
                  {
                    empleado.nombre
                  }
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Tipo de permiso
          </label>

          <select
            name="tipo"
            required
            defaultValue={
              permiso.tipo
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
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

        <div />

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Fecha de inicio
          </label>

          <input
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
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Fecha final
          </label>

          <input
            name="fechaFin"
            type="date"
            required
            min={
              fechaInicio
            }
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

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Hora de inicio
          </label>

          <input
            name="horaInicio"
            type="time"
            required
            defaultValue={
              permiso.horaInicio.slice(
                0,
                5,
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Hora final
          </label>

          <input
            name="horaFin"
            type="time"
            required
            defaultValue={
              permiso.horaFin.slice(
                0,
                5,
              )
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase text-blue-700">
            Días hábiles
          </p>
          <p className="mt-1 text-xl font-bold text-blue-950">
            {diasHabiles}{" "}
            {diasHabiles === 1
              ? "día"
              : "días"}
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Motivo
          </label>

          <textarea
            name="motivo"
            rows={4}
            required
            defaultValue={
              permiso.motivo
            }
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Observación
          </label>

          <textarea
            name="observacion"
            rows={3}
            defaultValue={
              permiso.observacion ??
              ""
            }
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/administracion/rh/permisos/${permiso.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <BotonGuardar />
      </div>
    </form>
  );
}