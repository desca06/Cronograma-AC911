import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileText,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { asistencias, empleados } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type DetalleAsistenciaPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function obtenerEstiloEstado(estado: string) {
  switch (estado) {
    case "PRESENTE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "TARDE":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "AUSENTE":
      return "border-red-200 bg-red-50 text-red-700";

    case "PERMISO":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "VACACIONES":
      return "border-violet-200 bg-violet-50 text-violet-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function DetalleAsistenciaPage({
  params,
}: DetalleAsistenciaPageProps) {
  await requerirAdmin();

  const { id } = await params;
  const asistenciaId = Number(id);

  if (!Number.isInteger(asistenciaId) || asistenciaId <= 0) {
    notFound();
  }

  const registro = await db
    .select({
      id: asistencias.id,
      empleadoId: asistencias.empleadoId,
      empleado: empleados.nombre,
      puesto: empleados.puesto,
      fecha: asistencias.fecha,
      horaEntrada: asistencias.horaEntrada,
      horaSalida: asistencias.horaSalida,
      estado: asistencias.estado,
      observacion: asistencias.observacion,
      creadoEn: asistencias.creadoEn,
    })
    .from(asistencias)
    .innerJoin(
      empleados,
      eq(asistencias.empleadoId, empleados.id),
    )
    .where(eq(asistencias.id, asistenciaId))
    .limit(1);

  const asistencia = registro[0];

  if (!asistencia) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        title="Detalle de asistencia"
        description="Consulta la información completa del registro."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/administracion/rh/asistencias"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={18} />
              Volver a asistencias
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/administracion/rh/asistencias/${asistencia.id}/editar`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                <Pencil size={17} />
                Editar
              </Link>

              <button
                type="button"
                disabled
                title="Lo activaremos en el siguiente paso"
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white opacity-50"
              >
                <Trash2 size={17} />
                Eliminar
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Registro #{asistencia.id}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {asistencia.empleado}
                  </h2>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-4 py-1.5 text-xs font-bold ${obtenerEstiloEstado(
                    asistencia.estado,
                  )}`}
                >
                  {asistencia.estado}
                </span>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
              <Detalle
                icono={UserRound}
                etiqueta="Empleado"
                valor={asistencia.empleado}
              />

              <Detalle
                icono={BriefcaseBusiness}
                etiqueta="Puesto"
                valor={asistencia.puesto}
              />

              <Detalle
                icono={CalendarDays}
                etiqueta="Fecha"
                valor={asistencia.fecha}
              />

              <Detalle
                icono={Clock3}
                etiqueta="Hora de entrada"
                valor={asistencia.horaEntrada || "No registrada"}
              />

              <Detalle
                icono={Clock3}
                etiqueta="Hora de salida"
                valor={asistencia.horaSalida || "No registrada"}
              />

              <Detalle
                icono={CalendarDays}
                etiqueta="Fecha de creación"
                valor={asistencia.creadoEn || "No disponible"}
              />

              <div className="md:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <FileText size={18} />

                    <span className="text-xs font-bold uppercase tracking-wide">
                      Observación
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                    {asistencia.observacion || "Sin observaciones."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

type DetalleProps = {
  icono: React.ElementType;
  etiqueta: string;
  valor: string | number;
};

function Detalle({
  icono: Icono,
  etiqueta,
  valor,
}: DetalleProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icono size={18} />

        <span className="text-xs font-bold uppercase tracking-wide">
          {etiqueta}
        </span>
      </div>

      <p className="font-semibold text-slate-900">
        {valor}
      </p>
    </div>
  );
}