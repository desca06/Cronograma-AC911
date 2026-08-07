import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  PackageCheck,
  Search,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import {
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  ordenesCompra,
  proveedores,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    buscar?: string;
    estado?: string;
  }>;
};

const estadosOrden = [
  "PENDIENTE",
  "APROBADA",
  "COMPLETADA",
  "CANCELADA",
] as const;

type EstadoOrden = (typeof estadosOrden)[number];

function esEstadoOrden(valor: string): valor is EstadoOrden {
  return estadosOrden.includes(valor as EstadoOrden);
}

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

function nombreEstado(estado: string) {
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

export default async function OrdenesCompraPage({
  searchParams,
}: Props) {
  await requerirAdmin();

  const parametros = await searchParams;
  const buscar = parametros.buscar?.trim() ?? "";
  const estado = parametros.estado?.trim() ?? "";

  const condiciones = [];

  if (buscar) {
    condiciones.push(
      or(
        ilike(ordenesCompra.codigo, `%${buscar}%`),
        ilike(proveedores.nombreComercial, `%${buscar}%`),
        ilike(ordenesCompra.motivo, `%${buscar}%`),
      ),
    );
  }

  if (esEstadoOrden(estado)) {
    condiciones.push(
      eq(ordenesCompra.estado, estado),
    );
  }

  const listaOrdenes = await db
    .select({
      id: ordenesCompra.id,
      codigo: ordenesCompra.codigo,
      fechaCompra: ordenesCompra.fechaCompra,
      proveedor: proveedores.nombreComercial,
      motivo: ordenesCompra.motivo,
      estado: ordenesCompra.estado,
      total: ordenesCompra.total,
    })
    .from(ordenesCompra)
    .innerJoin(
      proveedores,
      eq(ordenesCompra.proveedorId, proveedores.id),
    )
    .where(
      condiciones.length
        ? sql`${sql.join(condiciones, sql` AND `)}`
        : undefined,
    )
    .orderBy(desc(ordenesCompra.creadoEn));

  const [resumen] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pendientes: sql<number>`
        count(*) filter (
          where ${ordenesCompra.estado} = 'PENDIENTE'
        )::int
      `,
      aprobadas: sql<number>`
        count(*) filter (
          where ${ordenesCompra.estado} = 'APROBADA'
        )::int
      `,
      completadas: sql<number>`
        count(*) filter (
          where ${ordenesCompra.estado} = 'COMPLETADA'
        )::int
      `,
    })
    .from(ordenesCompra);

  const tarjetas = [
    {
      titulo: "Total de órdenes",
      cantidad: resumen?.total ?? 0,
      icono: ShoppingCart,
      clases: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      titulo: "Pendientes",
      cantidad: resumen?.pendientes ?? 0,
      icono: Clock3,
      clases: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      titulo: "Aprobadas",
      cantidad: resumen?.aprobadas ?? 0,
      icono: CheckCircle2,
      clases:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      titulo: "Completadas",
      cantidad: resumen?.completadas ?? 0,
      icono: PackageCheck,
      clases:
        "border-violet-200 bg-violet-50 text-violet-700",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Órdenes de compra"
        description="Control y seguimiento de las compras realizadas a proveedores."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href="/administracion/compras"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-700"
          >
            <ArrowLeft size={18} />
            Volver a Compras
          </Link>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Órdenes registradas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Administrá proveedores, productos, montos y estados.
            </p>
          </div>

          <Link
            href="/administracion/compras/ordenes/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            <FilePlus2 size={18} />
            Nueva orden
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tarjetas.map((item) => {
            const Icono = item.icono;

            return (
              <article
                key={item.titulo}
                className={`rounded-2xl border p-5 ${item.clases}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {item.titulo}
                  </p>
                  <Icono size={21} />
                </div>
                <p className="mt-3 text-3xl font-bold">
                  {item.cantidad}
                </p>
              </article>
            );
          })}
        </div>

        <form
          method="GET"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label
                htmlFor="buscar"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Buscar orden
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
                  placeholder="Número de orden, proveedor o motivo"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="w-full md:w-56">
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="APROBADA">Aprobada</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              <Search size={17} />
              Buscar
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Listado de órdenes de compra
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cada orden está relacionada con su proveedor y sus
              productos o servicios.
            </p>
          </div>

          {listaOrdenes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ShoppingCart
                size={46}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No hay órdenes registradas
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Creá la primera orden de compra para comenzar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Orden
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Proveedor
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Fecha
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Motivo
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Total
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
                  {listaOrdenes.map((orden) => (
                    <tr
                      key={orden.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-orange-700">
                        {orden.codigo}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {orden.proveedor}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {orden.fechaCompra}
                      </td>
                      <td className="max-w-[300px] px-5 py-4 text-sm text-slate-600">
                        {orden.motivo}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                        {dinero(orden.total)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${claseEstado(
                            orden.estado,
                          )}`}
                        >
                          {nombreEstado(orden.estado)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/administracion/compras/ordenes/${orden.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye size={16} />
                          Detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}