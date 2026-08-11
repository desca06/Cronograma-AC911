import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  Eye,
  Plus,
  Umbrella,
} from "lucide-react";
import {
  desc,
  eq,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  empleados,
  permisos,
  vacaciones,
} from "@/db/schema";
import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import {
  requerirAdmin,
} from "@/lib/auth";
import {
  DIAS_VACACIONES_ANUALES,
  esVacacionGeneradaPorPermiso,
} from "@/lib/vacaciones";

export const dynamic =
  "force-dynamic";
export const runtime = "nodejs";

type VacacionesPageProps = {
  searchParams: Promise<{
    creada?: string;
    eliminada?: string;
  }>;
};

type SaldoEmpleado = {
  total: number;
  vacacionesAprobadas: number;
  vacacionesPendientes: number;
  permisosAprobados: number;
  permisosPendientes: number;
  usadosConfirmados: number;
  reservados: number;
  comprometidos: number;
  disponibles: number;
  agotado: boolean;
};

function obtenerAnio(
  fecha: string,
) {
  return Number(
    fecha.slice(0, 4),
  );
}

function calcularSaldoEmpleado({
  empleadoId,
  anio,
  vacacionesEmpleado,
  permisosEmpleado,
}: {
  empleadoId: number;
  anio: number;
  vacacionesEmpleado: Array<{
    empleadoId: number;
    fechaInicio: string;
    cantidadDias: number;
    estado: string;
    observacion: string | null;
  }>;
  permisosEmpleado: Array<{
    empleadoId: number;
    fecha: string;
    diasSolicitados: number;
    estado: string;
  }>;
}): SaldoEmpleado {
  const vacacionesDelAnio =
    vacacionesEmpleado.filter(
      (item) =>
        item.empleadoId ===
          empleadoId &&
        obtenerAnio(
          item.fechaInicio,
        ) === anio &&
        !esVacacionGeneradaPorPermiso(
          item.observacion,
        ),
    );

  const vacacionesAprobadas =
    vacacionesDelAnio
      .filter(
        (item) =>
          item.estado ===
          "APROBADA",
      )
      .reduce(
        (total, item) =>
          total +
          Math.max(
            0,
            Number(
              item.cantidadDias,
            ),
          ),
        0,
      );

  const vacacionesPendientes =
    vacacionesDelAnio
      .filter(
        (item) =>
          item.estado ===
          "PENDIENTE",
      )
      .reduce(
        (total, item) =>
          total +
          Math.max(
            0,
            Number(
              item.cantidadDias,
            ),
          ),
        0,
      );

  /*
   * La primera vacación REAL aprobada determina
   * hasta qué fecha los permisos consumen vacaciones.
   */
  const fechasAprobadas =
    vacacionesDelAnio
      .filter(
        (item) =>
          item.estado ===
          "APROBADA",
      )
      .map(
        (item) =>
          item.fechaInicio,
      )
      .sort();

  const primeraVacacionAprobada =
    fechasAprobadas[0] ??
    null;

  const permisosDelAnio =
    permisosEmpleado.filter(
      (item) =>
        item.empleadoId ===
          empleadoId &&
        obtenerAnio(
          item.fecha,
        ) === anio &&
        (
          primeraVacacionAprobada ===
            null ||
          item.fecha <
            primeraVacacionAprobada
        ),
    );

  const permisosAprobados =
    permisosDelAnio
      .filter(
        (item) =>
          item.estado ===
          "APROBADO",
      )
      .reduce(
        (total, item) =>
          total +
          Math.max(
            1,
            Number(
              item.diasSolicitados ??
                1,
            ),
          ),
        0,
      );

  /*
   * Una solicitud pendiente también reserva saldo
   * para que el recuadro se actualice en cuanto
   * el trabajador la solicita.
   *
   * Si luego se rechaza, automáticamente deja
   * de aparecer aquí y el saldo regresa.
   */
  const permisosPendientes =
    permisosDelAnio
      .filter(
        (item) =>
          item.estado ===
          "PENDIENTE",
      )
      .reduce(
        (total, item) =>
          total +
          Math.max(
            1,
            Number(
              item.diasSolicitados ??
                1,
            ),
          ),
        0,
      );

  const usadosConfirmados =
    vacacionesAprobadas +
    permisosAprobados;

  const reservados =
    vacacionesPendientes +
    permisosPendientes;

  const comprometidos =
    usadosConfirmados +
    reservados;

  const disponibles =
    Math.max(
      0,
      DIAS_VACACIONES_ANUALES -
        comprometidos,
    );

  return {
    total:
      DIAS_VACACIONES_ANUALES,
    vacacionesAprobadas,
    vacacionesPendientes,
    permisosAprobados,
    permisosPendientes,
    usadosConfirmados,
    reservados,
    comprometidos,
    disponibles,
    agotado:
      disponibles <= 0,
  };
}

