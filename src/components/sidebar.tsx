"use client";

import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CarFront,
  ClipboardList,
  Contact,
  Gauge,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

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

  const [contraido, setContraido] =
    useState(false);

  const [
    menuMovilAbierto,
    setMenuMovilAbierto,
  ] = useState(false);

  const [
    configuracionCargada,
    setConfiguracionCargada,
  ] = useState(false);

  useEffect(() => {
    const valorGuardado =
      window.localStorage.getItem(
        "sidebar-contraido",
      );

    setContraido(
      valorGuardado === "true",
    );

    setConfiguracionCargada(true);
  }, []);

  useEffect(() => {
    if (!configuracionCargada) {
      return;
    }

    window.localStorage.setItem(
      "sidebar-contraido",
      String(contraido),
    );
  }, [
    configuracionCargada,
    contraido,
  ]);

  useEffect(() => {
    setMenuMovilAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuMovilAbierto) {
      return;
    }

    const cerrarConEscape = (
      evento: KeyboardEvent,
    ) => {
      if (evento.key === "Escape") {
        setMenuMovilAbierto(false);
      }
    };

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      cerrarConEscape,
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        cerrarConEscape,
      );
    };
  }, [menuMovilAbierto]);

  const opcionesPermitidas =
    opciones.filter((opcion) =>
      opcion.roles.includes(rol),
    );

  const alternarSidebar = () => {
    setContraido(
      (estadoAnterior) =>
        !estadoAnterior,
    );
  };

  return (
    <>
      {/* Barra superior para celular */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-white shadow-sm lg:hidden">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600">
            <Wrench size={20} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-300">
              Sistema
            </p>

            <p className="text-sm font-bold">
              Control de Trabajos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMenuMovilAbierto(true)
          }
          aria-label="Abrir menú"
          aria-expanded={
            menuMovilAbierto
          }
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 text-slate-200 transition hover:bg-slate-800 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Fondo oscuro del menú móvil */}
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={() =>
          setMenuMovilAbierto(false)
        }
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden ${
          menuMovilAbierto
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:shrink-0 lg:translate-x-0 lg:shadow-none lg:transition-[width] ${
          menuMovilAbierto
            ? "translate-x-0"
            : "-translate-x-full"
        } ${
          contraido
            ? "lg:w-[84px]"
            : "lg:w-[270px]"
        }`}
      >
        <div className="relative flex h-20 shrink-0 items-center border-b border-slate-800 px-5">
          <button
            type="button"
            onClick={alternarSidebar}
            title={
              contraido
                ? "Expandir menú"
                : "Contraer menú"
            }
            aria-label={
              contraido
                ? "Expandir menú"
                : "Contraer menú"
            }
            className={`flex min-w-0 items-center rounded-xl text-left transition hover:bg-slate-900 lg:p-1 ${
              contraido
                ? "lg:mx-auto"
                : ""
            }`}
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600">
              <Wrench size={22} />
            </div>

            <div
              className={`ml-3 min-w-0 transition-all duration-200 ${
                contraido
                  ? "lg:ml-0 lg:w-0 lg:overflow-hidden lg:opacity-0"
                  : "lg:w-[165px] lg:opacity-100"
              }`}
            >
              <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-blue-300">
                Sistema
              </p>

              <h2 className="whitespace-nowrap font-bold">
                Control de Trabajos
              </h2>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setMenuMovilAbierto(false)
            }
            aria-label="Cerrar menú"
            className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={21} />
          </button>

          <button
            type="button"
            onClick={alternarSidebar}
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
            className="absolute -right-3 top-7 hidden h-7 w-7 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-md transition hover:bg-blue-50 hover:text-blue-700 lg:grid"
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
              const Icono =
                opcion.icono;

              const activo =
                pathname ===
                  opcion.href ||
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
                      ? "lg:justify-center lg:px-0"
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

                  <span
                    className={`whitespace-nowrap transition-all duration-200 ${
                      contraido
                        ? "lg:w-0 lg:overflow-hidden lg:opacity-0"
                        : "lg:w-auto lg:opacity-100"
                    }`}
                  >
                    {opcion.nombre}
                  </span>
                </Link>
              );
            },
          )}
        </nav>

        <form
          action={cerrarSesion}
          className="shrink-0 border-t border-slate-800 p-3"
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
                ? "lg:justify-center lg:px-0"
                : "gap-3 px-3"
            }`}
          >
            <LogOut
              size={19}
              className="shrink-0"
            />

            <span
              className={`whitespace-nowrap transition-all duration-200 ${
                contraido
                  ? "lg:w-0 lg:overflow-hidden lg:opacity-0"
                  : "lg:w-auto lg:opacity-100"
              }`}
            >
              Cerrar sesión
            </span>
          </button>
        </form>
      </aside>
    </>
  );
}