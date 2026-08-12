import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FilterX,
  RefreshCcw,
  Search,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import {
  formatearFechaTrabajo,
  obtenerReporteTrabajos,
} from "@/lib/reportes-trabajos";
import {
  requerirAdmin,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";

type Props = {
  searchParams: Promise<{
    desde?: string;
    hasta?: string;
    estado?: string;
    empleadoId?: string;
    clienteId?: string;
  }>;
};

type Punto = {
  etiqueta: string;
  valor: number;
};

function LineChart({
  datos,
}: {
  datos: Punto[];
}) {
  if (
    datos.length ===
    0
  ) {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">
        No hay datos para graficar.
      </div>
    );
  }

  const width = 760;
  const height = 330;
  const left = 55;
  const right = 25;
  const top = 30;
  const bottom = 75;

  const chartWidth =
    width -
    left -
    right;

  const chartHeight =
    height -
    top -
    bottom;

  const maxValue =
    Math.max(
      ...datos.map(
        (item) =>
          item.valor,
      ),
      1,
    );

  const x = (
    index: number,
  ) =>
    datos.length === 1
      ? left +
        chartWidth / 2
      : left +
        (index *
          chartWidth) /
          (datos.length -
            1);

  const y = (
    value: number,
  ) =>
    top +
    chartHeight -
    (value /
      maxValue) *
      chartHeight;

  const path =
    datos
      .map(
        (
          item,
          index,
        ) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${x(
            index,
          )} ${y(
            item.valor,
          )}`,
      )
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
    >
      <line
        x1={left}
        y1={top}
        x2={left}
        y2={
          top +
          chartHeight
        }
        stroke="#94a3b8"
      />

      <line
        x1={left}
        y1={
          top +
          chartHeight
        }
        x2={
          width -
          right
        }
        y2={
          top +
          chartHeight
        }
        stroke="#94a3b8"
      />

      {datos.length >
        1 && (
        <path
          d={path}
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {datos.map(
        (
          item,
          index,
        ) => (
          <g
            key={`${item.etiqueta}-${index}`}
          >
            <circle
              cx={
                x(index)
              }
              cy={
                y(
                  item.valor,
                )
              }
              r="5"
              fill="#2563eb"
              className="ac911-punto-animado"
              style={{
                animationDelay:
                  `${180 + index * 110}ms`,
              }}
            />

            <text
              x={
                x(index)
              }
              y={
                top +
                chartHeight +
                25
              }
              textAnchor="middle"
              fontSize="12"
              fill="#64748b"
            >
              {item.etiqueta.length >
              16
                ? `${item.etiqueta.slice(
                    0,
                    15,
                  )}…`
                : item.etiqueta}
            </text>

            <text
              x={
                x(index)
              }
              y={
                y(
                  item.valor,
                ) -
                10
              }
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#0f172a"
            >
              {
                item.valor
              }
            </text>
          </g>
        ),
      )}
    </svg>
  );
}

function claseEstado(
  estado: string,
) {
  const valor =
    estado
      .toLowerCase();

  if (
    valor ===
    "finalizado"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    valor ===
    "pendiente"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    valor.includes(
      "reprogram",
    )
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (
    valor ===
      "en proceso" ||
    valor ===
      "en camino"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    valor ===
    "cancelado"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function ReporteTrabajosPage({
  searchParams,
}: Props) {
  await requerirAdmin();

  const parametros =
    await searchParams;

  const empleadoId =
    Number(
      parametros.empleadoId ??
        "",
    );

  const clienteId =
    Number(
      parametros.clienteId ??
        "",
    );

  const reporte =
    await obtenerReporteTrabajos({
      desde:
        parametros.desde
          ?.trim() ||
        undefined,
      hasta:
        parametros.hasta
          ?.trim() ||
        undefined,
      estado:
        parametros.estado
          ?.trim() ||
        undefined,
      empleadoId:
        Number.isInteger(
          empleadoId,
        ) &&
        empleadoId > 0
          ? empleadoId
          : undefined,
      clienteId:
        Number.isInteger(
          clienteId,
        ) &&
        clienteId > 0
          ? clienteId
          : undefined,
    });

  const params =
    new URLSearchParams();

  if (
    reporte.filtros.desde
  ) {
    params.set(
      "desde",
      reporte.filtros.desde,
    );
  }

  if (
    reporte.filtros.hasta
  ) {
    params.set(
      "hasta",
      reporte.filtros.hasta,
    );
  }

  if (
    reporte.filtros.estado
  ) {
    params.set(
      "estado",
      reporte.filtros.estado,
    );
  }

  if (
    reporte.filtros.empleadoId
  ) {
    params.set(
      "empleadoId",
      String(
        reporte.filtros.empleadoId,
      ),
    );
  }

  if (
    reporte.filtros.clienteId
  ) {
    params.set(
      "clienteId",
      String(
        reporte.filtros.clienteId,
      ),
    );
  }

  const query =
    params.toString();

  const rutaPdf =
    `/administracion/reportes/trabajos/pdf${
      query
        ? `?${query}`
        : ""
    }`;

  const rutaDescarga =
    `${rutaPdf}${
      query
        ? "&"
        : "?"
    }download=1`;

  const tarjetas = [
    {
      titulo:
        "Trabajos del mes",
      valor:
        reporte.resumen.total,
      detalle:
        "Dentro del período seleccionado",
      icono:
        BriefcaseBusiness,
      clase:
        "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      titulo:
        "Finalizados",
      valor:
        reporte.resumen.finalizados,
      detalle:
        `${reporte.resumen.porcentajeFinalizados}% de cumplimiento`,
      icono:
        CheckCircle2,
      clase:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      titulo:
        "Pendientes",
      valor:
        reporte.resumen.pendientes,
      detalle:
        "Aún no iniciados",
      icono:
        Clock3,
      clase:
        "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      titulo:
        "En proceso",
      valor:
        reporte.resumen.enProceso,
      detalle:
        "En camino o ejecución",
      icono:
        RefreshCcw,
      clase:
        "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    {
      titulo:
        "Reprogramados",
      valor:
        reporte.resumen.reprogramados,
      detalle:
        "Detectados por estado Reprogramado",
      icono:
        CalendarDays,
      clase:
        "border-violet-200 bg-violet-50 text-violet-700",
    },
    {
      titulo:
        "Cancelados",
      valor:
        reporte.resumen.cancelados,
      detalle:
        "Trabajos cancelados",
      icono:
        XCircle,
      clase:
        "border-red-200 bg-red-50 text-red-700",
    },
  ];

  return (
    <AppShell>
      <style>{`
        @keyframes ac911-dibujar-linea {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes ac911-aparecer-punto {
          from {
            opacity: 0;
            transform: scale(0.35);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .ac911-linea-animada {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: ac911-dibujar-linea 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .ac911-punto-animado {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: ac911-aparecer-punto 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transition: transform 180ms ease;
        }

        .ac911-punto-animado:hover {
          transform: scale(1.45);
        }

        @media (prefers-reduced-motion: reduce) {
          .ac911-linea-animada,
          .ac911-punto-animado {
            animation: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>

      <PageHeader
        title="Reporte de Trabajos"
        description="Indicadores mensuales, productividad, estados, clientes, personal y PDF."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <Link
            href="/administracion/reportes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft
              size={18}
            />
            Volver a Reportes
          </Link>

          <div className="flex flex-wrap gap-3">
            <a
              href={
                rutaPdf
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              <FileText
                size={17}
              />
              Ver reporte PDF
            </a>

            <a
              href={
                rutaDescarga
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download
                size={17}
              />
              Descargar PDF
            </a>
          </div>
        </div>

        <article className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
          <div className="border-b border-blue-100 bg-blue-50/70 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <BarChart3
                  size={23}
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Reporte mensual de trabajos
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Si no seleccionas fechas, se consulta automáticamente el mes actual.
                </p>
              </div>
            </div>
          </div>

          <form
            method="GET"
            className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5"
          >
            <input
              name="desde"
              type="date"
              defaultValue={
                reporte.filtros.desde ??
                ""
              }
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="hasta"
              type="date"
              defaultValue={
                reporte.filtros.hasta ??
                ""
              }
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <select
              name="estado"
              defaultValue={
                reporte.filtros.estado ??
                ""
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">
                Todos los estados
              </option>
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
              <option value="Reprogramado">
                Reprogramado
              </option>
              <option value="Cancelado">
                Cancelado
              </option>
            </select>

            <select
              name="empleadoId"
              defaultValue={
                reporte.filtros.empleadoId
                  ? String(
                      reporte.filtros.empleadoId,
                    )
                  : ""
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">
                Todo el personal
              </option>

              {reporte.empleadosDisponibles.map(
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
              name="clienteId"
              defaultValue={
                reporte.filtros.clienteId
                  ? String(
                      reporte.filtros.clienteId,
                    )
                  : ""
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">
                Todos los clientes
              </option>

              {reporte.clientesDisponibles.map(
                (cliente) => (
                  <option
                    key={
                      cliente.id
                    }
                    value={
                      cliente.id
                    }
                  >
                    {
                      cliente.nombre
                    }
                  </option>
                ),
              )}
            </select>

            <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-5">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Search
                  size={17}
                />
                Generar reporte
              </button>

              <Link
                href="/administracion/reportes/trabajos"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FilterX
                  size={17}
                />
                Limpiar filtros
              </Link>
            </div>
          </form>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tarjetas.map(
            (item) => {
              const Icono =
                item.icono;

              return (
                <article
                  key={
                    item.titulo
                  }
                  className={`rounded-2xl border p-5 shadow-sm ${item.clase}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold opacity-80">
                        {
                          item.titulo
                        }
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {
                          item.valor
                        }
                      </p>

                      <p className="mt-2 text-xs font-medium opacity-70">
                        {
                          item.detalle
                        }
                      </p>
                    </div>

                    <Icono
                      size={22}
                    />
                  </div>
                </article>
              );
            },
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Insight
            titulo="Personal con más trabajos"
            valor={
              reporte.resumen.tecnicoPrincipal
            }
            detalle={`${reporte.resumen.trabajosTecnicoPrincipal} trabajo(s)`}
            icono={
              UsersRound
            }
          />

          <Insight
            titulo="Cliente principal"
            valor={
              reporte.resumen.clientePrincipal
            }
            detalle={`${reporte.resumen.trabajosClientePrincipal} trabajo(s)`}
            icono={
              UserRound
            }
          />

          <Insight
            titulo="Tipo más frecuente"
            valor={
              reporte.resumen.tipoPrincipal
            }
            detalle={`${reporte.resumen.trabajosTipoPrincipal} trabajo(s)`}
            icono={
              BriefcaseBusiness
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Grafica
            titulo="Trabajos por semana"
            descripcion="Distribución de trabajos dentro del período."
            datos={
              reporte.porSemana.map(
                (item) => ({
                  etiqueta:
                    item.etiqueta,
                  valor:
                    item.cantidad,
                }),
              )
            }
          />

          <Grafica
            titulo="Trabajos por estado"
            descripcion="Distribución actual por estado."
            datos={
              reporte.porEstado.map(
                (item) => ({
                  etiqueta:
                    item.etiqueta,
                  valor:
                    item.cantidad,
                }),
              )
            }
          />

          <Grafica
            titulo="Trabajos por personal"
            descripcion="Cantidad de asignaciones por trabajador."
            datos={
              reporte.porTecnico.map(
                (item) => ({
                  etiqueta:
                    item.empleado,
                  valor:
                    item.cantidad,
                }),
              )
            }
          />

          <Grafica
            titulo="Trabajos por cliente"
            descripcion="Clientes con mayor actividad."
            datos={
              reporte.porCliente.map(
                (item) => ({
                  etiqueta:
                    item.cliente,
                  valor:
                    item.cantidad,
                }),
              )
            }
          />
        </div>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Detalle de trabajos
            </h2>
          </div>

          {reporte.trabajos.length ===
          0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              No hay trabajos dentro del período seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Fecha
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Cliente
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Tipo
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Descripción
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reporte.trabajos.map(
                    (trabajo) => (
                      <tr
                        key={
                          trabajo.id
                        }
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatearFechaTrabajo(
                            trabajo.fecha,
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {
                            trabajo.cliente
                          }
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {
                            trabajo.tipo
                          }
                        </td>

                        <td className="max-w-[360px] px-5 py-4 text-sm text-slate-600">
                          {
                            trabajo.descripcion
                          }
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${claseEstado(
                              trabajo.estado,
                            )}`}
                          >
                            {
                              trabajo.estado
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/trabajos-asignados?trabajoId=${trabajo.id}#trabajo-${trabajo.id}`}
                            className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Ver trabajo
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </AppShell>
  );
}

function Insight({
  titulo,
  valor,
  detalle,
  icono: Icono,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: React.ElementType;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {titulo}
          </p>

          <p className="mt-3 text-xl font-bold text-slate-900">
            {valor}
          </p>

          <p className="mt-1 text-sm text-blue-700">
            {detalle}
          </p>
        </div>

        <Icono
          size={22}
          className="text-blue-600"
        />
      </div>
    </article>
  );
}

function Grafica({
  titulo,
  descripcion,
  datos,
}: {
  titulo: string;
  descripcion: string;
  datos: Punto[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-900">
          {titulo}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {descripcion}
        </p>
      </div>

      <LineChart
        datos={datos}
      />
    </article>
  );
}