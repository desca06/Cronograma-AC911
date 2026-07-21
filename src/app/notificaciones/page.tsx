import { desc, eq } from "drizzle-orm";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  notificaciones,
  trabajos,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

import {
  eliminarNotificacion,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "./actions";

import { BotonEliminarNotificacion } from "@/components/boton-eliminar-notificacion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const estilosTipo: Record<string, string> = {
  ASIGNACION:
    "bg-blue-100 text-blue-800",
  ACTUALIZACION:
    "bg-purple-100 text-purple-800",
  ESTADO:
    "bg-amber-100 text-amber-800",
  CANCELACION:
    "bg-red-100 text-red-800",
};

export default async function NotificacionesPage() {
  const sesion = await requerirSesion();

  const listaNotificaciones = db
    .select({
      id: notificaciones.id,
      trabajoId: notificaciones.trabajoId,
      titulo: notificaciones.titulo,
      mensaje: notificaciones.mensaje,
      tipo: notificaciones.tipo,
      leida: notificaciones.leida,
      creadoEn: notificaciones.creadoEn,
      trabajoTipo: trabajos.tipo,
      trabajoFecha: trabajos.fecha,
    })
    .from(notificaciones)
    .leftJoin(
      trabajos,
      eq(
        notificaciones.trabajoId,
        trabajos.id,
      ),
    )
    .where(
      eq(
        notificaciones.usuarioId,
        sesion.usuarioId,
      ),
    )
    .orderBy(desc(notificaciones.id))
    .all();

  const totalSinLeer =
    listaNotificaciones.filter(
      (notificacion) => !notificacion.leida,
    ).length;

  const rutaRegreso =
    sesion.rol === "TECNICO"
      ? "/mis-trabajos"
      : "/dashboard";

  return (
    <AppShell>
      <PageHeader
        title="Notificaciones"
        description={`Tienes ${totalSinLeer} notificación${
          totalSinLeer === 1 ? "" : "es"
        } sin leer`}
      />

      <main className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={rutaRegreso}
            className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Volver
          </Link>

          {totalSinLeer > 0 && (
            <form action={marcarTodasLeidas}>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Marcar todas como leídas
              </button>
            </form>
          )}
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {listaNotificaciones.length}
            </p>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-700">
              Sin leer
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {totalSinLeer}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">
              Leídas
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {listaNotificaciones.length -
                totalSinLeer}
            </p>
          </article>
        </section>

        {listaNotificaciones.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="text-5xl">
              🔔
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No tienes notificaciones
            </h2>

            <p className="mt-2 text-slate-500">
              Las nuevas asignaciones y cambios en tus
              trabajos aparecerán aquí.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {listaNotificaciones.map(
              (notificacion) => (
                <article
                  key={notificacion.id}
                  className={`rounded-2xl border p-5 shadow-sm ${
                    notificacion.leida
                      ? "border-slate-200 bg-white"
                      : "border-blue-300 bg-blue-50"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          notificacion.leida
                            ? "bg-slate-100"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        🔔
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-slate-900">
                            {notificacion.titulo}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              estilosTipo[
                                notificacion.tipo
                              ] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {notificacion.tipo}
                          </span>

                          {!notificacion.leida && (
                            <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                              Nueva
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-slate-700">
                          {notificacion.mensaje}
                        </p>

                        {notificacion.trabajoTipo && (
                          <p className="mt-3 text-sm text-slate-500">
                            <strong>Trabajo:</strong>{" "}
                            {notificacion.trabajoTipo}
                            {notificacion.trabajoFecha
                              ? ` · ${notificacion.trabajoFecha}`
                              : ""}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-slate-400">
                          {notificacion.creadoEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {notificacion.trabajoId && (
                        <Link
                          href={
                            sesion.rol === "TECNICO"
                              ? `/mis-trabajos/${notificacion.trabajoId}`
                              : `/cronograma?trabajoId=${notificacion.trabajoId}`
                          }
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Ver trabajo
                        </Link>
                      )}

                      {!notificacion.leida && (
                        <form
                          action={marcarNotificacionLeida}
                        >
                          <input
                            type="hidden"
                            name="notificacionId"
                            value={notificacion.id}
                          />

                          <button
                            type="submit"
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Marcar como leída
                          </button>
                        </form>
                      )}

                      <BotonEliminarNotificacion
                        notificacionId={notificacion.id}
                        titulo={notificacion.titulo}
                        action={eliminarNotificacion}
                      />
                    </div>
                  </div>
                </article>
              ),
            )}
          </section>
        )}
      </main>
    </AppShell>
  );
}