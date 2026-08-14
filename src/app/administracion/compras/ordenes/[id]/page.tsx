import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  History,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  ordenCompraEventos,
  ordenCompraItems,
  ordenesCompra,
  proveedores,
  usuarios,
} from "@/db/schema";
import { requerirCompras } from "@/lib/auth";

import {
  aprobarOrdenCompra,
  cancelarOrdenCompra,
  completarOrdenCompra,
} from "../actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
    confirmarEliminar?: string;
  }>;
};

function dinero(centavos: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(centavos / 100);
}

function claseEstado(estado: string) {
  switch (estado) {
    case "PENDIENTE":
      return "bg-amber-100 text-amber-700";

    case "APROBADA":
      return "bg-emerald-100 text-emerald-700";

    case "COMPLETADA":
      return "bg-violet-100 text-violet-700";

    case "CANCELADA":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatearFechaCompra(fecha: string) {
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [anio, mes, dia] = partes;

  return `${dia}/${mes}/${anio}`;
}

function horaGuatemala(fecha: Date | null) {
  if (!fecha) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(fecha);
}

function fechaHoraGuatemala(fecha: Date | null) {
  if (!fecha) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(fecha);
}

const mensajes: Record<string, string> = {
  creada:
    "Orden de compra creada correctamente.",

  aprobada:
    "Orden aprobada correctamente.",

  completada:
    "Compra completada. Los productos fueron ingresados al inventario.",

  cancelada:
    "Orden cancelada correctamente.",
};

const errores: Record<string, string> = {
  "orden-completada":
    "Una orden completada no puede eliminarse porque ya afectó el inventario.",
};

export default async function DetalleOrdenCompraPage({
  params,
  searchParams,
}: Props) {
  await requerirCompras();

  const { id } = await params;
  const parametros = await searchParams;

  const ordenId = Number(id);

  if (
    !Number.isInteger(ordenId) ||
    ordenId <= 0
  ) {
    notFound();
  }

  const [orden] = await db
    .select({
      id: ordenesCompra.id,

      codigo: ordenesCompra.codigo,

      fechaCompra:
        ordenesCompra.fechaCompra,

      creadoEn:
        ordenesCompra.creadoEn,

      completadaEn:
        ordenesCompra.completadaEn,

      motivo:
        ordenesCompra.motivo,

      observaciones:
        ordenesCompra.observaciones,

      facturaReferencia:
        ordenesCompra.facturaReferencia,

      estado:
        ordenesCompra.estado,

      subtotal:
        ordenesCompra.subtotal,

      total:
        ordenesCompra.total,

      proveedorId:
        proveedores.id,

      proveedor:
        proveedores.nombreComercial,

      proveedorCodigo:
        proveedores.codigo,

      nit:
        proveedores.nit,
    })
    .from(ordenesCompra)
    .innerJoin(
      proveedores,
      eq(
        ordenesCompra.proveedorId,
        proveedores.id,
      ),
    )
    .where(
      eq(
        ordenesCompra.id,
        ordenId,
      ),
    )
    .limit(1);

  if (!orden) {
    notFound();
  }

  async function eliminarOrden() {
    "use server";

    await requerirCompras();

    const [ordenActual] = await db
      .select({
        id: ordenesCompra.id,
        estado: ordenesCompra.estado,
      })
      .from(ordenesCompra)
      .where(eq(ordenesCompra.id, ordenId))
      .limit(1);

    if (!ordenActual) {
      redirect("/administracion/compras/ordenes");
    }

    if (ordenActual.estado === "COMPLETADA") {
      redirect(
        `/administracion/compras/ordenes/${ordenId}?error=orden-completada`,
      );
    }

    await db
      .delete(ordenesCompra)
      .where(eq(ordenesCompra.id, ordenId));

    revalidatePath("/administracion/compras");
    revalidatePath("/administracion/compras/ordenes");
    revalidatePath("/administracion/compras/historial");

    redirect("/administracion/compras/ordenes");
  }

  const items = await db
    .select({
      id:
        ordenCompraItems.id,

      tipo:
        ordenCompraItems.tipo,

      descripcion:
        ordenCompraItems.descripcion,

      cantidad:
        ordenCompraItems.cantidad,

      precioUnitario:
        ordenCompraItems.precioUnitario,

      subtotal:
        ordenCompraItems.subtotal,
    })
    .from(ordenCompraItems)
    .where(
      eq(
        ordenCompraItems.ordenCompraId,
        ordenId,
      ),
    )
    .orderBy(
      asc(
        ordenCompraItems.orden,
      ),
    );

  const eventos = await db
    .select({
      id:
        ordenCompraEventos.id,

      tipo:
        ordenCompraEventos.tipo,

      descripcion:
        ordenCompraEventos.descripcion,

      estadoAnterior:
        ordenCompraEventos.estadoAnterior,

      estadoNuevo:
        ordenCompraEventos.estadoNuevo,

      creadoEn:
        ordenCompraEventos.creadoEn,

      usuario:
        usuarios.nombre,
    })
    .from(ordenCompraEventos)
    .leftJoin(
      usuarios,
      eq(
        ordenCompraEventos.usuarioId,
        usuarios.id,
      ),
    )
    .where(
      eq(
        ordenCompraEventos.ordenCompraId,
        ordenId,
      ),
    )
    .orderBy(
      desc(
        ordenCompraEventos.creadoEn,
      ),
    );

  const eventoCancelacion =
    eventos.find(
      (evento) =>
        evento.tipo === "CANCELADA",
    );

  const aprobar =
    aprobarOrdenCompra.bind(
      null,
      ordenId,
    );

  const completar =
    completarOrdenCompra.bind(
      null,
      ordenId,
    );

  const cancelar =
    cancelarOrdenCompra.bind(
      null,
      ordenId,
    );

  return (
    <AppShell>
      <PageHeader
        title={`Orden ${orden.codigo}`}
        description="Detalle, aprobación y finalización de la compra."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/administracion/compras/ordenes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-700"
          >
            <ArrowLeft size={18} />

            Volver a Órdenes de compra
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/administracion/compras/ordenes/${orden.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              <FileText size={17} />
              Ver PDF
            </a>

            <a
              href={`/administracion/compras/ordenes/${orden.id}/pdf?download=1`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              <Download size={17} />
              Descargar PDF
            </a>

            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${claseEstado(
                orden.estado,
              )}`}
            >
              {orden.estado}
            </span>
          </div>
        </div>

        {parametros.success &&
          mensajes[
            parametros.success
          ] && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {
                mensajes[
                  parametros.success
                ]
              }
            </div>
          )}

        {parametros.error &&
          errores[
            parametros.error
          ] && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {
                errores[
                  parametros.error
                ]
              }
            </div>
          )}

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShoppingCart
                className="text-orange-600"
                size={24}
              />

              <h2 className="text-lg font-bold text-slate-900">
                Información de la compra
              </h2>
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase text-slate-400">
                  Código
                </dt>

                <dd className="mt-1 font-bold text-orange-700">
                  {orden.codigo}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-slate-400">
                  Fecha
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {formatearFechaCompra(
                    orden.fechaCompra,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-slate-400">
                  Hora
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {horaGuatemala(
                    orden.creadoEn,
                  )}
                </dd>

                <p className="mt-1 text-xs text-slate-400">
                  Hora Guatemala
                </p>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-slate-400">
                  Motivo
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {orden.motivo}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-slate-400">
                  Factura / referencia
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {orden.facturaReferencia ||
                    "Sin referencia"}
                </dd>
              </div>

              {orden.completadaEn && (
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-400">
                    Compra completada
                  </dt>

                  <dd className="mt-1 font-semibold text-violet-700">
                    {fechaHoraGuatemala(
                      orden.completadaEn,
                    )}
                  </dd>
                </div>
              )}

              {eventoCancelacion && (
                <div>
                  <dt className="text-xs font-bold uppercase text-slate-400">
                    Orden cancelada
                  </dt>

                  <dd className="mt-1 font-semibold text-red-700">
                    {fechaHoraGuatemala(
                      eventoCancelacion.creadoEn,
                    )}
                  </dd>
                </div>
              )}
            </dl>

            {orden.observaciones && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Observaciones
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {orden.observaciones}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2
                className="text-purple-600"
                size={24}
              />

              <h2 className="text-lg font-bold text-slate-900">
                Proveedor
              </h2>
            </div>

            <p className="mt-5 text-lg font-bold text-slate-900">
              {orden.proveedor}
            </p>

            <p className="mt-1 text-sm font-semibold text-purple-700">
              {orden.proveedorCodigo}
            </p>

            <p className="mt-3 text-sm text-slate-500">
              NIT: {orden.nit}
            </p>

            <Link
              href={`/administracion/compras/proveedores/${orden.proveedorId}`}
              className="mt-5 inline-flex rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700"
            >
              Ver proveedor
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <ReceiptText size={21} />

              Detalle comprado
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Tipo
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                    Descripción
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                    Cantidad
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                    Precio
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map(
                  (item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {item.tipo}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {item.descripcion}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {item.cantidad}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {dinero(
                          item.precioUnitario,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-bold">
                        {dinero(
                          item.subtotal,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-5">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-500">
                Total
              </p>

              <p className="text-3xl font-bold text-slate-900">
                {dinero(orden.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <History
              size={20}
              className="text-slate-600"
            />

            <h2 className="font-bold text-slate-900">
              Historial de la orden
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {eventos.map(
              (evento) => (
                <div
                  key={evento.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {evento.descripcion ||
                        evento.tipo}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {evento.usuario ||
                        "Usuario no disponible"}

                      {" · "}

                      {fechaHoraGuatemala(
                        evento.creadoEn,
                      )}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    {evento.estadoAnterior
                      ? `${evento.estadoAnterior} → ${evento.estadoNuevo}`
                      : evento.estadoNuevo}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Acciones de la orden
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {orden.estado ===
              "PENDIENTE" && (
              <form action={aprobar}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2
                    size={18}
                  />

                  Aprobar orden
                </button>
              </form>
            )}

            {orden.estado ===
              "APROBADA" && (
              <form action={completar}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  <PackageCheck
                    size={18}
                  />

                  Completar compra
                </button>
              </form>
            )}

            {(orden.estado ===
              "PENDIENTE" ||
              orden.estado ===
                "APROBADA") && (
              <form action={cancelar}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <Ban size={18} />

                  Cancelar orden
                </button>
              </form>
            )}

            {orden.estado !==
              "COMPLETADA" &&
              parametros.confirmarEliminar !==
                "1" && (
                <Link
                  href={`/administracion/compras/ordenes/${ordenId}?confirmarEliminar=1`}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 size={18} />
                  Eliminar orden
                </Link>
              )}

            {orden.estado ===
              "COMPLETADA" && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700">
                <PackageCheck
                  size={18}
                />

                Compra finalizada e ingresada al historial
              </div>
            )}

            {orden.estado ===
              "CANCELADA" && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
                <Ban size={18} />

                Esta orden fue cancelada
              </div>
            )}
          </div>

          {orden.estado !== "COMPLETADA" &&
            parametros.confirmarEliminar === "1" && (
              <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <Trash2
                    size={22}
                    className="mt-0.5 shrink-0 text-red-700"
                  />

                  <div className="flex-1">
                    <h3 className="font-bold text-red-900">
                      ¿Eliminar definitivamente la orden {orden.codigo}?
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-red-700">
                      Esta acción eliminará la orden, sus productos y su
                      historial relacionado. No se puede deshacer.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <form action={eliminarOrden}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          <Trash2 size={18} />
                          Sí, eliminar definitivamente
                        </button>
                      </form>

                      <Link
                        href={`/administracion/compras/ordenes/${ordenId}`}
                        className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        No, conservar orden
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </section>
    </AppShell>
  );
}