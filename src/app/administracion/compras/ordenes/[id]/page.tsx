import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  ordenCompraItems,
  ordenesCompra,
  proveedores,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import {
  aprobarOrdenCompra,
  cancelarOrdenCompra,
  completarOrdenCompra,
} from "../actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
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

const mensajes: Record<string, string> = {
  creada: "Orden de compra creada correctamente.",
  aprobada: "Orden aprobada correctamente.",
  completada:
    "Compra completada. Los productos fueron ingresados al inventario.",
  cancelada: "Orden cancelada correctamente.",
};

export default async function DetalleOrdenCompraPage({
  params,
  searchParams,
}: Props) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;
  const ordenId = Number(id);

  if (!Number.isInteger(ordenId) || ordenId <= 0) {
    notFound();
  }

  const [orden] = await db
    .select({
      id: ordenesCompra.id,
      codigo: ordenesCompra.codigo,
      fechaCompra: ordenesCompra.fechaCompra,
      motivo: ordenesCompra.motivo,
      observaciones: ordenesCompra.observaciones,
      facturaReferencia:
        ordenesCompra.facturaReferencia,
      estado: ordenesCompra.estado,
      subtotal: ordenesCompra.subtotal,
      total: ordenesCompra.total,
      proveedorId: proveedores.id,
      proveedor: proveedores.nombreComercial,
      proveedorCodigo: proveedores.codigo,
      nit: proveedores.nit,
    })
    .from(ordenesCompra)
    .innerJoin(
      proveedores,
      eq(ordenesCompra.proveedorId, proveedores.id),
    )
    .where(eq(ordenesCompra.id, ordenId))
    .limit(1);

  if (!orden) {
    notFound();
  }

  const items = await db
    .select({
      id: ordenCompraItems.id,
      tipo: ordenCompraItems.tipo,
      descripcion: ordenCompraItems.descripcion,
      cantidad: ordenCompraItems.cantidad,
      precioUnitario: ordenCompraItems.precioUnitario,
      subtotal: ordenCompraItems.subtotal,
    })
    .from(ordenCompraItems)
    .where(
      eq(ordenCompraItems.ordenCompraId, ordenId),
    )
    .orderBy(asc(ordenCompraItems.orden));

  const aprobar = aprobarOrdenCompra.bind(null, ordenId);
  const completar = completarOrdenCompra.bind(
    null,
    ordenId,
  );
  const cancelar = cancelarOrdenCompra.bind(null, ordenId);

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

          <span
            className={`rounded-full px-4 py-2 text-xs font-bold ${claseEstado(
              orden.estado,
            )}`}
          >
            {orden.estado}
          </span>
        </div>

        {parametros.success &&
          mensajes[parametros.success] && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {mensajes[parametros.success]}
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
                  {orden.fechaCompra}
                </dd>
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
                  {orden.facturaReferencia || "Sin referencia"}
                </dd>
              </div>
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
                {items.map((item) => (
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
                      {dinero(item.precioUnitario)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {dinero(item.subtotal)}
                    </td>
                  </tr>
                ))}
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
          <h2 className="font-bold text-slate-900">
            Acciones de la orden
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {orden.estado === "PENDIENTE" && (
              <form action={aprobar}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 size={18} />
                  Aprobar orden
                </button>
              </form>
            )}

            {orden.estado === "APROBADA" && (
              <form action={completar}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  <PackageCheck size={18} />
                  Completar compra
                </button>
              </form>
            )}

            {(orden.estado === "PENDIENTE" ||
              orden.estado === "APROBADA") && (
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

            {orden.estado === "COMPLETADA" && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700">
                <PackageCheck size={18} />
                Compra finalizada e ingresada al historial
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}