import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  History,
  Search,
} from "lucide-react";
import {
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  ordenCompraEventos,
  ordenesCompra,
  proveedores,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    buscar?: string;
    tipo?: string;
    desde?: string;
    hasta?: string;
  }>;
};

const tiposEvento = [
  "CREADA",
  "APROBADA",
  "COMPLETADA",
  "CANCELADA",
] as const;

type TipoEvento = (typeof tiposEvento)[number];

function esTipoEvento(valor: string): valor is TipoEvento {
  return tiposEvento.includes(valor as TipoEvento);
}

function dinero(centavos: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(centavos / 100);
}

function nombreEvento(tipo: string) {
  switch (tipo) {
    case "CREADA":
      return "Orden creada";
    case "APROBADA":
      return "Orden aprobada";
    case "COMPLETADA":
      return "Compra completada";
    case "CANCELADA":
      return "Orden cancelada";
    default:
      return tipo;
  }
}

function claseEvento(tipo: string) {
  switch (tipo) {
    case "CREADA":
      return "bg-blue-100 text-blue-700";
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

export default async function HistorialComprasPage({
  searchParams,
}: Props) {
  await requerirAdmin();

  const parametros = await searchParams;

  const buscar = parametros.buscar?.trim() ?? "";
  const tipo = parametros.tipo?.trim() ?? "";
  const desde = parametros.desde?.trim() ?? "";
  const hasta = parametros.hasta?.trim() ?? "";

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

  if (esTipoEvento(tipo)) {
    condiciones.push(
      eq(ordenCompraEventos.tipo, tipo),
    );
  }

  if (desde) {
    condiciones.push(
      gte(
        ordenCompraEventos.creadoEn,
        new Date(`${desde}T00:00:00`),
      ),
    );
  }

  if (hasta) {
    condiciones.push(
      lte(
        ordenCompraEventos.creadoEn,
        new Date(`${hasta}T23:59:59`),
      ),
    );
  }

  const eventos = await db
    .select({
      id: ordenCompraEventos.id,
      tipo: ordenCompraEventos.tipo,
      descripcion: ordenCompraEventos.descripcion,
      creadoEn: ordenCompraEventos.creadoEn,
      estadoAnterior:
        ordenCompraEventos.estadoAnterior,
      estadoNuevo: ordenCompraEventos.estadoNuevo,
      ordenId: ordenesCompra.id,
      codigo: ordenesCompra.codigo,
      motivo: ordenesCompra.motivo,
      total: ordenesCompra.total,
      proveedor: proveedores.nombreComercial,
    })
    .from(ordenCompraEventos)
    .innerJoin(
      ordenesCompra,
      eq(
        ordenCompraEventos.ordenCompraId,
        ordenesCompra.id,
      ),
    )
    .innerJoin(
      proveedores,
      eq(ordenesCompra.proveedorId, proveedores.id),
    )
    .where(
      condiciones.length
        ? sql`${sql.join(condiciones, sql` AND `)}`
        : undefined,
    )
    .orderBy(desc(ordenCompraEventos.creadoEn));

  return (
    <AppShell>
      <PageHeader
        title="Historial de compras"
        description="Trazabilidad completa de las órdenes y compras realizadas por AC911."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href="/administracion/compras"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a Compras
          </Link>
        </div>

        <form
          method="GET"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="buscar"
                  defaultValue={buscar}
                  placeholder="Orden, proveedor o motivo"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Movimiento
              </label>
              <select
                name="tipo"
                defaultValue={tipo}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="">Todos</option>
                <option value="CREADA">Orden creada</option>
                <option value="APROBADA">
                  Orden aprobada
                </option>
                <option value="COMPLETADA">
                  Compra completada
                </option>
                <option value="CANCELADA">
                  Orden cancelada
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Desde
              </label>
              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  name="desde"
                  defaultValue={desde}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hasta
              </label>
              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  name="hasta"
                  defaultValue={hasta}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              <Search size={17} />
              Buscar
            </button>

            <Link
              href="/administracion/compras/historial"
              className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Limpiar
            </Link>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <History size={20} />
              Trazabilidad de compras
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cada creación, aprobación, finalización o cancelación
              queda registrada automáticamente.
            </p>
          </div>

          {eventos.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <History
                size={46}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No hay movimientos
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Fecha
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Orden
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Proveedor
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Movimiento
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                      Motivo
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                      Total
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                      Detalle
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {eventos.map((evento) => (
                    <tr
                      key={evento.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {new Intl.DateTimeFormat("es-GT", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Guatemala",
                        }).format(evento.creadoEn)}
                      </td>
                      <td className="px-5 py-4 font-bold text-orange-700">
                        {evento.codigo}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {evento.proveedor}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${claseEvento(
                            evento.tipo,
                          )}`}
                        >
                          {nombreEvento(evento.tipo)}
                        </span>
                      </td>
                      <td className="max-w-[280px] px-5 py-4 text-sm text-slate-600">
                        {evento.motivo}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold">
                        {dinero(evento.total)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/administracion/compras/ordenes/${evento.ordenId}`}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          Ver orden
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