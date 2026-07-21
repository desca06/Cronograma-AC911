import { and, desc, eq, gte, lte} from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  trabajos,
  trabajoEmpleados,
  usuarios,
  vehiculos,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

import { CheckCircle2, Filter, RotateCcw } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HistorialPageProps = {
  searchParams: Promise<{
    desde?: string | string[];
    hasta?: string | string[];
  }>;
};

export default async function HistorialPage({ searchParams,
}: HistorialPageProps) {
  const sesion = await requerirSesion();

  const parametros = await searchParams;

  const desde =
    typeof parametros.desde === "string"
      ? parametros.desde
      : "";

  const hasta =
    typeof parametros.hasta === "string"
      ? parametros.hasta
      : "";

  const filtrosActivos = Boolean(
    desde || hasta,
  );

  if (sesion.rol === "SUPERVISOR") {
    redirect("/dashboard");
  }

  const usuario = db
    .select({
      empleadoId: usuarios.empleadoId,
    })
    .from(usuarios)
    .where(eq(usuarios.id, sesion.usuarioId))
    .get();

  if (!usuario?.empleadoId) {
    return (
      <AppShell>
        <PageHeader
          title="Historial"
          description="Trabajos finalizados"
        />

        <section className="p-5 md:p-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-xl font-bold text-amber-900">
              Cuenta sin empleado vinculado
            </h2>

            <p className="mt-2 text-amber-700">
              Un supervisor debe vincular tu usuario con un empleado.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  const historial = db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      direccion: trabajos.direccion,
      estado: trabajos.estado,
      horaInicio: trabajos.horaInicio,
      horaFin: trabajos.horaFin,
      observacionesSupervisor:
        trabajos.observaciones,
      observacionesTecnico:
        trabajos.observacionesTecnico,
      clienteNombre: clientes.nombre,
      vehiculoNombre: vehiculos.nombre,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      trabajos,
      eq(
        trabajoEmpleados.trabajoId,
        trabajos.id,
      ),
    )
    .innerJoin(
      clientes,
      eq(
        trabajos.clienteId,
        clientes.id,
      ),
    )
    .leftJoin(
      vehiculos,
      eq(
        trabajos.vehiculoId,
        vehiculos.id,
      ),
    )
    .where(
      and(
        eq(
          trabajoEmpleados.empleadoId,
          usuario.empleadoId,
        ),
        eq(
          trabajos.estado,
          "Finalizado",
        ),
        desde
        ? gte(trabajos.fecha, desde)
        : undefined,
        hasta
        ? lte(trabajos.fecha, hasta)
        : undefined,
      ),
    )
    .orderBy(
      desc(trabajos.fecha),
      desc(trabajos.horaInicio),
    )
    .all();

  return (
    <AppShell>
      <PageHeader
        title="Historial"
        description="Consulta todos tus trabajos finalizados."
      />

      <section className="space-y-6 p-5 md:p-8">

        <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
            label="Trabajos finalizados"
            value={historial.length}
            helper="Total de trabajos completados"
            icon={CheckCircle2}
            color="green"
        />

        <StatCard
            label="Historial"
            value="Técnico"
            helper="Consulta de asignaciones finalizadas"
            icon={CheckCircle2}
            color="blue"
        />

        <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-4 py-4 transition hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-11 w-11 place-items-center rounded-xl ${
                  filtrosActivos
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                <Filter size={20} />
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  Filtrar historial
                </p>

                <p className="text-sm text-slate-500">
                  {filtrosActivos
                    ? "Hay filtros aplicados"
                    : "Selecciona un rango de fechas"}
                </p>
              </div>
            </div>

            {filtrosActivos && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                Activo
              </span>
            )}
          </summary>

          <form
            method="GET"
            className="border-t border-slate-200 p-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="desde"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Desde
                </label>

                <input
                  id="desde"
                  type="date"
                  name="desde"
                  defaultValue={desde}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="hasta"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Hasta
                </label>

                <input
                  id="hasta"
                  type="date"
                  name="hasta"
                  defaultValue={hasta}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {filtrosActivos && (
                <Link
                  href="/historial"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <RotateCcw size={18} />
                  Limpiar
                </Link>
              )}

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
              >
                <Filter size={18} />
                Aplicar filtros
              </button>
            </div>
          </form>
        </details>
        </div>

        {historial.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

            <div className="text-5xl">
              📋
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No hay trabajos finalizados
            </h2>

            <p className="mt-2 text-slate-500">
              Cuando finalices un trabajo aparecerá aquí.
            </p>

          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
                        {historial.map((trabajo) => (
              <article
                key={trabajo.id}
                className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      {trabajo.fecha}
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {trabajo.clienteNombre}
                    </h2>

                    <p className="mt-1 font-medium text-slate-700">
                      {trabajo.tipo}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    ✔ Finalizado
                  </span>
                </div>

                <p className="mt-5 text-slate-700">
                  {trabajo.descripcion}
                </p>

                <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <p>
                    <strong>Hora:</strong>{" "}
                    {trabajo.horaInicio || "Sin definir"}
                    {trabajo.horaFin
                      ? ` - ${trabajo.horaFin}`
                      : ""}
                  </p>

                  <p>
                    <strong>Vehículo:</strong>{" "}
                    {trabajo.vehiculoNombre ??
                      "Sin vehículo"}
                  </p>

                  <p className="sm:col-span-2">
                    <strong>Dirección:</strong>{" "}
                    {trabajo.direccion ??
                      "Sin dirección"}
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-900">
                    Indicaciones del supervisor
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                    {trabajo.observacionesSupervisor ||
                      "El supervisor no agregó indicaciones."}
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-bold text-blue-900">
                    Observaciones del técnico
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-900">
                    {trabajo.observacionesTecnico ||
                      "No se agregaron observaciones."}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/evidencias/${trabajo.id}`}
                    className="flex-1 rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    📂 Ver evidencias
                  </Link>

                  <Link
                    href={`/cronograma?trabajoId=${trabajo.id}`}
                    className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800"
                  >
                    ✅ Ver detalles
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}