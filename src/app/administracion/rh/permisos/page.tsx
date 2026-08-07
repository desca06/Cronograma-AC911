import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { desc, eq, sql } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { empleados, permisos } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PermisosPageProps = {
  searchParams: Promise<{
    estado?: string;
    creado?: string;
    eliminado?: string;
    error?: string;
  }>;
};

function nombreTipo(tipo: string) {
  const tipos: Record<string, string> = {
    PERSONAL: "Personal",
    CITA_MEDICA: "Cita médica",
    ENFERMEDAD: "Enfermedad",
  };

  return tipos[tipo] ?? tipo;
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

function formatearHora(hora: string) {
  return hora.slice(0, 5);
}

function claseEstado(estado: string) {
  if (estado === "APROBADO") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (estado === "RECHAZADO") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function nombreEstado(estado: string) {
  if (estado === "APROBADO") {
    return "Aprobado";
  }

  if (estado === "RECHAZADO") {
    return "Rechazado";
  }

  return "Pendiente";
}

export default async function PermisosPage({
  searchParams,
}: PermisosPageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const estadoSeleccionado =
    parametros.estado === "APROBADO" ||
    parametros.estado === "RECHAZADO" ||
    parametros.estado === "PENDIENTE"
      ? parametros.estado
      : undefined;

  const condiciones = estadoSeleccionado
    ? eq(permisos.estado, estadoSeleccionado)
    : undefined;

  const listaPermisos = await db
    .select({
      id: permisos.id,
      empleado: empleados.nombre,
      puesto: empleados.puesto,
      tipo: permisos.tipo,
      fecha: permisos.fecha,
      horaInicio: permisos.horaInicio,
      horaFin: permisos.horaFin,
      estado: permisos.estado,
      motivo: permisos.motivo,
    })
    .from(permisos)
    .innerJoin(
      empleados,
      eq(permisos.empleadoId, empleados.id),
    )
    .where(condiciones)
    .orderBy(desc(permisos.fecha), desc(permisos.id));

  const indicadores = await db
    .select({
      total: sql<number>`count(*)::int`,
      pendientes: sql<number>`
        count(*) filter (
          where ${permisos.estado} = 'PENDIENTE'
        )::int
      `,
      aprobados: sql<number>`
        count(*) filter (
          where ${permisos.estado} = 'APROBADO'
        )::int
      `,
      rechazados: sql<number>`
        count(*) filter (
          where ${permisos.estado} = 'RECHAZADO'
        )::int
      `,
    })
    .from(permisos);

  const resumen = indicadores[0] ?? {
    total: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
  };

  return (
    <AppShell>
      <PageHeader
        title="Permisos"
        description="Administrá las solicitudes de permisos del personal."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href="/administracion/rh"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a Recursos Humanos
          </Link>
        </div>

        {parametros.creado === "true" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            El permiso fue registrado correctamente.
          </div>
        )}

        {parametros.eliminado === "true" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            El permiso fue eliminado correctamente.
          </div>
        )}

        {parametros.error === "eliminar" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            No fue posible eliminar el permiso.
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Solicitudes registradas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consultá el estado y horario de cada permiso.
            </p>
          </div>

          <Link
            href="/administracion/rh/permisos/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <FilePlus2 size={18} />
            Nuevo permiso
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Total
              </p>

              <CalendarClock
                size={20}
                className="text-blue-600"
              />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {resumen.total}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-700">
                Pendientes
              </p>

              <Clock3 size={20} />
            </div>

            <p className="mt-3 text-3xl font-bold text-amber-800">
              {resumen.pendientes}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-700">
                Aprobados
              </p>

              <CheckCircle2 size={20} />
            </div>

            <p className="mt-3 text-3xl font-bold text-emerald-800">
              {resumen.aprobados}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-red-700">
                Rechazados
              </p>

              <XCircle size={20} />
            </div>

            <p className="mt-3 text-3xl font-bold text-red-800">
              {resumen.rechazados}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/administracion/rh/permisos"
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              !estadoSeleccionado
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Todos
          </Link>

          <Link
            href="/administracion/rh/permisos?estado=PENDIENTE"
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              estadoSeleccionado === "PENDIENTE"
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Pendientes
          </Link>

          <Link
            href="/administracion/rh/permisos?estado=APROBADO"
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              estadoSeleccionado === "APROBADO"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Aprobados
          </Link>

          <Link
            href="/administracion/rh/permisos?estado=RECHAZADO"
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              estadoSeleccionado === "RECHAZADO"
                ? "border-red-600 bg-red-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Rechazados
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {listaPermisos.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Stethoscope
                size={42}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-bold text-slate-900">
                No hay permisos registrados
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Registrá una solicitud para comenzar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Empleado
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tipo
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Horario
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {listaPermisos.map((permiso) => (
                    <tr
                      key={permiso.id}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {permiso.empleado}
                        </p>

                        <p className="text-sm text-slate-500">
                          {permiso.puesto}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {nombreTipo(permiso.tipo)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatearFecha(permiso.fecha)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatearHora(
                          permiso.horaInicio,
                        )}{" "}
                        -{" "}
                        {formatearHora(
                          permiso.horaFin,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${claseEstado(
                            permiso.estado,
                          )}`}
                        >
                          {nombreEstado(
                            permiso.estado,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/administracion/rh/permisos/${permiso.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Eye size={16} />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}