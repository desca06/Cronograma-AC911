import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  History,
  Search,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HistorialComprasPage() {
  await requerirAdmin();

  return (
    <AppShell>
      <PageHeader
        title="Historial de compras"
        description="Consulta y analiza todas las compras realizadas en AC911."
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

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Movimientos de compras
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Filtrá por fechas, proveedor, número de orden o estado.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  type="search"
                  placeholder="Orden o proveedor"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>
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
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Estado
              </label>
              <select className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100">
                <option>Todos</option>
                <option>Pendiente</option>
                <option>Aprobada</option>
                <option>Completada</option>
                <option>Cancelada</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Search size={17} />
              Buscar
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download size={17} />
              Exportar
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <History size={20} />
              Historial completo
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aquí se mostrarán todos los movimientos de compras registrados.
            </p>
          </div>

          <div className="px-6 py-16 text-center">
            <History size={46} className="mx-auto text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No hay movimientos todavía
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              El historial se llenará automáticamente cuando existan órdenes de compra.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}