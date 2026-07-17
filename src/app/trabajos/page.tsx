import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import {
  clientes,
  empleados,
  trabajos,
  trabajoEmpleados,
  vehiculos,
} from "@/db/schema";

import {
  actualizarEstadoTrabajo,
  crearTrabajo,
  eliminarTrabajo,
} from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const coloresEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En camino": "bg-purple-100 text-purple-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Finalizado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-red-100 text-red-800",
};

export default function TrabajosPage() {
  const fechaHoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
  });

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

  const listaTrabajos = db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      direccion: trabajos.direccion,
      estado: trabajos.estado,
      horaInicio: trabajos.horaInicio,
      clienteNombre: clientes.nombre,
      vehiculoNombre: vehiculos.nombre,
    })
    .from(trabajos)
    .innerJoin(
      clientes,
      eq(trabajos.clienteId, clientes.id),
    )
    .leftJoin(
      vehiculos,
      eq(trabajos.vehiculoId, vehiculos.id),
    )
    .orderBy(
      desc(trabajos.fecha),
      desc(trabajos.id),
    )
    .all();

  const asignaciones = db
    .select({
      trabajoId: trabajoEmpleados.trabajoId,
      empleadoNombre: empleados.nombre,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      empleados,
      eq(trabajoEmpleados.empleadoId, empleados.id),
    )
    .all();

  const empleadosPorTrabajo =
    asignaciones.reduce<Record<number, string[]>>(
      (resultado, asignacion) => {
        if (!resultado[asignacion.trabajoId]) {
          resultado[asignacion.trabajoId] = [];
        }

        resultado[asignacion.trabajoId].push(
          asignacion.empleadoNombre,
        );

        return resultado;
      },
      {},
    );

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              Control de Trabajos
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Trabajos
            </h1>

            <p className="mt-1 text-slate-500">
              Crea y administra las órdenes de trabajo.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Volver al dashboard
          </Link>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Crear nuevo trabajo
          </h2>

          {listaClientes.length === 0 && (
            <p className="mt-4 rounded-xl bg-amber-100 p-4 text-sm font-medium text-amber-800">
              Primero debes registrar al menos un cliente.
            </p>
          )}

          <form
            action={crearTrabajo}
            className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Fecha
              </label>

              <input
                name="fecha"
                type="date"
                required
                defaultValue={fechaHoy}
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
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="" disabled>
                  Selecciona un cliente
                </option>

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
                defaultValue=""
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
                defaultValue="Mantenimiento"
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
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Descripción
              </label>

              <input
                name="descripcion"
                required
                placeholder="Ejemplo: Instalación de equipos VRF"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Dirección del trabajo
              </label>

              <input
                name="direccion"
                placeholder="Dirección o ubicación"
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Estado inicial
              </label>

              <select
                name="estado"
                defaultValue="Pendiente"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En camino">En camino</option>
                <option value="En proceso">En proceso</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <fieldset className="md:col-span-2 xl:col-span-4">
              <legend className="mb-3 text-sm font-semibold text-slate-700">
                Empleados asignados
              </legend>

              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {listaEmpleados.map((empleado) => (
                  <label
                    key={empleado.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
                  >
                    <input
                      type="checkbox"
                      name="empleadoIds"
                      value={empleado.id}
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

            <div className="md:col-span-2 xl:col-span-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observaciones
              </label>

              <textarea
                name="observaciones"
                rows={3}
                placeholder="Herramientas, equipo requerido o instrucciones"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                disabled={listaClientes.length === 0}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Guardar trabajo
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Trabajos registrados
            </h2>

            <p className="text-sm text-slate-500">
              Total: {listaTrabajos.length}
            </p>
          </div>

          {listaTrabajos.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Todavía no hay trabajos registrados.
            </div>
          ) : (
            listaTrabajos.map((trabajo) => (
              <article
                key={trabajo.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900">
                          {trabajo.clienteNombre}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            coloresEstado[trabajo.estado] ??
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {trabajo.estado}
                        </span>
                      </div>

                      <p className="mt-1 font-medium text-blue-700">
                        {trabajo.tipo}
                      </p>
                    </div>

                    <p className="text-slate-700">
                      {trabajo.descripcion}
                    </p>

                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <strong>Fecha:</strong>{" "}
                        {trabajo.fecha}
                      </p>

                      <p>
                        <strong>Hora:</strong>{" "}
                        {trabajo.horaInicio || "Sin definir"}
                      </p>

                      <p>
                        <strong>Vehículo:</strong>{" "}
                        {trabajo.vehiculoNombre ||
                          "Sin asignar"}
                      </p>

                      <p>
                        <strong>Dirección:</strong>{" "}
                        {trabajo.direccion ||
                          "Sin dirección"}
                      </p>

                      <p className="sm:col-span-2">
                        <strong>Equipo:</strong>{" "}
                        {empleadosPorTrabajo[trabajo.id]?.join(
                          " / ",
                        ) || "Sin empleados asignados"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/trabajos/${trabajo.id}/editar`}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Editar
                    </Link>
                    <form
                      action={actualizarEstadoTrabajo}
                      className="flex gap-2"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={trabajo.id}
                      />

                      <select
                        name="estado"
                        defaultValue={trabajo.estado}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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

                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Actualizar
                      </button>
                    </form>

                    <form action={eliminarTrabajo}>
                      <Link
                        href={`/trabajos/${trabajo.id}/editar`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Editar
                      </Link>
                      <input
                        type="hidden"
                        name="id"
                        value={trabajo.id}
                      />

                      <button
                        type="submit"
                        className="w-full rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}