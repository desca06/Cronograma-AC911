import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ShoppingCart,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import {
  requerirAdmin,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";

const submodulos = [
  {
    nombre:
      "Órdenes de Compra",
    descripcion:
      "Gastos, proveedores, órdenes, estados, artículos, gráficas y PDF ejecutivo.",
    href:
      "/administracion/reportes/compras",
    icono:
      ShoppingCart,
    clases:
      "border-purple-200 bg-purple-50 text-purple-700",
    boton:
      "bg-purple-600 hover:bg-purple-700",
  },
  {
    nombre:
      "Trabajos",
    descripcion:
      "Trabajos del mes, finalizados, pendientes, en proceso, reprogramados, productividad, gráficas y PDF.",
    href:
      "/administracion/reportes/trabajos",
    icono:
      BriefcaseBusiness,
    clases:
      "border-blue-200 bg-blue-50 text-blue-700",
    boton:
      "bg-blue-600 hover:bg-blue-700",
  },
];

export default async function ReportesPage() {
  await requerirAdmin();

  return (
    <AppShell>
      <PageHeader
        title="Reportes"
        description="Selecciona el área que deseas analizar."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/administracion"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft
              size={18}
            />
            Volver a Administración
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {submodulos.map(
              (modulo) => {
                const Icono =
                  modulo.icono;

                return (
                  <article
                    key={
                      modulo.nombre
                    }
                    className="flex min-h-[290px] flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className={`grid h-14 w-14 place-items-center rounded-2xl border ${modulo.clases}`}
                    >
                      <Icono
                        size={28}
                      />
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-slate-900">
                      {
                        modulo.nombre
                      }
                    </h2>

                    <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                      {
                        modulo.descripcion
                      }
                    </p>

                    <Link
                      href={
                        modulo.href
                      }
                      className={`mt-6 inline-flex w-fit rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${modulo.boton}`}
                    >
                      Abrir reporte
                    </Link>
                  </article>
                );
              },
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}