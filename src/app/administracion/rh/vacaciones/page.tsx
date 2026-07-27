import Link from "next/link";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  Eye,
  Plus,
  Umbrella,
} from "lucide-react";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { empleados, vacaciones } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type VacacionesPageProps = {
  searchParams: Promise<{
    creada?: string;
    eliminada?: string;
  }>;
};

function estiloEstado(estado: string) {
  switch (estado) {
    case "APROBADA":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "RECHAZADA":
      return "border-red-200 bg-red-50 text-red-700";

    case "CANCELADA":
      return "border-slate-200 bg-slate-100 text-slate-700";

    case "PENDIENTE":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function textoEstado(estado: string) {
  switch (estado) {
    case "APROBADA":
      return "Aprobada";

    case "RECHAZADA":
      return "Rechazada";

    case "CANCELADA":
      return "Cancelada";

    case "PENDIENTE":
    default:
      return "Pendiente";
  }
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(anio, mes - 1, dia));
}

export default async function VacacionesPage({
  searchParams,
}: VacacionesPageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const listaVacaciones = await db
    .select({
      id: vacaciones.id,
      empleadoId: vacaciones.empleadoId,
      empleado: empleados.nombre,
      puesto: empleados.puesto,
      fechaInicio: vacaciones.fechaInicio,
      fechaFin: vacaciones.fechaFin,
      cantidadDias: vacaciones.cantidadDias,
      estado: vacaciones.estado,
      observacion: vacaciones.observacion,
      creadoEn: vacaciones.creadoEn,
    })
    .from(vacaciones)
    .innerJoin(
      empleados,
      eq(vacaciones.empleadoId, empleados.id),
    )
    .orderBy(desc(vacaciones.creadoEn));

  const resumen = await db
    .select({
      total: sql<number>`count(*)`,
      pendientes: sql<number>`
        count(*) filter (
          where ${vacaciones.estado} = 'PENDIENTE'
        )
      `,
      aprobadas: sql<number>`
        count(*) filter (
          where ${vacaciones.estado} = 'APROBADA'
        )
      `,
      rechazadas: sql<number>`
        count(*) filter (
          where ${vacaciones.estado} = 'RECHAZADA'
        )
      `,
    })
    .from(vacaciones);

  const totales = resumen[0] ?? {
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
  };

  return (
    <AppShell>
      <PageHeader
        title="Vacaciones"
        description="Control de solicitudes y períodos de vacaciones del personal."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-7xl">
          {parametros.creada === "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              La solicitud de vacaciones fue registrada correctamente.
            </div>
          )}

          {parametros.eliminada === "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              La solicitud de vacaciones fue eliminada correctamente.
            </div>
          )}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Solicitudes registradas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consultá y administrá las vacaciones de los empleados.
              </p>
            </div>

            <Link
              href="/administracion/rh/vacaciones/nueva"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Nueva solicitud
            </Link>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TarjetaResumen
              titulo="Total"
              cantidad={Number(totales.total)}
              icono={CalendarDays}
              clases="bg-blue-50 text-blue-700"
            />

            <TarjetaResumen
              titulo="Pendientes"
              cantidad={Number(totales.pendientes)}
              icono={CalendarClock}
              clases="bg-amber-50 text-amber-700"
            />

            <TarjetaResumen
              titulo="Aprobadas"
              cantidad={Number(totales.aprobadas)}
              icono={CalendarCheck}
              clases="bg-emerald-50 text-emerald-700"
            />

            <TarjetaResumen
              titulo="Rechazadas"
              cantidad={Number(totales.rechazadas)}
              icono={CalendarX}
              clases="bg-red-50 text-red-700"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {listaVacaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
                  <Umbrella size={32} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  No hay vacaciones registradas
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Todavía no se ha creado ninguna solicitud de vacaciones
                  para los empleados.
                </p>

                <Link
                  href="/administracion/rh/vacaciones/nueva"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Registrar solicitud
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Empleado
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Inicio
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Fin
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Días
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
                    {listaVacaciones.map((vacacion) => (
                      <tr
                        key={vacacion.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {vacacion.empleado}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {vacacion.puesto}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {formatearFecha(vacacion.fechaInicio)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {formatearFecha(vacacion.fechaFin)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                          {vacacion.cantidadDias}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estiloEstado(
                              vacacion.estado,
                            )}`}
                          >
                            {textoEstado(vacacion.estado)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <Link
                            href={`/administracion/rh/vacaciones/${vacacion.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                          >
                            <Eye size={15} />
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

type TarjetaResumenProps = {
  titulo: string;
  cantidad: number;
  icono: React.ElementType;
  clases: string;
};

function TarjetaResumen({
  titulo,
  cantidad,
  icono: Icono,
  clases,
}: TarjetaResumenProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {cantidad}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${clases}`}>
          <Icono size={23} />
        </div>
      </div>
    </div>
  );
}