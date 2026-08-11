import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FilePenLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  eq,
} from "drizzle-orm";
import {
  notFound,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  permisos,
  usuarios,
} from "@/db/schema";
import {
  requerirAdmin,
} from "@/lib/auth";

import {
  BotonesAutorizacion,
} from "./botones-autorizacion";
import {
  BotonEliminar,
} from "./boton-eliminar";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    aprobado?: string;
    rechazado?: string;
    actualizado?: string;
    error?: string;
    diasDescontados?: string;
    diasRestantes?: string;
    sinDescuento?: string;
  }>;
};

function formatearFecha(
  fecha: string,
) {
  const [
    anio,
    mes,
    dia,
  ] = fecha.split("-");

  if (
    !anio ||
    !mes ||
    !dia
  ) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

function nombreTipo(
  tipo: string,
) {
  const mapa:
    Record<string, string> =
    {
      PERSONAL:
        "Personal",
      CITA_MEDICA:
        "Cita médica",
      ENFERMEDAD:
        "Enfermedad",
    };

  return mapa[tipo] ?? tipo;
}

function claseEstado(
  estado: string,
) {
  if (
    estado === "APROBADO"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    estado === "RECHAZADO"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function DetallePermisoPage({
  params,
  searchParams,
}: Props) {
  await requerirAdmin();

  const { id } =
    await params;

  const parametros =
    await searchParams;

  const permisoId =
    Number(id);

  if (
    !Number.isInteger(
      permisoId,
    ) ||
    permisoId <= 0
  ) {
    notFound();
  }

  const [permiso] =
    await db
      .select({
        id: permisos.id,
        empleado:
          empleados.nombre,
        puesto:
          empleados.puesto,
        tipo:
          permisos.tipo,
        fecha:
          permisos.fecha,
        fechaFin:
          permisos.fechaFin,
        diasSolicitados:
          permisos.diasSolicitados,
        diasDescontadosVacaciones:
          permisos.diasDescontadosVacaciones,
        afectaVacaciones:
          permisos.afectaVacaciones,
        horaInicio:
          permisos.horaInicio,
        horaFin:
          permisos.horaFin,
        motivo:
          permisos.motivo,
        observacion:
          permisos.observacion,
        estado:
          permisos.estado,
        autorizador:
          usuarios.nombre,
      })
      .from(permisos)
      .innerJoin(
        empleados,
        eq(
          permisos.empleadoId,
          empleados.id,
        ),
      )
      .leftJoin(
        usuarios,
        eq(
          permisos.autorizadoPor,
          usuarios.id,
        ),
      )
      .where(
        eq(
          permisos.id,
          permisoId,
        ),
      )
      .limit(1);

  if (!permiso) {
    notFound();
  }

  const fechaFinal =
    permiso.fechaFin ??
    permiso.fecha;

  const diasDescontadosParametro =
    Number(
      parametros
        .diasDescontados ??
        permiso
          .diasDescontadosVacaciones,
    );

  const diasRestantesParametro =
    Number(
      parametros
        .diasRestantes ??
        0,
    );

  return (
    <AppShell>
      <PageHeader
        title="Detalle del permiso"
        description="Información completa de la solicitud."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/administracion/rh/permisos"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a permisos
          </Link>

          {parametros.aprobado ===
            "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              {parametros.sinDescuento ===
              "vacaciones-aprobadas"
                ? "Permiso aprobado. No descontó días porque el empleado ya tiene vacaciones aprobadas en este año."
                : `Permiso aprobado. Se descontaron ${diasDescontadosParametro} día(s) de la bolsa de vacaciones. Quedan ${diasRestantesParametro} día(s) disponibles.`}
            </div>
          )}

          {parametros.rechazado ===
            "true" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              Permiso rechazado. No se descontaron días de vacaciones.
            </div>
          )}

          {parametros.actualizado ===
            "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Permiso actualizado correctamente.
            </div>
          )}

          {parametros.error ===
            "saldo" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              No se puede aprobar: los días solicitados superan el saldo disponible de vacaciones.
            </div>
          )}

          {parametros.error ===
            "estado" && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              El permiso ya fue procesado.
            </div>
          )}

          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {
                    permiso.empleado
                  }
                </h2>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${claseEstado(
                    permiso.estado,
                  )}`}
                >
                  {
                    permiso.estado
                  }
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {permiso.puesto}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {permiso.estado ===
                "PENDIENTE" && (
                <>
                  <Link
                    href={`/administracion/rh/permisos/${permiso.id}/editar`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <FilePenLine size={17} />
                    Editar
                  </Link>

                  <BotonEliminar
                    permisoId={
                      permiso.id
                    }
                    empleado={
                      permiso.empleado
                    }
                    permitido
                  />
                </>
              )}

              <BotonesAutorizacion
                permisoId={
                  permiso.id
                }
                empleado={
                  permiso.empleado
                }
                permitido={
                  permiso.estado ===
                  "PENDIENTE"
                }
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Información del permiso
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Dato
                    titulo="Tipo"
                    valor={nombreTipo(
                      permiso.tipo,
                    )}
                  />

                  <Dato
                    titulo="Días hábiles"
                    valor={`${permiso.diasSolicitados} ${
                      permiso.diasSolicitados ===
                      1
                        ? "día"
                        : "días"
                    }`}
                  />

                  <Dato
                    titulo="Fecha inicial"
                    valor={formatearFecha(
                      permiso.fecha,
                    )}
                  />

                  <Dato
                    titulo="Fecha final"
                    valor={formatearFecha(
                      fechaFinal,
                    )}
                  />

                  <Dato
                    titulo="Horario"
                    valor={`${permiso.horaInicio.slice(
                      0,
                      5,
                    )} - ${permiso.horaFin.slice(
                      0,
                      5,
                    )}`}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-900">
                  Motivo
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {
                    permiso.motivo
                  }
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-900">
                  Observación
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {permiso.observacion ||
                    "No se registraron observaciones."}
                </p>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <UserRound
                    size={21}
                    className="text-blue-600"
                  />
                  <h3 className="font-bold text-slate-900">
                    Autorización
                  </h3>
                </div>

                <p className="mt-5 text-xs font-bold uppercase text-slate-500">
                  Autorizado por
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {permiso.autorizador ||
                    "Pendiente"}
                </p>
              </section>

              <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    size={21}
                    className="text-blue-700"
                  />
                  <h3 className="font-bold text-blue-950">
                    Impacto en vacaciones
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-6 text-blue-900">
                  {permiso.estado !==
                  "APROBADO"
                    ? "Se determinará al momento de aprobar el permiso."
                    : permiso.afectaVacaciones
                      ? `Este permiso descontó ${permiso.diasDescontadosVacaciones} día(s) de vacaciones.`
                      : "Este permiso no descontó vacaciones porque el empleado ya tenía vacaciones aprobadas en ese año."}
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Dato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 font-semibold text-slate-900">
        {valor}
      </p>
    </div>
  );
}