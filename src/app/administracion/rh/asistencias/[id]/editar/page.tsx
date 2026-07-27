import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { asistencias, empleados } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

import { editarAsistencia } from '@/app/administracion/rh/asistencias/actions';

export const dynamic = "force-dynamic";

type EditarAsistenciaPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditarAsistenciaPage({
  params,
  searchParams,
}: EditarAsistenciaPageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;
  const asistenciaId = Number(id);

  if (
    !Number.isInteger(asistenciaId) ||
    asistenciaId <= 0
  ) {
    notFound();
  }

  const registros = await db
    .select({
      id: asistencias.id,
      empleadoId: asistencias.empleadoId,
      fecha: asistencias.fecha,
      horaEntrada: asistencias.horaEntrada,
      horaSalida: asistencias.horaSalida,
      estado: asistencias.estado,
      observacion: asistencias.observacion,
    })
    .from(asistencias)
    .where(eq(asistencias.id, asistenciaId))
    .limit(1);

  const asistencia = registros[0];

  if (!asistencia) {
    notFound();
  }

  const listaEmpleados = await db
    .select({
      id: empleados.id,
      nombre: empleados.nombre,
      puesto: empleados.puesto,
      activo: empleados.activo,
    })
    .from(empleados)
    .orderBy(asc(empleados.nombre));

  const editarAsistenciaActual =
    editarAsistencia.bind(null, asistencia.id);

  return (
    <AppShell>
      <PageHeader
        title="Editar asistencia"
        description="Modifica la información del registro seleccionado."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5">
            <Link
              href={`/administracion/rh/asistencias/${asistencia.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={18} />
              Volver al detalle
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            {parametros.error === "campos-requeridos" && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Completá el empleado, la fecha y el
                estado.
              </div>
            )}

            {parametros.error === "registro-duplicado" && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                Ese empleado ya tiene otra asistencia
                registrada para la fecha seleccionada.
              </div>
            )}

            <form
              action={editarAsistenciaActual}
              className="space-y-6"
            >
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
                  defaultValue={String(
                    asistencia.empleadoId,
                  )}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {listaEmpleados.map((empleado) => (
                    <option
                      key={empleado.id}
                      value={empleado.id}
                    >
                      {empleado.nombre} — {empleado.puesto}
                      {!empleado.activo
                        ? " — Inactivo"
                        : ""}
                    </option>
                  ))}
                </select>
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
                    defaultValue={asistencia.fecha}
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
                    defaultValue={asistencia.estado}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="PRESENTE">
                      Presente
                    </option>

                    <option value="TARDE">
                      Tarde
                    </option>

                    <option value="AUSENTE">
                      Ausente
                    </option>

                    <option value="PERMISO">
                      Permiso
                    </option>

                    <option value="VACACIONES">
                      Vacaciones
                    </option>
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
                    defaultValue={
                      asistencia.horaEntrada ?? ""
                    }
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
                    defaultValue={
                      asistencia.horaSalida ?? ""
                    }
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
                  defaultValue={
                    asistencia.observacion ?? ""
                  }
                  placeholder="Agregá una observación..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <Link
                  href={`/administracion/rh/asistencias/${asistencia.id}`}
                  className="inline-flex justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </Link>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  <Save size={18} />
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}