"use client";

import Link from "next/link";
import {
  LoaderCircle,
  Save,
} from "lucide-react";
import {
  useFormStatus,
} from "react-dom";

import {
  actualizarExpediente,
} from "../../actions";

type Empleado = {
  id: number;
  nombre: string;
  puesto: string;
};

type FormularioEditarExpedienteProps = {
  expediente: {
    id: number;
    empleadoId: number;
    codigo: string | null;
    dpi: string;
    nit: string | null;
    igss: string | null;
    fechaIngreso: string;
    fechaSalida: string | null;
    salarioInicial: number | null;
    salarioActual: number | null;
    contactoEmergencia: string;
    telefonoEmergencia: string;
    direccion: string;
    observaciones: string | null;
    estado: string;
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

export function FormularioEditarExpediente({
  expediente,
  empleados,
}: FormularioEditarExpedienteProps) {
  const actualizarActual =
    actualizarExpediente.bind(
      null,
      expediente.id,
    );

  return (
    <form
      action={
        actualizarActual
      }
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
          Código del expediente
        </p>

        <p className="mt-1 text-lg font-bold text-blue-900">
          {expediente.codigo ??
            "Sin código"}
        </p>
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
              expediente.empleadoId
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            defaultValue={
              expediente.dpi
            }
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
            defaultValue={
              expediente.nit ?? ""
            }
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
            defaultValue={
              expediente.igss ?? ""
            }
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
            defaultValue={
              expediente.fechaIngreso
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <input
          id="fechaSalida"
          name="fechaSalida"
          type="date"
          defaultValue={
            expediente.fechaSalida ?? ""
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

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
            defaultValue={
              expediente.contactoEmergencia
            }
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
            defaultValue={
              expediente.telefonoEmergencia
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="estado"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Estado
          </label>

          <select
            id="estado"
            name="estado"
            required
            defaultValue={
              expediente.estado
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="ACTIVO">
              Activo
            </option>

            <option value="INACTIVO">
              Inactivo
            </option>
          </select>
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
            defaultValue={
              expediente.direccion
            }
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
            defaultValue={
              expediente.observaciones ??
              ""
            }
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/administracion/rh/expedientes/${expediente.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <BotonGuardar />
      </div>
    </form>
  );
}