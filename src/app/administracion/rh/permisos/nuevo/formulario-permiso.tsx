"use client";

import Link from "next/link";
import {
  BadgeInfo,
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
  crearPermiso,
} from "../actions";

type Empleado = {
  id: number;
  nombre: string;
};

type FormularioPermisoProps = {
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
          Guardar permiso
        </>
      )}
    </button>
  );
}

export function FormularioPermiso({
  empleados,
}: FormularioPermisoProps) {
  const [
    fechaInicio,
    setFechaInicio,
  ] = useState("");

  const [
    fechaFin,
    setFechaFin,
  ] = useState("");

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
      action={crearPermiso}
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
            Información del permiso
          </h2>

          <p className="text-sm text-slate-500">
            El permiso puede abarcar uno o varios días hábiles.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <BadgeInfo
            size={21}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <p className="text-sm leading-6 text-blue-900">
            Si el trabajador todavía no tiene vacaciones aprobadas en el año, los días hábiles de este permiso podrán descontarse de su bolsa de 15 días al aprobarlo. Si ya tiene vacaciones aprobadas, el permiso no reducirá esa bolsa.
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
            <option
              value=""
              disabled
            >
              Seleccioná un empleado
            </option>

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
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
          >
            <option
              value=""
              disabled
            >
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

        <div />

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
                setFechaFin("");
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
            Fecha final
          </label>

          <input
            id="fechaFin"
            name="fechaFin"
            type="date"
            required
            min={
              fechaInicio ||
              undefined
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Días hábiles solicitados
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {fechaInicio &&
            fechaFin
              ? `${diasHabiles} ${
                  diasHabiles ===
                  1
                    ? "día"
                    : "días"
                }`
              : "Seleccioná las fechas"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Se cuentan de lunes a viernes.
          </p>
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
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
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
            placeholder="Observación opcional..."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
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