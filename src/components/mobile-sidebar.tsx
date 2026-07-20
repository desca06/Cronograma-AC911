"use client";

import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CarFront,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  Settings,
  UserCog,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cerrarSesion } from "@/app/login/actions";

type MobileSidebarProps = {
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

export function MobileSidebar({
  rol,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const opcionesPermitidas =
    opciones.filter((opcion) =>
      opcion.roles.includes(rol),
    );

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        overflowAnterior;
    };
  }, [abierto]);

  return (
    <div className="lg:hidden">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600">
            <Wrench size={20} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-300">
              Sistema
            </p>

            <p className="truncate text-sm font-bold">
              Control de Trabajos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 text-slate-200 active:bg-slate-800"
        >
          <Menu size={22} />
        </button>
      </header>

      <div
        aria-hidden="true"
        className="h-16"
      />

      {abierto && (
        <section
          className="fixed inset-0 flex flex-col bg-slate-950 text-white lg:hidden"
          style={{ zIndex: 9999 }}
        >
          <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600">
                <Wrench size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                  Sistema
                </p>

                <p className="truncate font-bold">
                  Control de Trabajos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-700 text-slate-300 active:bg-slate-800 active:text-white"
            >
              <X size={22} />
            </button>
          </header>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
            {opcionesPermitidas.map(
              (opcion) => {
                const Icono = opcion.icono;

                const activo =
                  pathname === opcion.href ||
                  pathname.startsWith(
                    `${opcion.href}/`,
                  );

                return (
                  <a
                    key={opcion.href}
                    href={opcion.href}
                    className={`flex min-h-14 items-center gap-4 rounded-xl px-4 text-base font-medium ${
                      activo
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 active:bg-slate-800 active:text-white"
                    }`}
                  >
                    <Icono
                      size={21}
                      className="shrink-0"
                    />

                    <span>
                      {opcion.nombre}
                    </span>
                  </a>
                );
              },
            )}
          </nav>

          <form
            action={cerrarSesion}
            className="shrink-0 border-t border-slate-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <button
              type="submit"
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-700 px-4 text-base font-semibold text-slate-300 active:border-red-500 active:bg-red-600 active:text-white"
            >
              <LogOut
                size={20}
                className="shrink-0"
              />

              <span>
                Cerrar sesión
              </span>
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
