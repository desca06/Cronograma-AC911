import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Package,
  ReceiptText,
  Trash2,
  UserRound,
  XCircle,
  BriefcaseBusiness,
} from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  cotizaciones,
  cotizacionItems,
  trabajos,
} from "@/db/schema";
import {
  cotizacionTrabajos,
} from "@/db/schema-cotizacion-trabajo";
import { requerirAdmin } from "@/lib/auth";

import {
  cambiarEstadoCotizacion,
  eliminarCotizacion,
} from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    creada?: string;
    estado?: string;
    error?: string;
    trabajo?: string;
  }>;
};

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
    dateStyle: "long",
  }).format(fecha);
}

function obtenerEstiloEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return {
        texto: "Pendiente",
        clases:
          "border-amber-200 bg-amber-50 text-amber-700",
        icono: Clock3,
      };

    case "APROBADA":
      return {
        texto: "Aprobada",
        clases:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        icono: CheckCircle2,
      };

    case "RECHAZADA":
      return {
        texto: "Rechazada",
        clases:
          "border-red-200 bg-red-50 text-red-700",
        icono: XCircle,
      };

    case "VENCIDA":
      return {
        texto: "Vencida",
        clases:
          "border-slate-200 bg-slate-100 text-slate-600",
        icono: Clock3,
      };

    default:
      return {
        texto: estado,
        clases:
          "border-slate-200 bg-slate-50 text-slate-600",
        icono: FileText,
      };
  }
}

function obtenerNombreTipo(tipo: string) {
  if (tipo === "PRODUCTO") {
    return "Producto";
  }

  if (tipo === "SERVICIO") {
    return "Servicio";
  }

  return "Costo adicional";
}

function obtenerEstiloTipo(tipo: string) {
  if (tipo === "PRODUCTO") {
    return "bg-blue-100 text-blue-700";
  }

  if (tipo === "SERVICIO") {
    return "bg-purple-100 text-purple-700";
  }

  return "bg-orange-100 text-orange-700";
}

