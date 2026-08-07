import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Info,
  Smartphone,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { NotificacionesPushPanel } from "@/components/notificaciones-push-panel";
import { PageHeader } from "@/components/page-header";
import { requerirSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ConfiguracionNotificacionesPage() {
  await requerirSesion();

  return (
    <AppShell>
      <PageHeader
        title="Notificaciones"
        description="Configura las alertas externas de AC911 en este teléfono o computadora."
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href="/notificaciones"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Volver a notificaciones
        </Link>

        <div className="mx-auto max-w-5xl space-y-6">
          <article className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
                <BellRing size={24} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Alertas externas de AC911
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Cuando las activés, este dispositivo podrá
                  recibir avisos de trabajos asignados, cambios
                  importantes y otras notificaciones del sistema.
                </p>
              </div>
            </div>
          </article>

          <NotificacionesPushPanel />

          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Smartphone
                size={24}
                className="text-purple-600"
              />

              <h3 className="mt-3 font-bold text-slate-900">
                Android y computadora
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Abrí AC911 normalmente y presioná
                “Activar notificaciones”. El navegador pedirá
                permiso para mostrar las alertas.
              </p>
            </article>

            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <Info
                size={24}
                className="text-amber-700"
              />

              <h3 className="mt-3 font-bold text-amber-950">
                iPhone o iPad
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Primero agregá AC911 a la pantalla de inicio.
                Después abrilo desde el ícono instalado y activá
                las notificaciones desde esta pantalla.
              </p>
            </article>
          </div>
        </div>
      </section>
    </AppShell>
  );
}