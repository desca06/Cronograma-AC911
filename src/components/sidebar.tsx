"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  Car,
  House,
  Settings,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cerrarSesion } from "@/app/login/actions";

type SidebarProps = {
  rol: string;
};

const opciones = [
  {
    href: "/dashboard",
    nombre: "Dashboard",
    icono: House,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/trabajos",
    nombre: "Trabajos",
    icono: BriefcaseBusiness,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/cronograma",
    nombre: "Cronograma",
    icono: CalendarDays,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/empleados",
    nombre: "Empleados",
    icono: Users,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/clientes",
    nombre: "Clientes",
    icono: Users,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/vehiculos",
    nombre: "Vehículos",
    icono: Car,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/usuarios",
    nombre: "Usuarios",
    icono: UserCog,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/configuracion",
    nombre: "Configuración",
    icono: Settings,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/mis-trabajos",
    nombre: "Mis trabajos",
    icono: BriefcaseBusiness,
    roles: ["TECNICO"],
  },
];

export function Sidebar({
  rol,
}: SidebarProps) {
  const pathname = usePathname();

  const opcionesPermitidas =
    opciones.filter((opcion) =>
      opcion.roles.includes(rol),
    );

  return (
    <aside className="border-b border-slate-800 bg-slate-950 text-white lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600">
          <Wrench size={22} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Sistema
          </p>

          <h2 className="font-bold">
            Control de Trabajos
          </h2>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:overflow-visible">
        {opcionesPermitidas.map(
          (opcion) => {
            const Icono = opcion.icono;

            const activo =
              pathname === opcion.href ||
              pathname.startsWith(
                `${opcion.href}/`,
              );

            return (
              <Link
                key={opcion.href}
                href={opcion.href}
                className={`flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  activo
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icono size={19} />

                {opcion.nombre}
              </Link>
            );
          },
        )}
      </nav>

      <form
        action={cerrarSesion}
        className="px-4 pb-5"
      >
        <button
          type="submit"
          className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-red-600 hover:text-white"
        >
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}