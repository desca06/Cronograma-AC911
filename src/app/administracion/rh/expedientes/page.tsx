import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Edit3,
  Eye,
  FileText,
  FolderOpen,
  Plus,
  Search,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import {
  asc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  expedientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ExpedientesPageProps = {
  searchParams: Promise<{
    buscar?: string;
    estado?: string;
    success?: string;
    error?: string;
  }>;
};

function claseEstado(estado: string) {
  return estado === "ACTIVO"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-200 text-slate-700";
}

function nombreEstado(estado: string) {
  return estado === "ACTIVO"
    ? "Activo"
    : "Inactivo";
}

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(`${fecha}T00:00:00Z`),
  );
}

export default async function ExpedientesPage({
  searchParams,
}: ExpedientesPageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const buscar =
    parametros.buscar?.trim() ?? "";

  const estado =
    parametros.estado?.trim() ?? "";

  const condiciones = [];

  if (buscar) {
    condiciones.push(
      or(
        ilike(
          expedientes.codigo,
          `%${buscar}%`,
        ),
        ilike(
          expedientes.dpi,
          `%${buscar}%`,
        ),
        ilike(
          empleados.nombre,
          `%${buscar}%`,
        ),
      ),
    );
  }

  if (
    estado === "ACTIVO" ||
    estado === "INACTIVO"
  ) {
    condiciones.push(
      eq(
        expedientes.estado,
        estado,
      ),
    );
  }

  const listaExpedientes =
    await db
      .select({
        id: expedientes.id,
        codigo:
          expedientes.codigo,
        fotoUrl:
          expedientes.fotoUrl,
        empleado:
          empleados.nombre,
        puesto:
          empleados.puesto,
        dpi: expedientes.dpi,
        fechaIngreso:
          expedientes.fechaIngreso,
        estado:
          expedientes.estado,
      })
      .from(expedientes)
      .innerJoin(
        empleados,
        eq(
          expedientes.empleadoId,
          empleados.id,
        ),
      )
      .where(
        condiciones.length > 0
          ? sql`${sql.join(
              condiciones,
              sql` AND `,
            )}`
          : undefined,
      )
      .orderBy(
        asc(empleados.nombre),
      );

  const indicadores =
    await db
      .select({
        total:
          sql<number>`count(*)`,
        activos: sql<number>`
          count(*) filter (
            where ${expedientes.estado} = 'ACTIVO'
          )
        `,
        inactivos: sql<number>`
          count(*) filter (
            where ${expedientes.estado} = 'INACTIVO'
          )
        `,
      })
      .from(expedientes);

  const resumen =
    indicadores[0] ?? {
      total: 0,
      activos: 0,
      inactivos: 0,
    };

  return (
    <AppShell>
      <PageHeader
        title="Expedientes"
        description="Administración de expedientes laborales de empleados."
      />

      <section className="p-5 md:p-8">
        <div className="mb-6">
          <Link
            href="/administracion"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a administración
          </Link>
        </div>

        {parametros.success ===
          "eliminado" && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Expediente eliminado correctamente.
          </div>
        )}

        {parametros.error ===
          "expediente" && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            El expediente indicado no es válido.
          </div>
        )}

        {parametros.error ===
          "no-encontrado" && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            No se encontró el expediente.
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total de expedientes
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {Number(resumen.total)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <FolderOpen size={24} />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Expedientes activos
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {Number(
                    resumen.activos,
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <UserRoundCheck
                  size={24}
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Expedientes inactivos
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {Number(
                    resumen.inactivos,
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                <UserRoundX size={24} />
              </div>
            </div>
          </article>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <form
            method="GET"
            className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-3xl"
          >
            <div>
              <label
                htmlFor="buscar"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Buscar
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="buscar"
                  name="buscar"
                  type="search"
                  defaultValue={buscar}
                  placeholder="Código, empleado o DPI"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
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
                defaultValue={estado}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Todos
                </option>
                <option value="ACTIVO">
                  Activos
                </option>
                <option value="INACTIVO">
                  Inactivos
                </option>
              </select>
            </div>

            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Search size={17} />
                Buscar
              </button>

              <Link
                href="/administracion/rh/expedientes"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Limpiar
              </Link>
            </div>
          </form>

          <Link
            href="/administracion/rh/expedientes/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Nuevo expediente
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileText size={21} />
              Todos los expedientes creados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Desde aquí puedes consultar, editar o descargar cualquier expediente registrado.
            </p>
          </div>

          {listaExpedientes.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <FolderOpen
                size={48}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No hay expedientes
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No se encontraron expedientes con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Código
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Empleado
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      DPI
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha de ingreso
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {listaExpedientes.map(
                    (expediente) => (
                      <tr
                        key={
                          expediente.id
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="font-bold text-blue-700">
                            {expediente.codigo ??
                              "Sin código"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {
                              expediente.empleado
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              expediente.puesto
                            }
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {
                            expediente.dpi
                          }
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {formatearFecha(
                            expediente.fechaIngreso,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${claseEstado(
                              expediente.estado,
                            )}`}
                          >
                            {nombreEstado(
                              expediente.estado,
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/administracion/rh/expedientes/${expediente.id}`}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              <Eye
                                size={15}
                              />
                              Ver
                            </Link>

                            <Link
                              href={`/administracion/rh/expedientes/${expediente.id}/editar`}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Edit3
                                size={15}
                              />
                              Editar
                            </Link>

                            <a
                              href={`/administracion/rh/expedientes/${expediente.id}/pdf?download=1`}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <Download
                                size={15}
                              />
                              PDF
                            </a>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}