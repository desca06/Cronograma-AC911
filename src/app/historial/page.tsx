import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  trabajos,
  trabajoEmpleados,
  usuarios,
  vehiculos,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HistorialPage() {
  const sesion = await requerirSesion();

  if (sesion.rol === "SUPERVISOR") {
    redirect("/dashboard");
  }

  const usuario = db
    .select({
      empleadoId: usuarios.empleadoId,
    })
    .from(usuarios)
    .where(eq(usuarios.id, sesion.usuarioId))
    .get();

  if (!usuario?.empleadoId) {
    return (
      <AppShell>
        <PageHeader
          title="Historial"
          description="Trabajos finalizados"
        />

        <section className="p-5 md:p-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-xl font-bold text-amber-900">
              Cuenta sin empleado vinculado
            </h2>

            <p className="mt-2 text-amber-700">
              Un supervisor debe vincular tu usuario con un empleado.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  const historial = db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      direccion: trabajos.direccion,
      estado: trabajos.estado,
      horaInicio: trabajos.horaInicio,
      horaFin: trabajos.horaFin,
      observacionesSupervisor:
        trabajos.observaciones,
      observacionesTecnico:
        trabajos.observacionesTecnico,
      clienteNombre: clientes.nombre,
      vehiculoNombre: vehiculos.nombre,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      trabajos,
      eq(
        trabajoEmpleados.trabajoId,
        trabajos.id,
      ),
    )
    .innerJoin(
      clientes,
      eq(
        trabajos.clienteId,
        clientes.id,
      ),
    )
    .leftJoin(
      vehiculos,
      eq(
        trabajos.vehiculoId,
        vehiculos.id,
      ),
    )
    .where(
      and(
        eq(
          trabajoEmpleados.empleadoId,
          usuario.empleadoId,
        ),
        eq(
          trabajos.estado,
          "Finalizado",
        ),
      ),
    )
    .orderBy(
      asc(trabajos.fecha),
      asc(trabajos.horaInicio),
    )
    .all();

  return (
    <AppShell>
      <PageHeader
        title="Historial"
        description="Consulta todos tus trabajos finalizados."
      />

      <section className="space-y-6 p-5 md:p-8">

        <div className="grid gap-4 sm:grid-cols-2">

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

            <p className="text-sm font-semibold text-emerald-700">
              Trabajos finalizados
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {historial.length}
            </p>

          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-semibold text-slate-500">
              Estado
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              Historial del técnico
            </p>

          </article>

        </div>

        {historial.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

            <div className="text-5xl">
              📋
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No hay trabajos finalizados
            </h2>

            <p className="mt-2 text-slate-500">
              Cuando finalices un trabajo aparecerá aquí.
            </p>

          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
                        {historial.map((trabajo) => (
              <article
                key={trabajo.id}
                className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      {trabajo.fecha}
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {trabajo.clienteNombre}
                    </h2>

                    <p className="mt-1 font-medium text-slate-700">
                      {trabajo.tipo}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    ✔ Finalizado
                  </span>
                </div>

                <p className="mt-5 text-slate-700">
                  {trabajo.descripcion}
                </p>

                <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <p>
                    <strong>Hora:</strong>{" "}
                    {trabajo.horaInicio || "Sin definir"}
                    {trabajo.horaFin
                      ? ` - ${trabajo.horaFin}`
                      : ""}
                  </p>

                  <p>
                    <strong>Vehículo:</strong>{" "}
                    {trabajo.vehiculoNombre ??
                      "Sin vehículo"}
                  </p>

                  <p className="sm:col-span-2">
                    <strong>Dirección:</strong>{" "}
                    {trabajo.direccion ??
                      "Sin dirección"}
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-900">
                    Indicaciones del supervisor
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                    {trabajo.observacionesSupervisor ||
                      "El supervisor no agregó indicaciones."}
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-bold text-blue-900">
                    Observaciones del técnico
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-900">
                    {trabajo.observacionesTecnico ||
                      "No se agregaron observaciones."}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/evidencias/${trabajo.id}`}
                    className="flex-1 rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    📂 Ver evidencias
                  </Link>

                  <Link
                    href={`/cronograma?trabajoId=${trabajo.id}`}
                    className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800"
                  >
                    👀 Ver detalles
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}