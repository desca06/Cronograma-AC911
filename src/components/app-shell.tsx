import type { ReactNode } from "react";

import { and, count, eq } from "drizzle-orm";
import { Bell } from "lucide-react";
import Link from "next/link";

import { db } from "@/db";
import { notificaciones } from "@/db/schema";
import { obtenerSesion } from "@/lib/auth";

import { Sidebar } from "./sidebar";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({
  children,
}: AppShellProps) {
  const sesion = await obtenerSesion();

  let notificacionesNoLeidas = 0;

  if (sesion) {
    const resultado = db
      .select({
        total: count(),
      })
      .from(notificaciones)
      .where(
        and(
          eq(
            notificaciones.usuarioId,
            sesion.usuarioId,
          ),
          eq(notificaciones.leida, false),
        ),
      )
      .get();

    notificacionesNoLeidas =
      resultado?.total ?? 0;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[270px_1fr]">
      <Sidebar rol={sesion?.rol ?? ""} />

      <main className="relative min-w-0 bg-slate-100">
        {sesion && (
          <Link
            href="/notificaciones"
            aria-label={`Notificaciones: ${notificacionesNoLeidas} sin leer`}
            title="Notificaciones"
            className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 md:right-7 md:top-5"
          >
            <Bell size={21} />

            {notificacionesNoLeidas > 0 && (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white">
                {notificacionesNoLeidas > 99
                  ? "99+"
                  : notificacionesNoLeidas}
              </span>
            )}
          </Link>
        )}

        {children}
      </main>
    </div>
  );
}