import { asc, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import {
  clientes,
  empleados,
  trabajos,
  trabajoEmpleados,
  vehiculos,
} from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const coloresEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En camino": "bg-purple-100 text-purple-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Finalizado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-red-100 text-red-800",
};

function obtenerFechaHoy(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
  });
}

function formatearFecha(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString(
    "es-GT",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

type CronogramaPageProps = {
  searchParams: Promise<{
    fecha?: string | string[];
  }>;
};

export default async function CronogramaPage({
  searchParams,
}: CronogramaPageProps) {
  const parametros = await searchParams;

  const fechaParametro =
    typeof parametros.fecha === "string"
      ? parametros.fecha
      : "";

  const fechaSeleccionada =
    fechaParametro || obtenerFechaHoy();

  const listaTrabajos = await db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      direccion: trabajos.direccion,
      estado: trabajos.estado,
      horaInicio: trabajos.horaInicio,
      horaFin: trabajos.horaFin,
      observaciones: trabajos.observaciones,
      clienteNombre: clientes.nombre,
      clienteTelefono: clientes.telefono,
      vehiculoNombre: vehiculos.nombre,
      vehiculoPlaca: vehiculos.placa,
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
    .where(eq(trabajos.fecha, fechaSeleccionada))
    .orderBy(
      asc(trabajos.horaInicio),
      asc(trabajos.id),
    )
;

  const asignaciones = await db
    .select({
      trabajoId: trabajoEmpleados.trabajoId,
      empleadoNombre: empleados.nombre,
      empleadoPuesto: empleados.puesto,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      empleados,
      eq(trabajoEmpleados.empleadoId, empleados.id),
    )
;

  const empleadosPorTrabajo =
    asignaciones.reduce<
      Record<
        number,
        Array<{
          nombre: string;
          puesto: string;
        }>
      >
    >((resultado, asignacion) => {
      if (!resultado[asignacion.trabajoId]) {
        resultado[asignacion.trabajoId] = [];
      }

      resultado[asignacion.trabajoId].push({
        nombre: asignacion.empleadoNombre,
        puesto: asignacion.empleadoPuesto,
      });

      return resultado;
    }, {});

  const totalPendientes = listaTrabajos.filter(
    (trabajo) => trabajo.estado === "Pendiente",
  ).length;

  const totalEnProceso = listaTrabajos.filter(
    (trabajo) =>
      trabajo.estado === "En proceso" ||
      trabajo.estado === "En camino",
  ).length;

  const totalFinalizados = listaTrabajos.filter(
    (trabajo) => trabajo.estado === "Finalizado",
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              Cronograma
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Cronograma diario
            </h1>

            <p className="mt-1 capitalize text-slate-500">
              {formatearFecha(fechaSeleccionada)}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/trabajos"
              className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Crear trabajo
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Volver al inicio
            </Link>
          </div>
        </header>

        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            method="GET"
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="fecha"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Seleccionar fecha
              </label>

              <input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={fechaSeleccionada}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Ver cronograma
            </button>

            <Link
              href="/cronograma"
              className="rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver hoy
            </Link>
          </form>
        </section>

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Trabajos programados
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {listaTrabajos.length}
            </p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-700">
              Pendientes
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-900">
              {totalPendientes}
            </p>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">
              En camino o proceso
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {totalEnProceso}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-700">
              Finalizados
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {totalFinalizados}
            </p>
          </article>
        </section>

        {listaTrabajos.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              No hay trabajos para esta fecha
            </h2>

            <p className="mt-2 text-slate-500">
              Selecciona otra fecha o crea un nuevo trabajo.
            </p>

            <Link
              href="/trabajos"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Crear trabajo
            </Link>
          </section>
        ) : (
          <section className="grid gap-5 xl:grid-cols-2">
            {listaTrabajos.map((trabajo, indice) => {
              const equipo =
                empleadosPorTrabajo[trabajo.id] ?? [];

              return (
                <article
                  key={trabajo.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                          Trabajo {indice + 1}
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-slate-900">
                          {trabajo.clienteNombre}
                        </h2>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          coloresEstado[trabajo.estado] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {trabajo.estado}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Actividad
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {trabajo.tipo}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {trabajo.descripcion}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Vehículo
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {trabajo.vehiculoNombre ??
                            "Sin vehículo"}
                        </p>

                        {trabajo.vehiculoPlaca && (
                          <p className="text-xs text-slate-500">
                            Placa: {trabajo.vehiculoPlaca}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Horario
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {trabajo.horaInicio || "Sin definir"}
                          {trabajo.horaFin
                            ? ` - ${trabajo.horaFin}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Equipo asignado
                      </p>

                      {equipo.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Sin empleados asignados
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {equipo.map((empleado) => (
                            <span
                              key={`${trabajo.id}-${empleado.nombre}`}
                              className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800"
                            >
                              {empleado.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Dirección
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {trabajo.direccion ||
                          "Sin dirección registrada"}
                      </p>
                    </div>

                    {trabajo.observaciones && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">
                          Observaciones
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {trabajo.observaciones}
                        </p>
                      </div>
                    )}

                    <Link
                      href="/trabajos"
                      className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Administrar trabajo
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}