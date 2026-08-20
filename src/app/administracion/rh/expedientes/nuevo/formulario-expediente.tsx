"use client";

import Link from "next/link";
import { LoaderCircle, Save } from "lucide-react";
import { useFormStatus } from "react-dom";

import { crearExpediente } from "../actions";

type Empleado = {
  id: number;
  nombre: string;
  puesto: string;
};

type FormularioExpedienteProps = {
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
          Crear expediente
        </>
      )}
    </button>
  );
}

export function FormularioExpediente({
  empleados,
}: FormularioExpedienteProps) {
  return (
    <form
      action={crearExpediente}
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
            defaultValue=""
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="" disabled>
              Selecciona un empleado
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
            htmlFor="dpi"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            DPI
          </label>

          <input
            id="dpi"
            name="dpi"
            type="text"
            required
            maxLength={20}
            placeholder="Ej. 1234 56789 0101"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="nit"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            NIT
          </label>

          <input
            id="nit"
            name="nit"
            type="text"
            maxLength={20}
            placeholder="Ej. 1234567-8"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="igss"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Número de IGSS
          </label>

          <input
            id="igss"
            name="igss"
            type="text"
            maxLength={30}
            placeholder="Número de afiliación"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="fechaIngreso"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Fecha de ingreso
          </label>

          <input
            id="fechaIngreso"
            name="fechaIngreso"
            type="date"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="fechaSalida"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Fecha de salida
          </label>

          <input
            id="fechaSalida"
            name="fechaSalida"
            type="date"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <div>
            <label
              htmlFor="salarioInicial"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Salario inicial
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                Q
              </span>

              <input
                id="salarioInicial"
                name="salarioInicial"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="salarioActual"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Salario actual
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                Q
              </span>

              <input
                id="salarioActual"
                name="salarioActual"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Si lo dejás vacío, el empleado sigue laborando en la empresa.
          </p>
        </div>

        <div>
          <label
            htmlFor="contactoEmergencia"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Contacto de emergencia
          </label>

          <input
            id="contactoEmergencia"
            name="contactoEmergencia"
            type="text"
            required
            maxLength={150}
            placeholder="Nombre completo"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="telefonoEmergencia"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Teléfono de emergencia
          </label>

          <input
            id="telefonoEmergencia"
            name="telefonoEmergencia"
            type="tel"
            required
            maxLength={20}
            placeholder="Ej. 5555-5555"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="direccion"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Dirección
          </label>

          <textarea
            id="direccion"
            name="direccion"
            rows={3}
            required
            placeholder="Dirección completa del empleado"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="observaciones"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Observaciones
          </label>

          <textarea
            id="observaciones"
            name="observaciones"
            rows={4}
            placeholder="Información adicional del expediente"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/administracion/rh/expedientes"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <BotonGuardar />
      </div>
    </form>
  );
}