import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Save,
  UsersRound,
} from "lucide-react";

import {
  crearTrabajo,
} from "../actions";

type Cliente = {
  id: number;
  nombre: string;
};

type Vehiculo = {
  id: number;
  nombre: string;
  estado: string;
};

type Empleado = {
  id: number;
  nombre: string;
  puesto: string;
};

type CotizacionOrigen = {
  id: number;
  codigo: string;
  titulo: string;
  clienteId: number;
  clienteNombre: string;
  observaciones:
    | string
    | null;
};

type FormularioTrabajoProps = {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  empleados: Empleado[];
  fechaInicial: string;
  cotizacion?:
    | CotizacionOrigen
    | null;
};

const estadosDisponibles = [
  "Pendiente",
  "En camino",
  "En proceso",
  "Finalizado",
  "Cancelado",
];

export function FormularioTrabajo({
  clientes,
  vehiculos,
  empleados,
  fechaInicial,
  cotizacion = null,
}: FormularioTrabajoProps) {
  return (
    <form
      action={crearTrabajo}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {cotizacion && (
        <input
          type="hidden"
          name="cotizacionId"
          value={
            cotizacion.id
          }
        />
      )}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
              <CalendarDays
                size={22}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Información del trabajo
              </h2>

              <p className="text-sm text-slate-500">
                {cotizacion
                  ? `Trabajo originado desde la cotización ${cotizacion.codigo}.`
                  : "Al guardar, el trabajo aparecerá automáticamente en los trabajos asignados del personal seleccionado."}
              </p>
            </div>
          </div>

          <Link
            href="/trabajos"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft
              size={17}
            />
            Volver
          </Link>
        </div>
      </div>

      {cotizacion && (
        <div className="mx-6 mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">
            Cotización aprobada: {cotizacion.codigo}
          </p>

          <p className="mt-1 text-sm text-emerald-800">
            Cliente: {cotizacion.clienteNombre}. El trabajo quedará asociado a esta cotización y no podrá generarse otro trabajo desde la misma.
          </p>
        </div>
      )}

      <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-4">
        {clientes.length === 0 && (
          <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Primero debes registrar al menos un cliente activo.
          </div>
        )}

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
            defaultValue={
              fechaInicial
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="clienteId"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Cliente
          </label>

          {cotizacion && (
            <input
              type="hidden"
              name="clienteId"
              value={
                cotizacion.clienteId
              }
            />
          )}

          <select
            id="clienteId"
            name={
              cotizacion
                ? undefined
                : "clienteId"
            }
            required
            defaultValue={
              cotizacion
                ? String(
                    cotizacion.clienteId,
                  )
                : ""
            }
            disabled={
              Boolean(
                cotizacion,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
          >
            {!cotizacion && (
              <option
                value=""
                disabled
              >
                Selecciona un cliente
              </option>
            )}

            {clientes.map(
              (cliente) => (
                <option
                  key={
                    cliente.id
                  }
                  value={
                    cliente.id
                  }
                >
                  {
                    cliente.nombre
                  }
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="vehiculoId"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Vehículo
          </label>

          <select
            id="vehiculoId"
            name="vehiculoId"
            defaultValue=""
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            <option value="">
              Sin vehículo asignado
            </option>

            {vehiculos.map(
              (vehiculo) => (
                <option
                  key={
                    vehiculo.id
                  }
                  value={
                    vehiculo.id
                  }
                >
                  {vehiculo.nombre} —{" "}
                  {vehiculo.estado}
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
            Tipo de trabajo
          </label>

          <select
            id="tipo"
            name="tipo"
            required
            defaultValue=""
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            <option
              value=""
              disabled
            >
              Selecciona un tipo
            </option>

            <option value="Instalación">
              Instalación
            </option>

            <option value="Mantenimiento">
              Mantenimiento Correctivo
            </option>

            <option value="Mantenimiento Preventivo">
              Mantenimiento Preventivo
            </option>

            <option value="Reparación">
              Reparación
            </option>

            <option value="Visita Técnica">
              Visita Técnica
            </option>
          </select>
        </div>

        <div className="md:col-span-2 xl:col-span-4">
          <label
            htmlFor="descripcion"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Descripción
          </label>

          <input
            id="descripcion"
            name="descripcion"
            required
            defaultValue={
              cotizacion?.titulo ??
              ""
            }
            placeholder="Ejemplo: Instalación de equipos VRF"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="direccion"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Dirección del trabajo
          </label>

          <input
            id="direccion"
            name="direccion"
            placeholder="Dirección o ubicación"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="estado"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Estado inicial
          </label>

          <select
            id="estado"
            name="estado"
            defaultValue="Pendiente"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            {estadosDisponibles.map(
              (estado) => (
                <option
                  key={
                    estado
                  }
                  value={
                    estado
                  }
                >
                  {estado}
                </option>
              ),
            )}
          </select>
        </div>

        <fieldset className="md:col-span-2 xl:col-span-4">
          <div className="mb-3 flex items-center gap-2">
            <UsersRound
              size={18}
              className="text-blue-600"
            />

            <legend className="text-sm font-semibold text-slate-700">
              Empleados asignados
            </legend>
          </div>

          {empleados.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              No hay técnicos o supervisores activos para asignar.
            </div>
          ) : (
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {empleados.map(
                (empleado) => (
                  <label
                    key={
                      empleado.id
                    }
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"
                  >
                    <input
                      type="checkbox"
                      name="empleadoIds"
                      value={
                        empleado.id
                      }
                      className="h-4 w-4"
                    />

                    <span>
                      <strong className="block text-sm text-slate-900">
                        {
                          empleado.nombre
                        }
                      </strong>

                      <span className="text-xs text-slate-500">
                        {
                          empleado.puesto
                        }
                      </span>
                    </span>
                  </label>
                ),
              )}
            </div>
          )}
        </fieldset>

        <div className="md:col-span-2 xl:col-span-4">
          <label
            htmlFor="observaciones"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Observaciones o indicaciones
          </label>

          <textarea
            id="observaciones"
            name="observaciones"
            rows={4}
            defaultValue={
              cotizacion?.observaciones ??
              ""
            }
            placeholder="Herramientas, equipo requerido o instrucciones para el personal..."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
        <Link
          href={
            cotizacion
              ? `/administracion/compras/cotizaciones/${cotizacion.id}`
              : "/trabajos"
          }
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={
            clientes.length === 0
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Save
            size={18}
          />
          Crear y asignar trabajo
        </button>
      </div>
    </form>
  );
}