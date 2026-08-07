import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
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
  usuarios,
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
      return "border-blue-200 bg-blue-50 text-blue-700";
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

function fechaGuatemala(fecha: Date) {
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

function horaGuatemala(fecha: Date) {
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(fecha);
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
        new Date(`${desde}T00:00:00-06:00`),
      ),
    );
  }

  if (hasta) {
    condiciones.push(
      lte(
        ordenCompraEventos.creadoEn,
        new Date(`${hasta}T23:59:59.999-06:00`),
      ),
    );
  }

  const eventos = await db
    .select({
      id: ordenCompraEventos.id,
      tipo: ordenCompraEventos.tipo,
      descripcion: ordenCompraEventos.descripcion,
      creadoEn: ordenCompraEventos.creadoEn,
      estadoAnterior: ordenCompraEventos.estadoAnterior,
      estadoNuevo: ordenCompraEventos.estadoNuevo,
      ordenId: ordenesCompra.id,
      codigo: ordenesCompra.codigo,
      motivo: ordenesCompra.motivo,
      total: ordenesCompra.total,
      proveedor: proveedores.nombreComercial,
      usuario: usuarios.nombre,
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
      eq(
        ordenesCompra.proveedorId,
        proveedores.id,
      ),
    )
    .leftJoin(
      usuarios,
      eq(
        ordenCompraEventos.usuarioId,
        usuarios.id,
      ),
    )
    .where(
      condiciones.length
        ? sql`${sql.join(condiciones, sql` AND `)}`
        : undefined,
    )
    .orderBy(
      desc(ordenCompraEventos.creadoEn),
    );

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
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
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
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              >
                <option value="">Todos</option>
                <option value="CREADA">Orden creada</option>
                <option value="APROBADA">Orden aprobada</option>
                <option value="COMPLETADA">Compra completada</option>
                <option value="CANCELADA">Orden cancelada</option>
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
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
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
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Search size={17} />
              Buscar
            </button>

            <Link
              href="/administracion/compras/historial"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              Cada creación, aprobación, finalización o cancelación queda
              registrada automáticamente con fecha y hora de Guatemala.
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
              <table className="w-full min-w-[1450px] table-fixed">
                <colgroup>
                  <col className="w-[110px]" />
                  <col className="w-[130px]" />
                  <col className="w-[190px]" />
                  <col className="w-[190px]" />
                  <col className="w-[165px]" />
                  <col className="w-[150px]" />
                  <col className="w-[260px]" />
                  <col className="w-[160px]" />
                  <col className="w-[145px]" />
                </colgroup>

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
                      Movimiento
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Realizado por
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Motivo
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Total
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {eventos.map((evento) => (
                    <tr
                      key={evento.id}
                      className="group transition hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap px-5 py-5 text-sm font-medium text-slate-600">
                        {fechaGuatemala(evento.creadoEn)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-sm font-semibold text-slate-700">
                        {horaGuatemala(evento.creadoEn)}
                      </td>

                      <td className="px-5 py-5">
                        <Link
                          href={`/administracion/compras/ordenes/${evento.ordenId}`}
                          className="inline-block whitespace-nowrap font-bold text-orange-700 transition hover:text-orange-800 hover:underline"
                        >
                          {evento.codigo}
                        </Link>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-semibold leading-5 text-slate-900">
                          {evento.proveedor}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${claseEvento(
                            evento.tipo,
                          )}`}
                        >
                          {nombreEvento(evento.tipo)}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-sm font-semibold text-slate-700">
                        {evento.usuario || "Usuario no disponible"}
                      </td>

                      <td className="px-5 py-5">
                        <p className="line-clamp-2 text-sm leading-5 text-slate-600">
                          {evento.motivo}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-right font-bold text-slate-900">
                        {dinero(evento.total)}
                      </td>

                      <td className="px-5 py-5 text-center">
                        <Link
                          href={`/administracion/compras/ordenes/${evento.ordenId}`}
                          className="inline-flex min-w-[112px] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                        >
                          <Eye size={16} />
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