import {
  and,
  asc,
  desc,
  eq,
  inArray,
} from "drizzle-orm";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  FileText,
  Plus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  empleados,
  trabajos,
  trabajoEmpleados,
  vehiculos,
} from "@/db/schema";
import {
  requerirSupervisor,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";
export const runtime =
  "nodejs";

const coloresEstado: Record<
  string,
  string
> = {
  Pendiente:
    "bg-amber-100 text-amber-800",
  "En camino":
    "bg-purple-100 text-purple-800",
  "En proceso":
    "bg-blue-100 text-blue-800",
  Finalizado:
    "bg-emerald-100 text-emerald-800",
  Cancelado:
    "bg-red-100 text-red-800",
};

const estadosDisponibles = [
  "Pendiente",
  "En camino",
  "En proceso",
  "Finalizado",
  "Cancelado",
];

type Props = {
  searchParams: Promise<{
    trabajoId?: string | string[];
    empleadoId?: string | string[];
    estado?: string | string[];
    fecha?: string | string[];
  }>;
};

function parametro(
  valor:
    | string
    | string[]
    | undefined,
) {
  return typeof valor ===
    "string"
    ? valor.trim()
    : "";
}

export default async function TrabajosAsignadosPage({
  searchParams,
}: Props) {
  await requerirSupervisor();

  const parametros =
    await searchParams;

  const trabajoIdFiltro =
    parametro(
      parametros.trabajoId,
    );

  const empleadoFiltro =
    parametro(
      parametros.empleadoId,
    );

  const estadoFiltro =
    parametro(
      parametros.estado,
    );

  const fechaFiltro =
    parametro(
      parametros.fecha,
    );

  const listaEmpleados =
    await db
      .select({
        id: empleados.id,
        nombre:
          empleados.nombre,
        puesto:
          empleados.puesto,
      })
      .from(empleados)
      .where(
        and(
          eq(
            empleados.activo,
            true,
          ),
          inArray(
            empleados.puesto,
            [
              "Técnico",
              "Supervisor",
            ],
          ),
        ),
      )
      .orderBy(
        asc(
          empleados.nombre,
        ),
      );

  const listaTrabajos =
    await db
      .select({
        id: trabajos.id,
        fecha: trabajos.fecha,
        tipo: trabajos.tipo,
        descripcion:
          trabajos.descripcion,
        direccion:
          trabajos.direccion,
        estado: trabajos.estado,
        horaInicio:
          trabajos.horaInicio,
        horaFin:
          trabajos.horaFin,
        observaciones:
          trabajos.observaciones,
        clienteNombre:
          clientes.nombre,
        vehiculoNombre:
          vehiculos.nombre,
      })
      .from(trabajos)
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
      .orderBy(
        desc(
          trabajos.fecha,
        ),
        desc(
          trabajos.id,
        ),
      );

  const asignaciones =
    await db
      .select({
        trabajoId:
          trabajoEmpleados.trabajoId,
        empleadoId:
          empleados.id,
        nombre:
          empleados.nombre,
        puesto:
          empleados.puesto,
      })
      .from(
        trabajoEmpleados,
      )
      .innerJoin(
        empleados,
        eq(
          trabajoEmpleados.empleadoId,
          empleados.id,
        ),
      );

  const asignacionesPorTrabajo =
    new Map<
      number,
      typeof asignaciones
    >();

  for (
    const asignacion
    of asignaciones
  ) {
    const actuales =
      asignacionesPorTrabajo.get(
        asignacion.trabajoId,
      ) ?? [];

    actuales.push(
      asignacion,
    );

    asignacionesPorTrabajo.set(
      asignacion.trabajoId,
      actuales,
    );
  }

  const filtrados =
    listaTrabajos.filter(
      (trabajo) => {
        const personal =
          asignacionesPorTrabajo.get(
            trabajo.id,
          ) ?? [];

        if (
          trabajoIdFiltro &&
          String(
            trabajo.id,
          ) !== trabajoIdFiltro
        ) {
          return false;
        }

        if (
          empleadoFiltro &&
          !personal.some(
            (persona) =>
              String(
                persona.empleadoId,
              ) ===
              empleadoFiltro,
          )
        ) {
          return false;
        }

        if (
          estadoFiltro &&
          trabajo.estado !==
            estadoFiltro
        ) {
          return false;
        }

        if (
          fechaFiltro &&
          trabajo.fecha !==
            fechaFiltro
        ) {
          return false;
        }

        return true;
      },
    );

  const totalAsignados =
    listaTrabajos.filter(
      (trabajo) =>
        (
          asignacionesPorTrabajo.get(
            trabajo.id,
          ) ?? []
        ).length > 0,
    ).length;

  const totalSinAsignar =
    listaTrabajos.length -
    totalAsignados;

  return (
    <AppShell>
      <PageHeader
        title="Trabajos asignados"
        description="Vista central de todos los trabajos y el personal responsable."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/trabajos"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft
              size={17}
            />
            Volver a trabajos
          </Link>

          <Link
            href="/trabajos/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Nuevo trabajo
          </Link>

          <Link
            href="/cronograma"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <CalendarDays
              size={17}
            />
            Ver cronograma
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <Resumen
            titulo="Trabajos"
            valor={
              listaTrabajos.length
            }
          />

          <Resumen
            titulo="Con personal"
            valor={
              totalAsignados
            }
          />

          <Resumen
            titulo="Sin asignar"
            valor={
              totalSinAsignar
            }
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UsersRound
              size={20}
              className="text-blue-600"
            />

            <h2 className="text-lg font-bold text-slate-900">
              Filtrar asignaciones
            </h2>
          </div>

          <form
            method="GET"
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <select
              name="empleadoId"
              defaultValue={
                empleadoFiltro
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">
                Todo el personal
              </option>

              {listaEmpleados.map(
                (empleado) => (
                  <option
                    key={
                      empleado.id
                    }
                    value={
                      empleado.id
                    }
                  >
                    {
                      empleado.nombre
                    }
                  </option>
                ),
              )}
            </select>

            <select
              name="estado"
              defaultValue={
                estadoFiltro
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
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

            <input
              type="date"
              name="fecha"
              defaultValue={
                fechaFiltro
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Filtrar
              </button>

              <Link
                href="/trabajos-asignados"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        {filtrados.length ===
        0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              No se encontraron trabajos
            </h2>

            <p className="mt-2 text-slate-500">
              Cambia los filtros o crea una nueva asignación.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtrados.map(
              (trabajo) => {
                const personal =
                  asignacionesPorTrabajo.get(
                    trabajo.id,
                  ) ?? [];

                const destacado =
                  trabajoIdFiltro ===
                  String(
                    trabajo.id,
                  );

                return (
                  <article
                    id={`trabajo-${trabajo.id}`}
                    key={
                      trabajo.id
                    }
                    className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm transition ${
                      destacado
                        ? "border-blue-500 ring-4 ring-blue-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-bold text-blue-700">
                            Trabajo #
                            {
                              trabajo.id
                            }
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              coloresEstado[
                                trabajo.estado
                              ] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {
                              trabajo.estado
                            }
                          </span>
                        </div>

                        <h2 className="mt-2 text-xl font-bold text-slate-900">
                          {
                            trabajo.clienteNombre
                          }
                        </h2>

                        <p className="mt-1 font-semibold text-blue-700">
                          {
                            trabajo.tipo
                          }
                        </p>

                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {
                            trabajo.descripcion
                          }
                        </p>

                        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <p>
                            <strong>
                              Fecha:
                            </strong>{" "}
                            {
                              trabajo.fecha
                            }
                          </p>

                          <p>
                            <strong>
                              Hora:
                            </strong>{" "}
                            {trabajo.horaInicio ||
                              "Sin definir"}
                          </p>

                          <p>
                            <strong>
                              Vehículo:
                            </strong>{" "}
                            {trabajo.vehiculoNombre ||
                              "Sin asignar"}
                          </p>

                          <p>
                            <strong>
                              Dirección:
                            </strong>{" "}
                            {trabajo.direccion ||
                              "Sin dirección"}
                          </p>
                        </div>

                        <div className="mt-5">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Personal asignado
                          </p>

                          {personal.length ===
                          0 ? (
                            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                              Este trabajo todavía no tiene personal asignado.
                            </p>
                          ) : (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {personal.map(
                                (
                                  persona,
                                ) => (
                                  <span
                                    key={`${trabajo.id}-${persona.empleadoId}`}
                                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                  >
                                    {
                                      persona.nombre
                                    }{" "}
                                    ·{" "}
                                    {
                                      persona.puesto
                                    }
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/trabajos/${trabajo.id}/editar`}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          <Eye
                            size={16}
                          />
                          Abrir
                        </Link>

                        <Link
                          href={`/trabajos/${trabajo.id}/pdf`}
                          target="_blank"
                          className="inline-flex items-center gap-2 rounded-lg bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200"
                        >
                          <FileText
                            size={16}
                          />
                          PDF
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Resumen({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {valor}
      </p>
    </article>
  );
}