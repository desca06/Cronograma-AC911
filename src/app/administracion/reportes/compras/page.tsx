import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  FilterX,
  PackageSearch,
  Search,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import {
  esEstadoOrdenCompra,
  formatearDineroReporte,
  formatearFechaReporte,
  formatearHoraGuatemala,
  obtenerReporteCompras,
} from "@/lib/reportes-compras";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    desde?: string;
    hasta?: string;
    proveedorId?: string;
    estado?: string;
  }>;
};

function claseEstado(
  estado: string,
) {
  switch (estado) {
    case "PENDIENTE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "APROBADA":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "COMPLETADA":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "CANCELADA":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function nombreEstado(
  estado: string,
) {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "APROBADA":
      return "Aprobada";
    case "COMPLETADA":
      return "Completada";
    case "CANCELADA":
      return "Cancelada";
    default:
      return estado;
  }
}

function colorEstado(
  estado: string,
) {
  switch (estado) {
    case "PENDIENTE":
      return "bg-amber-500";
    case "APROBADA":
      return "bg-emerald-500";
    case "COMPLETADA":
      return "bg-violet-500";
    case "CANCELADA":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
}


type ColorGrafica =
  | "blue"
  | "purple"
  | "emerald"
  | "orange";

type PuntoGrafica = {
  etiqueta: string;
  valor: number;
  textoValor: string;
};

function colorGrafica(
  color: ColorGrafica,
) {
  switch (color) {
    case "blue":
      return "#2563eb";
    case "purple":
      return "#9333ea";
    case "emerald":
      return "#059669";
    case "orange":
      return "#ea580c";
  }
}

function abreviarNumero(
  valor: number,
) {
  if (valor >= 1_000_000) {
    const numero =
      valor / 1_000_000;

    return `${Number(
      numero.toFixed(
        numero >= 10 ? 0 : 1,
      ),
    )}M`;
  }

  if (valor >= 1_000) {
    const numero =
      valor / 1_000;

    return `${Number(
      numero.toFixed(
        numero >= 10 ? 0 : 1,
      ),
    )}K`;
  }

  return String(
    Number(
      valor.toFixed(
        valor < 10 ? 1 : 0,
      ),
    ),
  );
}

function LineChart({
  datos,
  color,
  leyenda,
  unidad = "",
}: {
  datos: PuntoGrafica[];
  color: ColorGrafica;
  leyenda: string;
  unidad?: string;
}) {
  if (datos.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm text-slate-500">
        No hay datos para graficar.
      </div>
    );
  }

  const width = 760;
  const height = 390;

  const marginLeft = 72;
  const marginRight = 32;
  const marginTop = 78;
  const marginBottom = 86;

  const chartWidth =
    width -
    marginLeft -
    marginRight;

  const chartHeight =
    height -
    marginTop -
    marginBottom;

  const maxValue = Math.max(
    ...datos.map(
      (item) => item.valor,
    ),
    1,
  );

  const topValue =
    maxValue <= 5
      ? Math.ceil(
          maxValue + 1,
        )
      : maxValue * 1.08;

  const xForIndex = (
    index: number,
  ) => {
    if (datos.length === 1) {
      return (
        marginLeft +
        chartWidth / 2
      );
    }

    return (
      marginLeft +
      (index *
        chartWidth) /
        (datos.length - 1)
    );
  };

  const yForValue = (
    value: number,
  ) =>
    marginTop +
    chartHeight -
    (value / topValue) *
      chartHeight;

  const puntos = datos.map(
    (item, index) => ({
      ...item,
      x: xForIndex(index),
      y: yForValue(
        item.valor,
      ),
    }),
  );

  const path = puntos
    .map(
      (punto, index) =>
        `${
          index === 0
            ? "M"
            : "L"
        } ${punto.x.toFixed(
          2,
        )} ${punto.y.toFixed(
          2,
        )}`,
    )
    .join(" ");

  const colorLinea =
    colorGrafica(color);

  const ticks = 5;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={leyenda}
      >
        <g
          transform={`translate(${
            width / 2 - 95
          }, 26)`}
        >
          <line
            x1="0"
            y1="0"
            x2="50"
            y2="0"
            stroke={colorLinea}
            strokeWidth="6"
            strokeLinecap="square"
          />

          <text
            x="62"
            y="5"
            fontSize="14"
            fill="#64748b"
          >
            {leyenda}
          </text>
        </g>

        <line
          x1={marginLeft}
          y1={marginTop}
          x2={marginLeft}
          y2={
            marginTop +
            chartHeight
          }
          stroke="#64748b"
          strokeWidth="1.5"
        />

        <line
          x1={marginLeft}
          y1={
            marginTop +
            chartHeight
          }
          x2={
            width -
            marginRight
          }
          y2={
            marginTop +
            chartHeight
          }
          stroke="#64748b"
          strokeWidth="1.5"
        />

        {Array.from({
          length:
            ticks + 1,
        }).map(
          (_, index) => {
            const ratio =
              index / ticks;

            const y =
              marginTop +
              chartHeight -
              ratio *
                chartHeight;

            const valor =
              topValue *
              ratio;

            return (
              <g
                key={`tick-${index}`}
              >
                <line
                  x1={
                    marginLeft -
                    6
                  }
                  y1={y}
                  x2={
                    marginLeft
                  }
                  y2={y}
                  stroke="#64748b"
                  strokeWidth="1"
                />

                <text
                  x={
                    marginLeft -
                    12
                  }
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#64748b"
                >
                  {unidad}
                  {abreviarNumero(
                    valor,
                  )}
                </text>
              </g>
            );
          },
        )}

        {puntos.length > 1 && (
          <path
            d={path}
            fill="none"
            stroke={
              colorLinea
            }
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {puntos.map(
          (
            punto,
            index,
          ) => (
            <g
              key={`${punto.etiqueta}-${index}`}
            >
              <circle
                cx={punto.x}
                cy={punto.y}
                r="5.5"
                fill={
                  colorLinea
                }
              />

              <text
                transform={`translate(${punto.x}, ${
                  marginTop +
                  chartHeight +
                  23
                }) rotate(-42)`}
                textAnchor="end"
                fontSize="12"
                fill="#64748b"
              >
                {punto.etiqueta.length >
                20
                  ? `${punto.etiqueta.slice(
                      0,
                      19,
                    )}…`
                  : punto.etiqueta}
              </text>
            </g>
          ),
        )}
      </svg>
    </div>
  );
}

export default async function ReportesPage({
  searchParams,
}: Props) {
  await requerirAdmin();

  const parametros =
    await searchParams;

  const proveedorId =
    Number(
      parametros.proveedorId ?? "",
    );

  const estado =
    esEstadoOrdenCompra(
      parametros.estado,
    )
      ? parametros.estado
      : undefined;

  const reporte =
    await obtenerReporteCompras({
      desde:
        parametros.desde?.trim() ||
        undefined,
      hasta:
        parametros.hasta?.trim() ||
        undefined,
      proveedorId:
        Number.isInteger(
          proveedorId,
        ) &&
        proveedorId > 0
          ? proveedorId
          : undefined,
      estado,
    });

  const paramsPdf =
    new URLSearchParams();

  if (reporte.filtros.desde) {
    paramsPdf.set(
      "desde",
      reporte.filtros.desde,
    );
  }

  if (reporte.filtros.hasta) {
    paramsPdf.set(
      "hasta",
      reporte.filtros.hasta,
    );
  }

  if (
    reporte.filtros.proveedorId
  ) {
    paramsPdf.set(
      "proveedorId",
      String(
        reporte.filtros
          .proveedorId,
      ),
    );
  }

  if (reporte.filtros.estado) {
    paramsPdf.set(
      "estado",
      reporte.filtros.estado,
    );
  }

  const queryPdf =
    paramsPdf.toString();

  const rutaPdf =
    `/administracion/reportes/compras/pdf${
      queryPdf
        ? `?${queryPdf}`
        : ""
    }`;

  const rutaDescarga =
    `${rutaPdf}${
      queryPdf ? "&" : "?"
    }download=1`;

  const tarjetas = [
    {
      titulo:
        "Gasto real",
      valor:
        formatearDineroReporte(
          reporte.resumen.gastoReal,
        ),
      detalle:
        "Solo órdenes completadas",
      icono:
        CircleDollarSign,
      clases:
        "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      titulo:
        "Órdenes",
      valor: String(
        reporte.resumen.totalOrdenes,
      ),
      detalle:
        "Dentro del período filtrado",
      icono:
        ClipboardList,
      clases:
        "border-slate-200 bg-white text-slate-700",
    },
    {
      titulo:
        "Completadas",
      valor: String(
        reporte.resumen.completadas,
      ),
      detalle:
        "Compras ya finalizadas",
      icono:
        CheckCircle2,
      clases:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      titulo:
        "Promedio por compra",
      valor:
        formatearDineroReporte(
          reporte.resumen
            .promedioCompra,
        ),
      detalle:
        "Promedio de completadas",
      icono:
        TrendingUp,
      clases:
        "border-violet-200 bg-violet-50 text-violet-700",
    },
    {
      titulo:
        "Pendientes",
      valor: String(
        reporte.resumen.pendientes,
      ),
      detalle:
        "Esperando aprobación",
      icono:
        Clock3,
      clases:
        "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      titulo:
        "Canceladas",
      valor: String(
        reporte.resumen.canceladas,
      ),
      detalle:
        "No suman al gasto real",
      icono:
        XCircle,
      clases:
        "border-red-200 bg-red-50 text-red-700",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Reporte de Órdenes de Compra"
        description="Indicadores, análisis, gráficas y PDF de compras de AC911."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <Link
            href="/administracion/reportes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-purple-700"
          >
            <ArrowLeft
              size={18}
            />
            Volver a Reportes
          </Link>

          <div className="flex flex-wrap gap-3">
            <a
              href={rutaPdf}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              <FileText
                size={17}
              />
              Ver reporte PDF
            </a>

            <a
              href={rutaDescarga}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Download
                size={17}
              />
              Descargar PDF
            </a>
          </div>
        </div>

        <article className="overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm">
          <div className="border-b border-purple-100 bg-purple-50/70 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <BarChart3
                  size={23}
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Reporte de compras
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Analiza gastos reales, proveedores, estados, artículos y órdenes por período.
                </p>
              </div>
            </div>
          </div>

          <form
            method="GET"
            className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4"
          >
            <div>
              <label
                htmlFor="desde"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Desde
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="desde"
                  name="desde"
                  type="date"
                  defaultValue={
                    reporte.filtros
                      .desde ?? ""
                  }
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="hasta"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Hasta
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="hasta"
                  name="hasta"
                  type="date"
                  defaultValue={
                    reporte.filtros
                      .hasta ?? ""
                  }
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="proveedorId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Proveedor
              </label>

              <select
                id="proveedorId"
                name="proveedorId"
                defaultValue={
                  reporte.filtros
                    .proveedorId
                    ? String(
                        reporte.filtros
                          .proveedorId,
                      )
                    : ""
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              >
                <option value="">
                  Todos los proveedores
                </option>

                {reporte.proveedoresDisponibles.map(
                  (proveedor) => (
                    <option
                      key={
                        proveedor.id
                      }
                      value={
                        proveedor.id
                      }
                    >
                      {proveedor.nombre}
                    </option>
                  ),
                )}
              </select>
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
                defaultValue={
                  reporte.filtros
                    .estado ?? ""
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              >
                <option value="">
                  Todos los estados
                </option>
                <option value="PENDIENTE">
                  Pendiente
                </option>
                <option value="APROBADA">
                  Aprobada
                </option>
                <option value="COMPLETADA">
                  Completada
                </option>
                <option value="CANCELADA">
                  Cancelada
                </option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Search
                  size={17}
                />
                Generar reporte
              </button>

              <Link
                href="/administracion/reportes/compras"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
            (tarjeta) => {
              const Icono =
                tarjeta.icono;

              return (
                <article
                  key={
                    tarjeta.titulo
                  }
                  className={`rounded-2xl border p-5 shadow-sm ${tarjeta.clases}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold opacity-80">
                        {tarjeta.titulo}
                      </p>

                      <p className="mt-2 text-2xl font-bold">
                        {tarjeta.valor}
                      </p>

                      <p className="mt-2 text-xs font-medium opacity-70">
                        {tarjeta.detalle}
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

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Proveedor principal
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Mayor gasto en órdenes completadas.
                </p>
              </div>

              <Building2
                size={22}
                className="text-purple-600"
              />
            </div>

            <p className="mt-5 text-xl font-bold text-slate-900">
              {
                reporte.resumen
                  .proveedorPrincipal
              }
            </p>

            <p className="mt-1 font-semibold text-purple-700">
              {formatearDineroReporte(
                reporte.resumen
                  .gastoProveedorPrincipal,
              )}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Compra de mayor valor
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Orden completada más alta del período.
                </p>
              </div>

              <ShoppingCart
                size={22}
                className="text-orange-600"
              />
            </div>

            <p className="mt-5 text-xl font-bold text-slate-900">
              {
                reporte.resumen
                  .codigoCompraMayor
              }
            </p>

            <p className="mt-1 font-semibold text-orange-700">
              {formatearDineroReporte(
                reporte.resumen
                  .compraMayor,
              )}
            </p>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-900">
                Compras completadas por mes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tendencia mensual del gasto real en órdenes completadas.
              </p>
            </div>

            <LineChart
              color="blue"
              leyenda="Gasto por mes"
              unidad="Q "
              datos={reporte.porMes.map(
                (item) => ({
                  etiqueta:
                    item.etiqueta,
                  valor:
                    item.total /
                    100,
                  textoValor:
                    formatearDineroReporte(
                      item.total,
                    ),
                }),
              )}
            />
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-900">
                Proveedores con mayor gasto
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Comparación visual de los proveedores con mayor valor comprado.
              </p>
            </div>

            <LineChart
              color="purple"
              leyenda="Gasto por proveedor"
              unidad="Q "
              datos={reporte.porProveedor.map(
                (item) => ({
                  etiqueta:
                    item.proveedor,
                  valor:
                    item.total /
                    100,
                  textoValor:
                    formatearDineroReporte(
                      item.total,
                    ),
                }),
              )}
            />
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-900">
                Órdenes por estado
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Distribución de las órdenes incluidas dentro del reporte actual.
              </p>
            </div>

            <LineChart
              color="emerald"
              leyenda="Cantidad de órdenes"
              datos={reporte.porEstado.map(
                (item) => ({
                  etiqueta:
                    item.etiqueta,
                  valor:
                    item.cantidad,
                  textoValor: `${item.cantidad} (${item.porcentaje}%)`,
                }),
              )}
            />
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-900">
                Artículos más comprados
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tendencia de cantidades adquiridas en las compras completadas.
              </p>
            </div>

            <LineChart
              color="orange"
              leyenda="Unidades compradas"
              datos={reporte.articulosMasComprados.map(
                (item) => ({
                  etiqueta:
                    item.descripcion,
                  valor:
                    item.cantidad,
                  textoValor: `${item.cantidad} uds.`,
                }),
              )}
            />
          </article>
        </div>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ShoppingCart
                size={20}
              />
              Detalle de órdenes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Las canceladas se muestran para control, pero no se suman al gasto real.
            </p>
          </div>

          {reporte.ordenes.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <ShoppingCart
                size={44}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-bold text-slate-900">
                No hay órdenes para estos filtros
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Cambiá el período o los filtros para consultar más información.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Hora
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Orden
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Proveedor
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Motivo
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Total
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reporte.ordenes.map(
                    (orden) => (
                      <tr
                        key={
                          orden.id
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatearFechaReporte(
                            orden.fechaCompra,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                          {formatearHoraGuatemala(
                            orden.creadoEn,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <Link
                            href={`/administracion/compras/ordenes/${orden.id}`}
                            className="font-bold text-orange-700 transition hover:underline"
                          >
                            {
                              orden.codigo
                            }
                          </Link>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {
                            orden.proveedor
                          }
                        </td>

                        <td className="max-w-[320px] px-5 py-4 text-sm text-slate-600">
                          {
                            orden.motivo
                          }
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${claseEstado(
                              orden.estado,
                            )}`}
                          >
                            {nombreEstado(
                              orden.estado,
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                          {formatearDineroReporte(
                            orden.total,
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/administracion/compras/ordenes/${orden.id}`}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Ver orden
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