import { and, asc, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import {
  clientes,
  empleados,
  trabajos,
  trabajoEmpleados,
  vehiculos,
} from "@/db/schema";
import { requerirSupervisor } from "@/lib/auth";

import {
  actualizarEstadoTrabajo,
  eliminarTrabajo,
} from "./actions";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const coloresEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En camino": "bg-purple-100 text-purple-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Finalizado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-red-100 text-red-800",
};

const estadosDisponibles = [
  "Pendiente",
  "En camino",
  "En proceso",
  "Finalizado",
  "Cancelado",
];

type TrabajosPageProps = {
  searchParams: Promise<{
    clienteId?: string | string[];
    estado?: string | string[];
    empleadoId?: string | string[];
    vehiculoId?: string | string[];
    fecha?: string | string[];
  }>;
};

function obtenerParametro(
  valor: string | string[] | undefined,
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

export default async function TrabajosPage({
  searchParams,
}: TrabajosPageProps) {
  await requerirSupervisor();

  const parametros = await searchParams;

  const clienteFiltro = obtenerParametro(
    parametros.clienteId,
  );

  const estadoFiltro = obtenerParametro(
    parametros.estado,
  );

  const empleadoFiltro = obtenerParametro(
    parametros.empleadoId,
  );

  const vehiculoFiltro = obtenerParametro(
    parametros.vehiculoId,
  );

  const fechaFiltro = obtenerParametro(
    parametros.fecha,
  );

  const listaClientes = await db
    .select()
    .from(clientes)
    .where(eq(clientes.activo, true))
    .orderBy(asc(clientes.nombre));

  const listaVehiculos = await db
    .select()
    .from(vehiculos)
    .where(eq(vehiculos.activo, true))
    .orderBy(asc(vehiculos.nombre));

  const listaEmpleados = await db
    .select()
    .from(empleados)
    .where(
      and(
        eq(empleados.activo, true),
        inArray(
          empleados.puesto,
          [
            "Técnico",
            "Supervisor",
          ],
        ),
      ),
    )
    .orderBy(asc(empleados.nombre));

  const listaTrabajos = await db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      clienteId: trabajos.clienteId,
      vehiculoId: trabajos.vehiculoId,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      direccion: trabajos.direccion,
      estado: trabajos.estado,
      horaInicio: trabajos.horaInicio,
      clienteNombre: clientes.nombre,
      vehiculoNombre: vehiculos.nombre,
      firmaClienteUrl: trabajos.firmaClienteUrl,
      firmaClienteNombre: trabajos.firmaClienteNombre,
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
    );

  const asignaciones = await db
    .select({
      trabajoId: trabajoEmpleados.trabajoId,
      empleadoId: trabajoEmpleados.empleadoId,
      empleadoNombre: empleados.nombre,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      empleados,
      eq(
        trabajoEmpleados.empleadoId,
        empleados.id,
      ),
    );

  const empleadosPorTrabajo: Record<
    number,
    string[]
  > = {};

  const empleadoIdsPorTrabajo: Record<
    number,
    number[]
  > = {};

  for (const asignacion of asignaciones) {
    if (!empleadosPorTrabajo[asignacion.trabajoId]) {
      empleadosPorTrabajo[asignacion.trabajoId] = [];
    }

    if (!empleadoIdsPorTrabajo[asignacion.trabajoId]) {
      empleadoIdsPorTrabajo[asignacion.trabajoId] = [];
    }

    empleadosPorTrabajo[
      asignacion.trabajoId
    ].push(asignacion.empleadoNombre);

    empleadoIdsPorTrabajo[
      asignacion.trabajoId
    ].push(asignacion.empleadoId);
  }

  const trabajosFiltrados =
    listaTrabajos.filter((trabajo) => {
      const idsEmpleados =
        empleadoIdsPorTrabajo[trabajo.id] ?? [];

      const coincideCliente =
        !clienteFiltro ||
        String(trabajo.clienteId) ===
        clienteFiltro;

      const coincideEstado =
        !estadoFiltro ||
        trabajo.estado === estadoFiltro;

      const coincideEmpleado =
        !empleadoFiltro ||
        idsEmpleados.includes(
          Number(empleadoFiltro),
        );

      const coincideVehiculo =
        !vehiculoFiltro ||
        String(trabajo.vehiculoId ?? "") ===
        vehiculoFiltro;

      const coincideFecha =
        !fechaFiltro ||
        trabajo.fecha === fechaFiltro;

      return (
        coincideCliente &&
        coincideEstado &&
        coincideEmpleado &&
        coincideVehiculo &&
        coincideFecha
      );
    });

  const hayFiltros =
    Boolean(clienteFiltro) ||
    Boolean(estadoFiltro) ||
    Boolean(empleadoFiltro) ||
    Boolean(vehiculoFiltro) ||
    Boolean(fechaFiltro);

  return (
    <AppShell>
      <PageHeader
        title="Trabajos"
        description="Crea, administra y consulta las órdenes de trabajo."
      />

      <section className="space-y-8 p-5 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/trabajos/nuevo"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nuevo trabajo
          </Link>

          <Link
            href="/trabajos-asignados"
            className="inline-flex items-center justify-center rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            Ver trabajos asignados
          </Link>

          <Link
            href="/cronograma"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ver cronograma
          </Link>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Filtrar trabajos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Filtra los trabajos por cliente, estado, técnico, vehículo o fecha.
            </p>
          </div>

          <form
            method="get"
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <div>
              <label
                htmlFor="filtro-cliente"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Cliente
              </label>

              <select
                id="filtro-cliente"
                name="clienteId"
                defaultValue={clienteFiltro}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="">
                  Todos los clientes
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
              <label
                htmlFor="filtro-estado"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Estado
              </label>

              <select
                id="filtro-estado"
                name="estado"
                defaultValue={estadoFiltro}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="">
                  Todos los estados
                </option>

                {estadosDisponibles.map(
                  (estado) => (
                    <option
                      key={estado}
                      value={estado}
                    >
                      {estado}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-empleado"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Técnico o empleado
              </label>

              <select
                id="filtro-empleado"
                name="empleadoId"
                defaultValue={empleadoFiltro}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="">
                  Todos los empleados
                </option>

                {listaEmpleados.map(
                  (empleado) => (
                    <option
                      key={empleado.id}
                      value={empleado.id}
                    >
                      {empleado.nombre}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-vehiculo"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Vehículo
              </label>

              <select
                id="filtro-vehiculo"
                name="vehiculoId"
                defaultValue={vehiculoFiltro}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="">
                  Todos los vehículos
                </option>

                {listaVehiculos.map(
                  (vehiculo) => (
                    <option
                      key={vehiculo.id}
                      value={vehiculo.id}
                    >
                      {vehiculo.nombre}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-fecha"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Fecha
              </label>

              <input
                id="filtro-fecha"
                name="fecha"
                type="date"
                defaultValue={fechaFiltro}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Aplicar filtros
              </button>

              <Link
                href="/trabajos"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Trabajos registrados
              </h2>

              <p className="text-sm text-slate-500">
                {hayFiltros
                  ? `Mostrando ${trabajosFiltrados.length} de ${listaTrabajos.length}`
                  : `Total: ${listaTrabajos.length}`}
              </p>
            </div>

            {hayFiltros && (
              <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                Filtros activos
              </span>
            )}
          </div>

          {trabajosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h3 className="text-lg font-bold text-slate-900">
                No se encontraron trabajos
              </h3>

              <p className="mt-2 text-slate-500">
                Prueba cambiando o limpiando los filtros.
              </p>

              <Link
                href="/trabajos"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Limpiar filtros
              </Link>
            </div>
          ) : (
            trabajosFiltrados.map((trabajo) => (
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
                          className={`rounded-full px-3 py-1 text-xs font-bold ${coloresEstado[
                            trabajo.estado
                            ] ??
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
                        {trabajo.horaInicio ||
                          "Sin definir"}
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
                        {empleadosPorTrabajo[
                          trabajo.id
                        ]?.join(" / ") ||
                          "Sin empleados asignados"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 xl:min-w-[430px]">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/trabajos/${trabajo.id}/editar`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Editar
                      </Link>
                      <Link

                        href={`/evidencias/${trabajo.id}`}
                        className="rounded-lg bg-emerald-100 px-4 py-2 text-center text-sm font-semibold text-emerald-800 hover:bg-emerald-200"
                      >
                        Evidencias
                      </Link>

                      <Link
                        href={`/trabajos/${trabajo.id}/pdf`}
                        target="_blank"
                        className="rounded-lg bg-sky-100 px-4 py-2 text-center text-sm font-semibold text-sky-800 hover:bg-sky-200"
                      >
                        PDF
                      </Link>
                    </div>
                    <form action={eliminarTrabajo}>
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
      </section>
    </AppShell>
  );
}