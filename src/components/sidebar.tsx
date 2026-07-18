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
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserCog,
  UsersRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import { cerrarSesion } from "@/app/login/actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
    configuracionCargada,
    setConfiguracionCargada,
  ] = useState(false);

  const [
    menuMovilAbierto,
    setMenuMovilAbierto,
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
      {/* BARRA SUPERIOR MÓVIL */}
      <div className="h-16 lg:hidden" />

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-white shadow-sm lg:hidden">
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

        <Sheet
          open={menuMovilAbierto}
          onOpenChange={setMenuMovilAbierto}
        >
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Abrir menú"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-950 text-slate-200 transition hover:bg-slate-800 hover:text-white"
              />
            }
          >
            <Menu size={22} />
          </SheetTrigger>

          <SheetContent
            side="left"
            showCloseButton
            className="flex h-dvh w-[88vw] max-w-[330px] flex-col border-r border-slate-800 bg-slate-950 p-0 text-white"
          >
            <SheetHeader className="border-b border-slate-800 p-5 text-left">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600">
                  <Wrench size={22} />
                </div>

                <div>
                  <SheetDescription className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                    Sistema
                  </SheetDescription>

                  <SheetTitle className="text-base font-bold text-white">
                    Control de Trabajos
                  </SheetTitle>
                </div>
              </div>
            </SheetHeader>

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
                      onClick={() =>
                        setMenuMovilAbierto(false)
                      }
                      className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium transition ${
                        activo
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icono
                        size={19}
                        className="shrink-0"
                      />

                      <span>
                        {opcion.nombre}
                      </span>
                    </Link>
                  );
                },
              )}
            </nav>

            <form
              action={cerrarSesion}
              className="shrink-0 border-t border-slate-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:border-red-500 hover:bg-red-600 hover:text-white"
              >
                <LogOut
                  size={19}
                  className="shrink-0"
                />

                <span>
                  Cerrar sesión
                </span>
              </button>
            </form>
          </SheetContent>
        </Sheet>
      </header>

      {/* SIDEBAR DE COMPUTADORA */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white transition-[width] duration-300 lg:flex ${
          contraido
            ? "w-[84px]"
            : "w-[270px]"
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
            className={`flex min-w-0 items-center rounded-xl p-1 text-left transition hover:bg-slate-900 ${
              contraido
                ? "mx-auto"
                : ""
            }`}
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600">
              <Wrench size={22} />
            </div>

            <div
              className={`ml-3 min-w-0 transition-all duration-200 ${
                contraido
                  ? "ml-0 w-0 overflow-hidden opacity-0"
                  : "w-[165px] opacity-100"
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
            className="absolute -right-3 top-7 grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-md transition hover:bg-blue-50 hover:text-blue-700"
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

                  <span
                    className={`whitespace-nowrap transition-all duration-200 ${
                      contraido
                        ? "w-0 overflow-hidden opacity-0"
                        : "w-auto opacity-100"
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
                ? "justify-center px-0"
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
                  ? "w-0 overflow-hidden opacity-0"
                  : "w-auto opacity-100"
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