function estiloEstado(
  estado: string,
) {
  switch (estado) {
    case "APROBADA":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "RECHAZADA":
      return "border-red-200 bg-red-50 text-red-700";
    case "CANCELADA":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function textoEstado(
  estado: string,
) {
  switch (estado) {
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    case "CANCELADA":
      return "Cancelada";
    default:
      return "Pendiente";
  }
}

function formatearFecha(
  fecha: string,
) {
  const [
    anio,
    mes,
    dia,
  ] = fecha
    .split("-")
    .map(Number);

  if (
    !anio ||
    !mes ||
    !dia
  ) {
    return fecha;
  }

  return new Intl.DateTimeFormat(
    "es-GT",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(
      anio,
      mes - 1,
      dia,
    ),
  );
}

export default async function VacacionesPage({
  searchParams,
}: VacacionesPageProps) {
  await requerirAdmin();

  const parametros =
    await searchParams;

  const anioActual =
    new Date().getFullYear();

  const [
    listaEmpleados,
    listaVacaciones,
    listaPermisos,
    resumen,
  ] = await Promise.all([
    db
      .select({
        id:
          empleados.id,
        nombre:
          empleados.nombre,
        puesto:
          empleados.puesto,
      })
      .from(empleados)
      .where(
        eq(
          empleados.activo,
          true,
        ),
      ),

    db
      .select({
        id:
          vacaciones.id,
        empleadoId:
          vacaciones.empleadoId,
        empleado:
          empleados.nombre,
        puesto:
          empleados.puesto,
        fechaInicio:
          vacaciones.fechaInicio,
        fechaFin:
          vacaciones.fechaFin,
        cantidadDias:
          vacaciones.cantidadDias,
        estado:
          vacaciones.estado,
        observacion:
          vacaciones.observacion,
        creadoEn:
          vacaciones.creadoEn,
      })
      .from(vacaciones)
      .innerJoin(
        empleados,
        eq(
          vacaciones.empleadoId,
          empleados.id,
        ),
      )
      .orderBy(
        desc(
          vacaciones.creadoEn,
        ),
      ),

    db
      .select({
        empleadoId:
          permisos.empleadoId,
        fecha:
          permisos.fecha,
        diasSolicitados:
          permisos.diasSolicitados,
        estado:
          permisos.estado,
      })
      .from(permisos),

    db
      .select({
        total:
          sql<number>`count(*)`,
        pendientes:
          sql<number>`
            count(*) filter (
              where ${vacaciones.estado} = 'PENDIENTE'
            )
          `,
        aprobadas:
          sql<number>`
            count(*) filter (
              where ${vacaciones.estado} = 'APROBADA'
            )
          `,
        rechazadas:
          sql<number>`
            count(*) filter (
              where ${vacaciones.estado} = 'RECHAZADA'
            )
          `,
      })
      .from(vacaciones),
  ]);

  const saldoPorEmpleado =
    new Map<
      number,
      SaldoEmpleado
    >();

  for (
    const empleado
    of listaEmpleados
  ) {
    saldoPorEmpleado.set(
      empleado.id,
      calcularSaldoEmpleado({
        empleadoId:
          empleado.id,
        anio:
          anioActual,
        vacacionesEmpleado:
          listaVacaciones,
        permisosEmpleado:
          listaPermisos,
      }),
    );
  }

  const totales =
    resumen[0] ?? {
      total: 0,
      pendientes: 0,
      aprobadas: 0,
      rechazadas: 0,
    };

  return (
    <AppShell>
      <PageHeader
        title="Vacaciones"
        description="Saldo vivo de 15 días hábiles por trabajador."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <Link
              href="/administracion/rh"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft
                size={18}
              />
              Volver a Recursos Humanos
            </Link>
          </div>

          {parametros.creada ===
            "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              La solicitud fue registrada y el saldo reservado se actualizó.
            </div>
          )}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Solicitudes registradas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Las solicitudes pendientes reservan días; si son rechazadas, el saldo vuelve automáticamente.
              </p>
            </div>

            <Link
              href="/administracion/rh/vacaciones/nueva"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus
                size={18}
              />
              Nueva solicitud
            </Link>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TarjetaResumen
              titulo="Total"
              cantidad={
                Number(
                  totales.total,
                )
              }
              icono={
                CalendarDays
              }
              clases="bg-blue-50 text-blue-700"
            />

            <TarjetaResumen
              titulo="Pendientes"
              cantidad={
                Number(
                  totales.pendientes,
                )
              }
              icono={
                CalendarClock
              }
              clases="bg-amber-50 text-amber-700"
            />

            <TarjetaResumen
              titulo="Aprobadas"
              cantidad={
                Number(
                  totales.aprobadas,
                )
              }
              icono={
                CalendarCheck
              }
              clases="bg-emerald-50 text-emerald-700"
            />

            <TarjetaResumen
              titulo="Rechazadas"
              cantidad={
                Number(
                  totales.rechazadas,
                )
              }
              icono={
                CalendarX
              }
              clases="bg-red-50 text-red-700"
            />
          </div>

          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Saldo anual por empleado · {anioActual}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Cada trabajador inicia con 15 días. El saldo baja desde que existe una solicitud pendiente.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listaEmpleados.map(
                (empleado) => {
                  const saldo =
                    saldoPorEmpleado.get(
                      empleado.id,
                    )!;

                  return (
                    <div
                      key={
                        empleado.id
                      }
                      className={`rounded-xl border p-4 ${
                        saldo.agotado
                          ? "border-red-200 bg-red-50"
                          : saldo.disponibles <=
                              5
                            ? "border-amber-200 bg-amber-50"
                            : "border-emerald-200 bg-emerald-50"
                      }`}
                    >
                      <p className="font-bold text-slate-900">
                        {
                          empleado.nombre
                        }
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          empleado.puesto
                        }
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Disponibles
                          </p>

                          <p
                            className={`mt-1 text-3xl font-bold ${
                              saldo.agotado
                                ? "text-red-700"
                                : "text-slate-900"
                            }`}
                          >
                            {
                              saldo.disponibles
                            }
                          </p>
                        </div>

                        <div className="text-right text-xs leading-5 text-slate-600">
                          <p>
                            Confirmados:{" "}
                            {
                              saldo.usadosConfirmados
                            }
                          </p>

                          <p>
                            Reservados:{" "}
                            {
                              saldo.reservados
                            }
                          </p>

                          <p className="font-semibold">
                            Total: 15
                          </p>
                        </div>
                      </div>

                      {saldo.reservados >
                        0 && (
                        <p className="mt-3 text-xs font-semibold text-amber-700">
                          Hay {saldo.reservados} día(s) pendientes de resolución.
                        </p>
                      )}

                      {saldo.agotado && (
                        <p className="mt-3 text-sm font-bold text-red-700">
                          Vacaciones agotadas
                        </p>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </section>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {listaVacaciones.length ===
            0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <Umbrella
                  size={32}
                  className="text-blue-600"
                />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No hay vacaciones registradas
                </h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Empleado
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Inicio
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Fin
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Días hábiles
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Saldo vivo
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Estado
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {listaVacaciones.map(
                      (vacacion) => {
                        const saldo =
                          saldoPorEmpleado.get(
                            vacacion.empleadoId,
                          );

                        return (
                          <tr
                            key={
                              vacacion.id
                            }
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">
                                {
                                  vacacion.empleado
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                {
                                  vacacion.puesto
                                }
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm">
                              {formatearFecha(
                                vacacion.fechaInicio,
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm">
                              {formatearFecha(
                                vacacion.fechaFin,
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold">
                              {
                                vacacion.cantidadDias
                              }
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-900">
                              {saldo
                                ? `${saldo.disponibles} / 15`
                                : "—"}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${estiloEstado(
                                  vacacion.estado,
                                )}`}
                              >
                                {textoEstado(
                                  vacacion.estado,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/administracion/rh/vacaciones/${vacacion.id}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                <Eye
                                  size={15}
                                />
                                Ver detalle
                              </Link>
                            </td>
                          </tr>
                        );
                      },
                    )}
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

        <div
          className={`rounded-xl p-3 ${clases}`}
        >
          <Icono
            size={23}
          />
        </div>
      </div>
    </div>
  );
}
