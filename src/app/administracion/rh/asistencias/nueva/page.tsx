import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { empleados } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

import { registrarAsistencia } from "../actions";

export const dynamic = "force-dynamic";

type NuevaAsistenciaPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NuevaAsistenciaPage({
  searchParams,
}: NuevaAsistenciaPageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const listaEmpleados = await db
    .select({
      id: empleados.id,
      nombre: empleados.nombre,
      puesto: empleados.puesto,
    })
    .from(empleados)
    .where(eq(empleados.activo, true))
    .orderBy(asc(empleados.nombre));

  return (
    <AppShell>
      <PageHeader
        title="Registrar asistencia"
        description="Registra la asistencia de un empleado de AC911"
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5">
            <Link
              href="/administracion/rh/asistencias"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={18} />
              Volver a asistencias
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            {parametros.error === "campos-requeridos" && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Completá el empleado, la fecha y el estado.
              </div>
            )}

            {parametros.error === "registro-duplicado" && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                Este empleado ya tiene una asistencia registrada para esa fecha.
              </div>
            )}

            <form action={registrarAsistencia} className="space-y-6">
              <div>
                <label
                  htmlFor="empleadoId"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Empleado
                </label>

                <select
                  id="empleadoId"
                  name="empleadoId"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Seleccioná un empleado
                  </option>

                  {listaEmpleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre} — {empleado.puesto}
                    </option>
                  ))}
                </select>

                {listaEmpleados.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    No hay empleados activos disponibles.
                  </p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="fecha"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Fecha
                  </label>

                  <input
                    id="fecha"
                    name="fecha"
                    type="date"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="estado"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Estado
                  </label>

                  <select
                    id="estado"
                    name="estado"
                    required
                    defaultValue="PRESENTE"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="PRESENTE">Presente</option>
                    <option value="TARDE">Tarde</option>
                    <option value="AUSENTE">Ausente</option>
                    <option value="PERMISO">Permiso</option>
                    <option value="VACACIONES">Vacaciones</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="horaEntrada"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Hora de entrada
                  </label>

                  <input
                    id="horaEntrada"
                    name="horaEntrada"
                    type="time"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="horaSalida"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Hora de salida
                  </label>

                  <input
                    id="horaSalida"
                    name="horaSalida"
                    type="time"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="observacion"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Observación
                </label>

                <textarea
                  id="observacion"
                  name="observacion"
                  rows={4}
                  placeholder="Ejemplo: llegó 15 minutos tarde..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <Link
                  href="/administracion/rh/asistencias"
                  className="inline-flex justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </Link>

                <button
                  type="submit"
                  disabled={listaEmpleados.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={18} />
                  Guardar asistencia
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}