export default async function DetalleCotizacionPage({
  params,
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;

  const cotizacionId = Number(id);

  if (
    !Number.isInteger(cotizacionId) ||
    cotizacionId <= 0
  ) {
    notFound();
  }

  const [cotizacion] = await db
    .select({
      id: cotizaciones.id,
      codigo: cotizaciones.codigo,
      clienteId: cotizaciones.clienteId,
      clienteNombre: clientes.nombre,
      colaborador: cotizaciones.colaborador,
      titulo: cotizaciones.titulo,
      fechaSolicitud: cotizaciones.fechaSolicitud,
      validaHasta: cotizaciones.validaHasta,
      diasVigencia: cotizaciones.diasVigencia,
      estado: cotizaciones.estado,
      observaciones: cotizaciones.observaciones,
      condicionesPago: cotizaciones.condicionesPago,
      porcentajeAnticipo:
        cotizaciones.porcentajeAnticipo,
      porcentajeFinal: cotizaciones.porcentajeFinal,
      incluyeIva: cotizaciones.incluyeIva,
      subtotalProductos:
        cotizaciones.subtotalProductos,
      subtotalServicios:
        cotizaciones.subtotalServicios,
      subtotalCostosAdicionales:
        cotizaciones.subtotalCostosAdicionales,
      total: cotizaciones.total,
      creadoEn: cotizaciones.creadoEn,
      actualizadoEn: cotizaciones.actualizadoEn,
    })
    .from(cotizaciones)
    .innerJoin(
      clientes,
      eq(cotizaciones.clienteId, clientes.id),
    )
    .where(eq(cotizaciones.id, cotizacionId))
    .limit(1);

  if (!cotizacion) {
    notFound();
  }

  const items = await db
    .select({
      id: cotizacionItems.id,
      tipo: cotizacionItems.tipo,
      nombre: cotizacionItems.nombre,
      descripcion: cotizacionItems.descripcion,
      cantidad: cotizacionItems.cantidad,
      precioUnitario: cotizacionItems.precioUnitario,
      subtotal: cotizacionItems.subtotal,
      orden: cotizacionItems.orden,
    })
    .from(cotizacionItems)
    .where(
      eq(cotizacionItems.cotizacionId, cotizacionId),
    )
    .orderBy(
      asc(cotizacionItems.orden),
      asc(cotizacionItems.id),
    );

  const [trabajoVinculado] =
    await db
      .select({
        id: trabajos.id,
        fecha: trabajos.fecha,
        estado: trabajos.estado,
        tipo: trabajos.tipo,
      })
      .from(cotizacionTrabajos)
      .innerJoin(
        trabajos,
        eq(
          cotizacionTrabajos.trabajoId,
          trabajos.id,
        ),
      )
      .where(
        eq(
          cotizacionTrabajos.cotizacionId,
          cotizacion.id,
        ),
      )
      .limit(1);

  const estadoVisual = obtenerEstiloEstado(
    cotizacion.estado,
  );

  const IconoEstado = estadoVisual.icono;

  const aprobar = cambiarEstadoCotizacion.bind(
    null,
    cotizacion.id,
    "APROBADA",
  );

  const rechazar = cambiarEstadoCotizacion.bind(
    null,
    cotizacion.id,
    "RECHAZADA",
  );

  const marcarVencida =
    cambiarEstadoCotizacion.bind(
      null,
      cotizacion.id,
      "VENCIDA",
    );

  const marcarPendiente =
    cambiarEstadoCotizacion.bind(
      null,
      cotizacion.id,
      "PENDIENTE",
    );

  const eliminar = eliminarCotizacion.bind(
    null,
    cotizacion.id,
  );

  return (
    <AppShell>
      <PageHeader
        title="Detalle de cotización"
        description={`Consulta la información completa de ${cotizacion.codigo}.`}
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/administracion/compras/cotizaciones"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={18} />
            Regresar a Cotizaciones
          </Link>
          
            <Link
                href={`/administracion/compras/cotizaciones/${cotizacion.id}/pdf`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
                <FileText size={17} />
                Ver PDF
            </Link>

            <Link
                href={`/administracion/compras/cotizaciones/${cotizacion.id}/pdf?download=1`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
                <Download size={17} />
                Descargar PDF
            </Link>
            </div>

        {parametros.creada === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Cotización creada correctamente.
          </div>
        )}

        {parametros.estado === "1" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Estado de la cotización actualizado correctamente.
          </div>
        )}

        {parametros.trabajo === "creado" && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
            Trabajo creado y asociado correctamente con esta cotización.
          </div>
        )}

        {parametros.error === "trabajo-vinculado" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-900">
            Esta cotización ya generó un trabajo. Para conservar la trazabilidad ya no puede cambiarse a rechazada, vencida o pendiente.
          </div>
        )}

        {parametros.error ===
          "estado-eliminar" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Solo se pueden eliminar cotizaciones pendientes.
          </div>
        )}

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <ReceiptText size={27} />
              </div>

              <div>
                <p className="text-sm font-bold text-blue-700">
                  {cotizacion.codigo}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {cotizacion.titulo}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Cliente:{" "}
                  <span className="font-semibold text-slate-700">
                    {cotizacion.clienteNombre}
                  </span>
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${estadoVisual.clases}`}
            >
              <IconoEstado size={17} />
              {estadoVisual.texto}
            </span>
          </div>
        </article>

        <div className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <FileText size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Información general
                </h3>

                <p className="text-sm text-slate-500">
                  Datos principales de la propuesta comercial.
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Cliente
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {cotizacion.clienteNombre}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Colaborador o área
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {cotizacion.colaborador}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <CalendarDays size={15} />
                  Fecha de solicitud
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {formatearFecha(
                    cotizacion.fechaSolicitud,
                  )}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Clock3 size={15} />
                  Válida hasta
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {formatearFecha(
                    cotizacion.validaHasta,
                  )}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Vigencia
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {cotizacion.diasVigencia} días
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  IVA
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {cotizacion.incluyeIva
                    ? "Incluido"
                    : "No incluido"}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <CircleDollarSign size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Resumen financiero
                </h3>

                <p className="text-sm text-slate-500">
                  Totales de la cotización.
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-slate-600">
                  Productos
                </dt>
                <dd className="font-semibold text-slate-900">
                  {formatearDinero(
                    cotizacion.subtotalProductos,
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-slate-600">
                  Servicios
                </dt>
                <dd className="font-semibold text-slate-900">
                  {formatearDinero(
                    cotizacion.subtotalServicios,
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-slate-600">
                  Costos adicionales
                </dt>
                <dd className="font-semibold text-slate-900">
                  {formatearDinero(
                    cotizacion.subtotalCostosAdicionales,
                  )}
                </dd>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-bold text-slate-900">
                    Total
                  </dt>
                  <dd className="text-2xl font-bold text-purple-700">
                    {formatearDinero(
                      cotizacion.total,
                    )}
                  </dd>
                </div>
              </div>

              <div className="rounded-xl bg-purple-50 p-4 text-sm text-purple-800">
                <p>
                  Anticipo:{" "}
                  <strong>
                    {cotizacion.porcentajeAnticipo}%
                  </strong>
                </p>
                <p className="mt-1">
                  Pago final:{" "}
                  <strong>
                    {cotizacion.porcentajeFinal}%
                  </strong>
                </p>
              </div>
            </dl>
          </article>
        </div>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <Package size={21} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Ítems cotizados
              </h3>
              <p className="text-sm text-slate-500">
                Productos, servicios y costos adicionales incluidos.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cantidad
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Valor unitario
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${obtenerEstiloTipo(
                          item.tipo,
                        )}`}
                      >
                        {obtenerNombreTipo(item.tipo)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.nombre}
                      </p>

                      {item.descripcion && (
                        <p className="mt-1 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-slate-500">
                          {item.descripcion}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-700">
                      {item.cantidad}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right text-slate-700">
                      {formatearDinero(
                        item.precioUnitario,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-900">
                      {formatearDinero(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Condiciones de pago y entrega
            </h3>

            <div className="mt-4 min-h-40 whitespace-pre-wrap rounded-xl bg-orange-50 p-4 text-sm leading-7 text-orange-950">
              {cotizacion.condicionesPago ||
                "No se registraron condiciones de pago y entrega."}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Observaciones
            </h3>

            <div className="mt-4 min-h-40 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {cotizacion.observaciones ||
                "Sin observaciones adicionales."}
            </div>
          </article>
        </div>

        <article
          className={`rounded-2xl border p-6 shadow-sm ${
            trabajoVinculado
              ? "border-blue-200 bg-blue-50"
              : cotizacion.estado === "APROBADA"
                ? "border-emerald-300 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                  trabajoVinculado
                    ? "bg-blue-100 text-blue-700"
                    : cotizacion.estado === "APROBADA"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                <BriefcaseBusiness
                  size={23}
                />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Conversión a trabajo
                </h3>

                {trabajoVinculado ? (
                  <p className="mt-1 text-sm leading-6 text-blue-900">
                    Esta cotización ya está asociada al Trabajo #{trabajoVinculado.id}: {trabajoVinculado.tipo}, programado para {trabajoVinculado.fecha}. Estado actual: {trabajoVinculado.estado}.
                  </p>
                ) : cotizacion.estado === "APROBADA" ? (
                  <p className="mt-1 text-sm leading-6 text-emerald-900">
                    Cotización aprobada. Ya está lista para programar el trabajo, seleccionar fecha, vehículo y personal responsable.
                  </p>
                ) : (
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    Primero debes aprobar esta cotización. Solo las cotizaciones aprobadas pueden generar un trabajo.
                  </p>
                )}
              </div>
            </div>

            {trabajoVinculado ? (
              <Link
                href={`/trabajos-asignados?trabajoId=${trabajoVinculado.id}#trabajo-${trabajoVinculado.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Ver trabajo asignado
              </Link>
            ) : cotizacion.estado === "APROBADA" ? (
              <Link
                href={`/trabajos/nuevo?cotizacionId=${cotizacion.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <BriefcaseBusiness
                  size={18}
                />
                Crear trabajo
              </Link>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Acciones de la cotización
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Actualiza el estado o elimina la cotización cuando corresponda.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!trabajoVinculado &&
                cotizacion.estado !== "APROBADA" && (
                <form action={aprobar}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={17} />
                    Aprobar
                  </button>
                </form>
              )}

              {!trabajoVinculado &&
                cotizacion.estado !== "RECHAZADA" && (
                <form action={rechazar}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <XCircle size={17} />
                    Rechazar
                  </button>
                </form>
              )}

              {!trabajoVinculado &&
                cotizacion.estado !== "VENCIDA" && (
                <form action={marcarVencida}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Clock3 size={17} />
                    Marcar vencida
                  </button>
                </form>
              )}

              {!trabajoVinculado &&
                cotizacion.estado !== "PENDIENTE" && (
                <form action={marcarPendiente}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                  >
                    <Clock3 size={17} />
                    Volver a pendiente
                  </button>
                </form>
              )}

              {cotizacion.estado === "PENDIENTE" && (
                <form action={eliminar}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 size={17} />
                    Eliminar
                  </button>
                </form>
              )}
            </div>
          </div>
        </article>
      </section>
    </AppShell>
  );
}