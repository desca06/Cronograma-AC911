import type { ReactNode } from "react";

import { obtenerSesion } from "@/lib/auth";

import { Sidebar } from "./sidebar";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({
  children,
}: AppShellProps) {
  const sesion = await obtenerSesion();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[270px_1fr]">
      <Sidebar rol={sesion?.rol ?? ""} />

      <main className="min-w-0 bg-slate-100">
        {children}
      </main>
    </div>
  );
}