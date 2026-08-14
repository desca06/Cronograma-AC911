import {
  BellRing,
  Boxes,
  ChartNoAxesCombined,
  ShoppingCart,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdministracion } from "@/lib/auth";

const modulos = [
  {
    nombre: "Recursos Humanos",
    descripcion:
      "Gestiona empleados, asistencias, permisos, vacaciones y expedientes.",
    href: "/administracion/rh",
    icono: UsersRound,
    roles: ["ADMIN"],
    estilos: {
      borde: "border-emerald-200",
      fondoIcono: "bg-emerald-100",
      textoIcono: "text-emerald-700",
      boton: "bg-emerald-600 hover:bg-emerald-700",
    },
  },
  {
    nombre: "Inventario",
    descripcion:
      "Control de herramientas, materiales, existencias y responsables.",
    href: "/administracion/inventario",
    icono: Boxes,
    roles: ["ADMIN", "BODEGA"],
    estilos: {
      borde: "border-orange-200",
      fondoIcono: "bg-orange-100",
      textoIcono: "text-orange-700",
      boton: "bg-orange-600 hover:bg-orange-700",
    },
  },
  {
    nombre: "Compras",
    descripcion:
      "Registro de proveedores, solicitudes, órdenes y costos.",
    href: "/administracion/compras",
    icono: ShoppingCart,
    roles: ["ADMIN", "COTIZADORA"],
    estilos: {
      borde: "border-blue-200",
      fondoIcono: "bg-blue-100",
      textoIcono: "text-blue-700",
      boton: "bg-blue-600 hover:bg-blue-700",
    },
  },
  {
    nombre: "Reportes",
    descripcion:
      "Indicadores administrativos, productividad y rendimiento.",
    href: "/administracion/reportes",
    icono: ChartNoAxesCombined,
    roles: ["ADMIN", "COTIZADORA"],
    estilos: {
      borde: "border-purple-200",
      fondoIcono: "bg-purple-100",
      textoIcono: "text-purple-700",
      boton: "bg-purple-600 hover:bg-purple-700",
    },
  },
  {
    nombre: "Notificaciones Push",
    descripcion:
      "Supervisa qué usuarios tienen dispositivos registrados y quiénes aún deben activar las notificaciones.",
    href: "/administracion/notificaciones",
    icono: BellRing,
    roles: ["ADMIN"],
    estilos: {
      borde: "border-cyan-200",
      fondoIcono: "bg-cyan-100",
      textoIcono: "text-cyan-700",
      boton: "bg-cyan-600 hover:bg-cyan-700",
    },
  },
];

export const dynamic = "force-dynamic";

export default async function AdministracionPage() {
  const sesion = await requerirAdministracion();

  const modulosPermitidos = modulos.filter((modulo) =>
    modulo.roles.includes(sesion.rol),
  );

  return (
    <AppShell>
      <PageHeader
        title="Administración"
        description="Gestiona las áreas administrativas de AC911"
      />

      <section className="p-5 md:p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {modulosPermitidos.map((modulo) => {
            const Icono = modulo.icono;

            return (
              <article
                key={modulo.nombre}
                className={`relative flex min-h-[260px] flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${modulo.estilos.borde}`}
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
                  className={`mt-6 inline-flex w-fit rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${modulo.estilos.boton}`}
                >
                  Ingresar
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}