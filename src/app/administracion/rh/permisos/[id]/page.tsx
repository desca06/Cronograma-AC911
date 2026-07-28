import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FilePenLine,
  UserRound,
} from "lucide-react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  permisos,
  usuarios,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { BotonesAutorizacion } from "./botones-autorizacion";
import { BotonEliminar } from "./boton-eliminar";

export const dynamic = "force-dynamic";

type DetallePermisoPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    aprobado?: string;
    rechazado?: string;
    actualizado?: string;
    error?: string;
  }>;
};

function nombreTipo(tipo: string) {
  const tipos: Record<string, string> = {
    PERSONAL: "Personal",
    CITA_MEDICA: "Cita médica",
    ENFERMEDAD: "Enfermedad",
  };

  return tipos[tipo] ?? tipo;
}

function nombreEstado(estado: string) {
  if (estado === "APROBADO") {
    return "Aprobado";
  }

  if (estado === "RECHAZADO") {
    return "Rechazado";
  }

  return "Pendiente";
}

function claseEstado(estado: string) {
  if (estado === "APROBADO") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (estado === "RECHAZADO") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

function formatearHora(hora: string) {
  return hora.slice(0, 5);
}

export default async function DetallePermisoPage({
  params,
  searchParams,
}: DetallePermisoPageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;

  const permisoId = Number(id);

  if (
    !Number.isInteger(permisoId) ||
    permisoId <= 0
  ) {
    notFound();
  }

  const resultado = await db
    .select({
      id: permisos.id,
      empleadoId: permisos.empleadoId,
      empleado: empleados.nombre,
      puesto: empleados.puesto,
      tipo: permisos.tipo,
      fecha: permisos.fecha,
      horaInicio: permisos.horaInicio,
      horaFin: permisos.horaFin,
      motivo: permisos.motivo,
      observacion: permisos.observacion,
      estado: permisos.estado,
      autorizadoPor: permisos.autorizadoPor,
      autorizador: usuarios.nombre,
      creadoEn: permisos.creadoEn,
      actualizadoEn: permisos.actualizadoEn,
    })
    .from(permisos)
    .innerJoin(
      empleados,
      eq(permisos.empleadoId, empleados.id),
    )
    .leftJoin(
      usuarios,
      eq(permisos.autorizadoPor, usuarios.id),
    )
    .where(eq(permisos.id, permisoId))
    .limit(1);

  const permiso = resultado[0];

  if (!permiso) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        title="Detalle del permiso"
        description="Consulte la información completa de la solicitud."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/administracion/rh/permisos"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a permisos
          </Link>

          {parametros.aprobado === "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              El permiso fue aprobado correctamente.
            </div>
          )}

          {parametros.rechazado === "true" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El permiso fue rechazado correctamente.
            </div>
          )}

          {parametros.actualizado === "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              El permiso fue actualizado correctamente.
            </div>
          )}

          {parametros.error === "estado" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El permiso ya fue procesado y no puede cambiarse.
            </div>
          )}

          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {permiso.empleado}
                </h2>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${claseEstado(
                    permiso.estado,
                  )}`}
                >
                  {nombreEstado(permiso.estado)}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {permiso.puesto}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {permiso.estado === "PENDIENTE" &&(
                <>
                <Link
                  href={`/administracion/rh/permisos/${permiso.id}/editar`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <FilePenLine size={17} />
                  Editar
                </Link>

                <BotonEliminar
                  permisoId={permiso.id}
                  empleado={permiso.empleado}
                  permitido={true}
                  />
                </>
              )}

              <BotonesAutorizacion
                permisoId={permiso.id}
                empleado={permiso.empleado}
                permitido={permiso.estado === "PENDIENTE"}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Información del permiso
                </h3>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tipo
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {nombreTipo(permiso.tipo)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatearFecha(permiso.fecha)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Hora de inicio
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatearHora(
                        permiso.horaInicio,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Hora final
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatearHora(
                        permiso.horaFin,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Motivo
                </h3>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {permiso.motivo}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Observación
                </h3>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {permiso.observacion ||
                    "No se registraron observaciones."}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Resumen
                </h3>

                <div className="mt-5 space-y-5">
                  <div className="flex gap-3">
                    <UserRound
                      size={20}
                      className="mt-0.5 text-blue-600"
                    />

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Empleado
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {permiso.empleado}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CalendarDays
                      size={20}
                      className="mt-0.5 text-blue-600"
                    />

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Fecha
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatearFecha(
                          permiso.fecha,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock3
                      size={20}
                      className="mt-0.5 text-blue-600"
                    />

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Horario
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatearHora(
                          permiso.horaInicio,
                        )}{" "}
                        -{" "}
                        {formatearHora(
                          permiso.horaFin,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Autorización
                </h3>

                <p className="mt-4 text-sm text-slate-500">
                  Autorizado por
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {permiso.autorizador ||
                    "Pendiente de autorización"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}