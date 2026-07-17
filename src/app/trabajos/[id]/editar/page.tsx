import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  clientes,
  empleados,
  trabajos,
  trabajoEmpleados,
  vehiculos,
} from "@/db/schema";

import { actualizarTrabajoCompleto } from "../../actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EditarTrabajoPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarTrabajoPage({
  params,
}: EditarTrabajoPageProps) {
  const { id: idTexto } = await params;
  const id = Number(idTexto);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const trabajo = db
    .select()
    .from(trabajos)
    .where(eq(trabajos.id, id))
    .get();

  if (!trabajo) {
    notFound();
  }

  const listaClientes = db
    .select()
    .from(clientes)
    .where(eq(clientes.activo, true))
    .orderBy(asc(clientes.nombre))
    .all();

  const listaVehiculos = db
    .select()
    .from(vehiculos)
    .where(eq(vehiculos.activo, true))
    .orderBy(asc(vehiculos.nombre))
    .all();

  const listaEmpleados = db
    .select()
    .from(empleados)
    .where(eq(empleados.activo, true))
    .orderBy(asc(empleados.nombre))
    .all();

  const asignaciones = db
    .select({
      empleadoId: trabajoEmpleados.empleadoId,
    })
    .from(trabajoEmpleados)
    .where(eq(trabajoEmpleados.trabajoId, id))
    .all();

  const empleadosAsignados = new Set(
    asignaciones.map(
      (asignacion) => asignacion.empleadoId,
    ),
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              Orden #{trabajo.id}
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Editar trabajo
            </h1>

            <p className="mt-1 text-slate-500">
              Modifica la información y el personal asignado.
            </p>
          </div>

          <Link
            href="/trabajos"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar y volver
          </Link>
        </header>

        <form
          action={actualizarTrabajoCompleto}
          className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
        >
          <input
            type="hidden"
            name="id"
            value={trabajo.id}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Fecha
            </label>

            <input
              name="fecha"
              type="date"
              required
              defaultValue={trabajo.fecha}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Cliente
            </label>

            <select
              name="clienteId"
              required
              defaultValue={trabajo.clienteId}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              {listaClientes.map((cliente) => (
                <option
                  key={cliente.id}
                  value={cliente.id}
                >
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Vehículo
            </label>

            <select
              name="vehiculoId"
              defaultValue={trabajo.vehiculoId ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="">
                Sin vehículo asignado
              </option>

              {listaVehiculos.map((vehiculo) => (
                <option
                  key={vehiculo.id}
                  value={vehiculo.id}
                >
                  {vehiculo.nombre} — {vehiculo.estado}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo de trabajo
            </label>

            <select
              name="tipo"
              required
              defaultValue={trabajo.tipo}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="Instalación">
                Instalación
              </option>

              <option value="Mantenimiento">
                Mantenimiento
              </option>

              <option value="Reparación">
                Reparación
              </option>

              <option value="Diagnóstico">
                Diagnóstico
              </option>

              <option value="Supervisión">
                Supervisión
              </option>

              <option value="Otro">
                Otro
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Descripción
            </label>

            <input
              name="descripcion"
              required
              defaultValue={trabajo.descripcion}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Dirección
            </label>

            <input
              name="direccion"
              defaultValue={trabajo.direccion ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Hora de inicio
            </label>

            <input
              name="horaInicio"
              type="time"
              defaultValue={trabajo.horaInicio ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Hora de finalización
            </label>

            <input
              name="horaFin"
              type="time"
              defaultValue={trabajo.horaFin ?? ""}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Estado
            </label>

            <select
              name="estado"
              defaultValue={trabajo.estado}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="Pendiente">
                Pendiente
              </option>

              <option value="En camino">
                En camino
              </option>

              <option value="En proceso">
                En proceso
              </option>

              <option value="Finalizado">
                Finalizado
              </option>

              <option value="Cancelado">
                Cancelado
              </option>
            </select>
          </div>

          <div />

          <fieldset className="md:col-span-2">
            <legend className="mb-3 text-sm font-semibold text-slate-700">
              Empleados asignados
            </legend>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {listaEmpleados.map((empleado) => (
                <label
                  key={empleado.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
                >
                  <input
                    type="checkbox"
                    name="empleadoIds"
                    value={empleado.id}
                    defaultChecked={empleadosAsignados.has(
                      empleado.id,
                    )}
                    className="h-4 w-4"
                  />

                  <span>
                    <strong className="block text-sm text-slate-900">
                      {empleado.nombre}
                    </strong>

                    <span className="text-xs text-slate-500">
                      {empleado.puesto}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Observaciones
            </label>

            <textarea
              name="observaciones"
              rows={4}
              defaultValue={trabajo.observaciones ?? ""}
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Guardar cambios
            </button>

            <Link
              href="/trabajos"
              className="rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}