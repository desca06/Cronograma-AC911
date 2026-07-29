import Link from "next/link";
import {
  Boxes,
  PackageSearch,
  Warehouse,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

const modulosInventario = [
  {
    nombre: "Categorías",
    descripcion:
      "Organiza los equipos, repuestos, refrigerantes, materiales y herramientas de AC911.",
    href: "/administracion/inventario/categorias",
    icono: Boxes,
    disponible: true,
    estilos: {
      borde: "border-red-200",
      fondoIcono: "bg-red-100",
      textoIcono: "text-red-700",
      boton: "bg-red-600 hover:bg-red-700",
    },
  },
  {
    nombre: "Artículos",
    descripcion:
      "Registra y administra los materiales, equipos, repuestos y consumibles del inventario.",
    href: "/administracion/inventario/articulos",
    icono: PackageSearch,
    disponible: true,
    estilos: {
      borde: "border-emerald-200",
      fondoIcono: "bg-emerald-100",
      textoIcono: "text-emerald-700",
      boton: "bg-emerald-600 hover:bg-emerald-700",
    },
  },
  {
    nombre: "Existencias",
    descripcion:
      "Consulta las cantidades disponibles, el stock mínimo y los artículos agotados.",
    href: "/administracion/inventario/existencias",
    icono: Warehouse,
    disponible: true,
    estilos: {
      borde: "border-orange-200",
      fondoIcono: "bg-orange-100",
      textoIcono: "text-orange-700",
      boton: "bg-orange-600 hover:bg-orange-700",
    },
  },
];

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  await requerirAdmin();

  return (
    <AppShell>
      <PageHeader
        title="Inventario"
        description="Gestiona los materiales, repuestos, equipos y herramientas de AC911"
      />

      <section className="p-5 md:p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {modulosInventario.map((modulo) => {
            const Icono = modulo.icono;

            return (
              <article
                key={modulo.nombre}
                className={`relative flex min-h-[260px] flex-col rounded-2xl border bg-white p-6 shadow-sm transition ${
                  modulo.estilos.borde
                } ${
                  modulo.disponible
                    ? "hover:-translate-y-1 hover:shadow-lg"
                    : "opacity-75"
                }`}
              >
                {!modulo.disponible && (
                  <span className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    Próximamente
                  </span>
                )}

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

                {modulo.disponible ? (
                  <Link
                    href={modulo.href}
                    className={`mt-6 inline-flex w-fit rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${modulo.estilos.boton}`}
                  >
                    Ingresar
                  </Link>
                ) : (
                  <span className="mt-6 inline-flex w-fit cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500">
                    No disponible
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}