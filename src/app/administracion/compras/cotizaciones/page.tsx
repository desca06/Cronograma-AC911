import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
  XCircle,
  CircleDollarSign,
  Eye,
} from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  cotizaciones,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";
import {
  cotizacionTrabajos,
} from "@/db/schema-cotizacion-trabajo";

type PageProps = {
  searchParams: Promise<{
    creada?: string;
    eliminada?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatearDinero(valorEnCentavos: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(valorEnCentavos / 100);
}

function formatearFecha(fecha: Date | null) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
  }).format(fecha);
}

function obtenerEstiloEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return {
        texto: "Pendiente",
        clases:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "APROBADA":
      return {
        texto: "Aprobada",
        clases:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "RECHAZADA":
      return {
        texto: "Rechazada",
        clases:
          "border-red-200 bg-red-50 text-red-700",
      };

    case "VENCIDA":
      return {
        texto: "Vencida",
        clases:
          "border-slate-200 bg-slate-100 text-slate-600",
      };

    default:
      return {
        texto: estado,
        clases:
          "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
}

export default async function CotizacionesPage({
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const listaCotizaciones = await db
    .select({
      id: cotizaciones.id,
      codigo: cotizaciones.codigo,
      titulo: cotizaciones.titulo,
      estado: cotizaciones.estado,
      fechaSolicitud: cotizaciones.fechaSolicitud,
      validaHasta: cotizaciones.validaHasta,
      total: cotizaciones.total,
      clienteNombre: clientes.nombre,
      trabajoId:
        cotizacionTrabajos.trabajoId,
    })
    .from(cotizaciones)
    .innerJoin(
      clientes,
      eq(cotizaciones.clienteId, clientes.id),
    )
    .leftJoin(
      cotizacionTrabajos,
      eq(
        cotizacionTrabajos.cotizacionId,
        cotizaciones.id,
      ),
    )
    .orderBy(
      desc(cotizaciones.fechaSolicitud),
      desc(cotizaciones.id),
    );

  const pendientes = listaCotizaciones.filter(
    (cotizacion) =>
      cotizacion.estado === "PENDIENTE",
  ).length;

  const aprobadas = listaCotizaciones.filter(
    (cotizacion) =>
      cotizacion.estado === "APROBADA",
  ).length;

  const rechazadas = listaCotizaciones.filter(
    (cotizacion) =>
      cotizacion.estado === "RECHAZADA",
  ).length;

  const montoTotal = listaCotizaciones.reduce(
    (total, cotizacion) =>
      total + cotizacion.total,
    0,
  );

  return (
    <AppShell>
      <PageHeader
        title="Cotizaciones"
        description="Crea, consulta y administra las cotizaciones comerciales de AC911."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href="/administracion/compras"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={18} />
            Regresar a Compras
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <FileText size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total de cotizaciones
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {listaCotizaciones.length}
                </p>

                <p className="text-xs text-slate-400">
                  Historial registrado
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <Clock3 size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pendientes
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {pendientes}
                </p>

                <p className="text-xs text-slate-400">
                  Esperando respuesta
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Aprobadas
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {aprobadas}
                </p>

                <p className="text-xs text-slate-400">
                  Cotizaciones aceptadas
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                <CircleDollarSign size={24} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  Monto cotizado
                </p>

                <p className="truncate text-xl font-bold text-slate-900">
                  {formatearDinero(montoTotal)}
                </p>

                <p className="text-xs text-slate-400">
                  Suma de todas las cotizaciones
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Listado de cotizaciones
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulta el cliente, estado, vigencia y monto de cada cotización.
            </p>
          </div>

          <Link
            href="/administracion/compras/cotizaciones/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Nueva cotización
          </Link>
        </div>

        {parametros.creada === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Cotización creada correctamente.
          </div>
        )}

        {parametros.eliminada === "1" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Cotización eliminada correctamente.
          </div>
        )}

        {parametros.error === "id" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            La cotización seleccionada no existe o no es válida.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cotización
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cliente
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Fecha
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Vigencia
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Total
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {listaCotizaciones.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                        <FileText size={27} />
                      </div>

                      <p className="mt-4 font-semibold text-slate-700">
                        No hay cotizaciones registradas
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Crea la primera cotización comercial de AC911.
                      </p>

                      <Link
                        href="/administracion/compras/cotizaciones/nueva"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Plus size={18} />
                        Crear cotización
                      </Link>
                    </td>
                  </tr>
                ) : (
                  listaCotizaciones.map((cotizacion) => {
                    const estado = obtenerEstiloEstado(
                      cotizacion.estado,
                    );

                    return (
                      <tr
                        key={cotizacion.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="min-w-[250px]">
                            <p className="font-semibold text-slate-900">
                              {cotizacion.titulo}
                            </p>

                            <p className="mt-1 text-xs font-bold text-blue-700">
                              {cotizacion.codigo}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            {cotizacion.clienteNombre}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatearFecha(
                            cotizacion.fechaSolicitud,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatearFecha(
                            cotizacion.validaHasta,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">
                          {formatearDinero(
                            cotizacion.total,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estado.clases}`}
                          >
                            {estado.texto}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/administracion/compras/cotizaciones/${cotizacion.id}`}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye size={16} />
                              Ver detalle
                            </Link>

                            {cotizacion.estado === "APROBADA" &&
                              !cotizacion.trabajoId && (
                                <Link
                                  href={`/trabajos/nuevo?cotizacionId=${cotizacion.id}`}
                                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                  Crear trabajo
                                </Link>
                              )}

                            {cotizacion.trabajoId && (
                              <Link
                                href={`/trabajos-asignados?trabajoId=${cotizacion.trabajoId}#trabajo-${cotizacion.trabajoId}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-200"
                              >
                                Ver trabajo
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {rechazadas > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <XCircle size={17} />
            {rechazadas} cotización
            {rechazadas === 1 ? "" : "es"} rechazada
            {rechazadas === 1 ? "" : "s"}.
          </div>
        )}
      </section>
    </AppShell>
  );
}