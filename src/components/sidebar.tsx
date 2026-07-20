"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CarFront,
  ClipboardList,
  Gauge,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserCog,
  UsersRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cerrarSesion } from "@/app/login/actions";

type SidebarProps = {
  rol: string;
};

const opciones = [
  {
    href: "/dashboard",
    nombre: "Dashboard",
    icono: Gauge,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/trabajos",
    nombre: "Trabajos",
    icono: ClipboardList,
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
    icono: UsersRound,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/clientes",
    nombre: "Clientes",
    icono: Building2,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/vehiculos",
    nombre: "Vehículos",
    icono: CarFront,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/usuarios",
    nombre: "Usuarios",
    icono: UserCog,
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

  const [contraido, setContraido] =
    useState(false);

  const [logoError, setLogoError] =
    useState(false);

  useEffect(() => {
    setContraido(
      window.localStorage.getItem(
        "sidebar-contraido",
      ) === "true",
    );
  }, []);

  const cambiarEstado = () => {
    setContraido((estadoActual) => {
      const nuevoEstado = !estadoActual;

      window.localStorage.setItem(
        "sidebar-contraido",
        String(nuevoEstado),
      );

      return nuevoEstado;
    });
  };

  const opcionesPermitidas =
    opciones.filter((opcion) =>
      opcion.roles.includes(rol),
    );

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white transition-[width] duration-300 lg:flex ${
        contraido
          ? "w-[84px]"
          : "w-[270px]"
      }`}
    >
      <div className="relative flex h-24 shrink-0 items-center border-b border-slate-800 px-3">
        <button
          type="button"
          onClick={cambiarEstado}
          aria-label={
            contraido
              ? "Expandir menú"
              : "Contraer menú"
          }
          title={
            contraido
              ? "Expandir menú"
              : "Contraer menú"
          }
          className={`flex min-w-0 items-center rounded-xl text-left transition hover:bg-slate-900 ${
            contraido
              ? "mx-auto p-1"
              : "w-full p-1"
          }`}
        >
          {contraido ? (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600">
              <Wrench size={22} />
            </div>
          ) : logoError ? (
            <div className="flex h-20 w-full items-center gap-3 rounded-xl bg-slate-900 px-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600">
                <Wrench size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                  Sistema
                </p>

                <p className="whitespace-nowrap font-bold">
                  Control de Trabajos
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-xl bg-transparent">
              <img
                src="/img/logo-ac911.jpeg"
                alt="Logo A-C911"
                className="h-full w-full object-cover"
                onError={() => setLogoError(true)}
              />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={cambiarEstado}
          aria-label={
            contraido
              ? "Expandir menú"
              : "Contraer menú"
          }
          title={
            contraido
              ? "Expandir menú"
              : "Contraer menú"
          }
          className="absolute -right-3 top-8 grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-md transition hover:bg-blue-50 hover:text-blue-700"
        >
          {contraido ? (
            <PanelLeftOpen size={15} />
          ) : (
            <PanelLeftClose size={15} />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                title={
                  contraido
                    ? opcion.nombre
                    : undefined
                }
                className={`flex min-h-12 items-center rounded-xl px-3 text-sm font-medium transition ${
                  contraido
                    ? "justify-center px-0"
                    : "gap-3"
                } ${
                  activo
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icono
                  size={19}
                  className="shrink-0"
                />

                {!contraido && (
                  <span>
                    {opcion.nombre}
                  </span>
                )}
              </Link>
            );
          },
        )}
      </nav>

      <form
        action={cerrarSesion}
        className="border-t border-slate-800 p-3"
      >
        <button
          type="submit"
          title={
            contraido
              ? "Cerrar sesión"
              : undefined
          }
          className={`flex min-h-12 w-full items-center rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 transition hover:border-red-500 hover:bg-red-600 hover:text-white ${
            contraido
              ? "justify-center"
              : "gap-3 px-3"
          }`}
        >
          <LogOut size={19} />

          {!contraido && (
            <span>
              Cerrar sesión
            </span>
          )}
        </button>
      </form>
    </aside>
  );
}
