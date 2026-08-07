import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FilePlus2,
  PackageCheck,
  Search,
  ShoppingCart,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const resumen = [
  {
    titulo: "Total de órdenes",
    cantidad: 0,
    icono: ShoppingCart,
    clases: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    titulo: "Pendientes",
    cantidad: 0,
    icono: Clock3,
    clases: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    titulo: "Aprobadas",
    cantidad: 0,
    icono: CheckCircle2,
    clases: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    titulo: "Completadas",
    cantidad: 0,
    icono: PackageCheck,
    clases: "border-violet-200 bg-violet-50 text-violet-700",
  },
];

export default async function OrdenesCompraPage() {
  await requerirAdmin();

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
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
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
              Administrá solicitudes, proveedores, montos y estados de compra.
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
          {resumen.map((item) => {
            const Icono = item.icono;

            return (
              <article
                key={item.titulo}
                className={`rounded-2xl border p-5 ${item.clases}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{item.titulo}</p>
                  <Icono size={21} />
                </div>
                <p className="mt-3 text-3xl font-bold">{item.cantidad}</p>
              </article>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  type="search"
                  placeholder="Número de orden, proveedor o descripción"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              >
                <option>Todos</option>
                <option>Pendiente</option>
                <option>Aprobada</option>
                <option>Completada</option>
                <option>Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Listado de órdenes de compra
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aquí aparecerán las órdenes registradas en el sistema.
            </p>
          </div>

          <div className="px-6 py-16 text-center">
            <ShoppingCart size={46} className="mx-auto text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No hay órdenes registradas
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Creá la primera orden de compra para comenzar.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}