import Link from "next/link";
import {
  ArrowLeft,
} from "lucide-react";

import {
  ActivarNotificacionesPush,
} from "@/components/activar-notificaciones-push";
import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import {
  requerirSesion,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";

export default async function ActivarNotificacionesPage() {
  await requerirSesion();

  return (
    <AppShell>
      <PageHeader
        title="Notificaciones"
        description="Configura este dispositivo para recibir avisos de AC911."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft
              size={18}
            />
            Volver
          </Link>

          <ActivarNotificacionesPush />
        </div>
      </section>
    </AppShell>
  );
}