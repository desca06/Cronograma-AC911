import {
  Boxes,
  ChartNoAxesCombined,
  ShoppingCart,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

const modulos = [
  {
    nombre: "Recursos Humanos",
    descripcion:
      "Gestiona empleados, asistencias, permisos, vacaciones y expedientes.",
    href: "/administracion/rh",
    icono: UsersRound,
    disponible: true,
    estilos: {
      borde: "border-emerald-200",
      fondoIcono: "bg-emerald-100",
      textoIcono: "text-emerald-700",
      boton:
        "bg-emerald-600 hover:bg-emerald-700",
    },
  },
  {
    nombre: "Inventario",
    descripcion:
      "Control de herramientas, materiales, existencias y responsables.",
    href: "/administracion/inventario",
    icono: Boxes,
    disponible: true,
    estilos: {
      borde: "border-orange-200",
      fondoIcono: "bg-orange-100",
      textoIcono: "text-orange-700",
      boton:
        "bg-orange-600 hover:bg-orange-700",
    },
  },
  {
    nombre: "Compras",
    descripcion:
      "Registro de proveedores, solicitudes, órdenes y costos.",
    href: "/administracion/compras",
    icono: ShoppingCart,
    disponible: true,
    estilos: {
      borde: "border-blue-200",
      fondoIcono: "bg-blue-100",
      textoIcono: "text-blue-700",
      boton:
        "bg-blue-600 hover:bg-blue-700",
    },
  },
  {
    nombre: "Reportes",
    descripcion:
      "Indicadores administrativos, productividad y rendimiento.",
    href: "/administracion/reportes",
    icono: ChartNoAxesCombined,
    disponible: true,
    estilos: {
      borde: "border-purple-200",
      fondoIcono: "bg-purple-100",
      textoIcono: "text-purple-700",
      boton:
        "bg-purple-600 hover:bg-purple-700",
    },
  },
];

export const dynamic = "force-dynamic";

export default async function AdministracionPage() {
  await requerirAdmin();

  return (
    <AppShell>
      <PageHeader
        title="Administración"
        description="Gestiona las áreas administrativas de AC911"
      />

      <section className="p-5 md:p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {modulos.map((modulo) => {
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