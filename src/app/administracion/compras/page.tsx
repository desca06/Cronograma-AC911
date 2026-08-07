import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  FileText,
  History,
  ShoppingCart,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

const modulosCompras = [
  {
    nombre: "Cotizaciones",
    descripcion:
      "Crea cotizaciones para clientes, administra sus estados y genera documentos en PDF.",
    href: "/administracion/compras/cotizaciones",
    icono: FileText,
    estilos: {
      borde: "border-blue-200",
      fondoIcono: "bg-blue-100",
      textoIcono: "text-blue-700",
      boton: "bg-blue-600 hover:bg-blue-700",
    },
  },
  {
    nombre: "Órdenes de compra",
    descripcion:
      "Registra y administra las compras internas de materiales, equipos, productos y servicios.",
    href: "/administracion/compras/ordenes",
    icono: ShoppingCart,
    estilos: {
      borde: "border-orange-200",
      fondoIcono: "bg-orange-100",
      textoIcono: "text-orange-700",
      boton: "bg-orange-600 hover:bg-orange-700",
    },
  },
  {
    nombre: "Proveedores",
    descripcion:
      "Administra la información comercial, fiscal y de contacto de los proveedores.",
    href: "/administracion/compras/proveedores",
    icono: Building2,
    estilos: {
      borde: "border-purple-200",
      fondoIcono: "bg-purple-100",
      textoIcono: "text-purple-700",
      boton: "bg-purple-600 hover:bg-purple-700",
    },
  },
  {
    nombre: "Historial de compras",
    descripcion:
      "Consulta órdenes de compra, proveedores, montos, estados y movimientos realizados.",
    href: "/administracion/compras/historial",
    icono: History,
    estilos: {
      borde: "border-slate-200",
      fondoIcono: "bg-slate-100",
      textoIcono: "text-slate-700",
      boton: "bg-slate-800 hover:bg-slate-900",
    },
  },
];

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  await requerirAdmin();

  return (
    <AppShell>
      <PageHeader
        title="Compras"
        description="Gestiona cotizaciones, órdenes de compra, proveedores e historial de AC911."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <Link
              href="/administracion"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
            >
              <ArrowLeft size={18} />
              Regresar a Administración
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {modulosCompras.map((modulo) => {
              const Icono = modulo.icono;

              return (
                <article
                  key={modulo.nombre}
                  className={`flex min-h-[260px] flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${modulo.estilos.borde}`}
                >
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-2xl ${modulo.estilos.fondoIcono} ${modulo.estilos.textoIcono}`}
                  >
                    <Icono size={28} />
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-slate-900">
                    {modulo.nombre}
                  </h2>

                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    {modulo.descripcion}
                  </p>

                  <Link
                    href={modulo.href}
                    className={`mt-6 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${modulo.estilos.boton}`}
                  >
                    <ClipboardList size={17} />
                    Ingresar
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}