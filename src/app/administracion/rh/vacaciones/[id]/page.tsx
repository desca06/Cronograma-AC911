import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit,
  Link2,
  UserRound,
  XCircle,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  empleados,
  usuarios,
  vacaciones,
} from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";
import {
  limpiarObservacionVacacion,
  obtenerPermisoOrigenId,
} from "@/lib/vacaciones";

import { BotonesAutorizacion } from "./botones-autorizacion";
import { BotonEliminar } from "./boton-eliminar";

export const dynamic = "force-dynamic";

type DetalleVacacionPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    aprobada?: string;
    rechazada?: string;
    actualizada?: string;
    error?: string;
    disponibles?: string;
    diasRestantes?: string;
  }>;
};

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, dia));
}

function formatearFechaHora(fecha: string) {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

function obtenerEstiloEstado(estado: string) {
  switch (estado) {
    case "APROBADA":
      return {
        texto: "Aprobada",
        clases:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        icono: CheckCircle2,
      };

    case "RECHAZADA":
      return {
        texto: "Rechazada",
        clases: "border-red-200 bg-red-50 text-red-700",
        icono: XCircle,
      };

    case "CANCELADA":
      return {
        texto: "Cancelada",
        clases:
          "border-slate-200 bg-slate-100 text-slate-700",
        icono: XCircle,
      };

    case "PENDIENTE":
    default:
      return {
        texto: "Pendiente",
        clases:
          "border-amber-200 bg-amber-50 text-amber-700",
        icono: Clock3,
      };
  }
}

export default async function DetalleVacacionPage({
  params,
  searchParams,
}: DetalleVacacionPageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;
  const vacacionId = Number(id);

  if (!Number.isInteger(vacacionId) || vacacionId <= 0) {
    notFound();
  }

  const resultado = await db
    .select({
      id: vacaciones.id,
      empleadoId: vacaciones.empleadoId,
      empleado: empleados.nombre,
      puesto: empleados.puesto,
      telefono: empleados.telefono,
      fechaInicio: vacaciones.fechaInicio,
      fechaFin: vacaciones.fechaFin,
      cantidadDias: vacaciones.cantidadDias,
      estado: vacaciones.estado,
      observacion: vacaciones.observacion,
      autorizadoPorId: vacaciones.autorizadoPor,
      autorizadoPorNombre: usuarios.nombre,
      creadoEn: vacaciones.creadoEn,
      actualizadoEn: vacaciones.actualizadoEn,
    })
    .from(vacaciones)
    .innerJoin(
      empleados,
      eq(vacaciones.empleadoId, empleados.id),
    )
    .leftJoin(
      usuarios,
      eq(vacaciones.autorizadoPor, usuarios.id),
    )
    .where(eq(vacaciones.id, vacacionId))
    .limit(1);

  const vacacion = resultado[0];

  if (!vacacion) {
    notFound();
  }

  const estado = obtenerEstiloEstado(vacacion.estado);
  const IconoEstado = estado.icono;
  const permisoOrigenId = obtenerPermisoOrigenId(
    vacacion.observacion,
  );
  const observacionVisible = limpiarObservacionVacacion(
    vacacion.observacion,
  );
  const esDescuentoAutomatico = permisoOrigenId !== null;

  return (
    <AppShell>
      <PageHeader
        title="Detalle de vacaciones"
        description="Información completa de la solicitud seleccionada."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-5xl">
          {parametros.aprobada === "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              La solicitud de vacaciones fue aprobada correctamente.
            </div>
          )}

          {parametros.rechazada === "true" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              La solicitud de vacaciones fue rechazada correctamente.
            </div>
          )}

          {parametros.actualizada === "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              La solicitud de vacaciones fue actualizada correctamente.
            </div>
          )}

          {parametros.error === "estado" && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              La solicitud ya fue procesada y no puede volver a aprobarse o rechazarse.
            </div>
          )}

          {parametros.error === "saldo" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Días insuficientes. Esta solicitud supera el saldo disponible del trabajador.
              {parametros.disponibles
                ? ` Actualmente tiene ${parametros.disponibles} día(s) disponible(s).`
                : ""}
            </div>
          )}

          {parametros.error === "agotadas" && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-sm font-bold text-red-800">
              Vacaciones agotadas. El trabajador ya utilizó sus 15 días hábiles y no puede aprobarse una nueva solicitud.
            </div>
          )}

          {parametros.error === "eliminar" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              La solicitud no pudo eliminarse. Solo se pueden eliminar solicitudes pendientes.
            </div>
          )}

          {parametros.error === "automatico" && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
              Este registro fue creado automáticamente por un permiso aprobado y no puede editarse manualmente.
            </div>
          )}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/administracion/rh/vacaciones"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={18} />
              Volver a vacaciones
            </Link>

            {!esDescuentoAutomatico && (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/administracion/rh/vacaciones/${vacacion.id}/editar`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <Edit size={17} />
                  Editar
                </Link>

                <BotonEliminar
                  vacacionId={vacacion.id}
                  empleado={vacacion.empleado}
                  permitido={vacacion.estado === "PENDIENTE"}
                />
              </div>
            )}
          </div>

          {esDescuentoAutomatico && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                    <Link2 size={22} />
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-900">
                      Registro histórico generado por un permiso
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      Este registro pertenece a la lógica anterior y fue creado automáticamente cuando se aprobó el permiso #{permisoOrigenId}.
                    </p>
                  </div>
                </div>

                <Link
                  href={`/administracion/rh/permisos/${permisoOrigenId}`}
                  className="inline-flex items-center justify-center rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Ver permiso
                </Link>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 md:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <UserRound size={27} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {vacacion.empleado}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {vacacion.puesto}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${estado.clases}`}
                >
                  <IconoEstado size={17} />
                  {estado.texto}
                </span>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
              <CampoDetalle
                titulo="Fecha de inicio"
                valor={formatearFecha(vacacion.fechaInicio)}
              />

              <CampoDetalle
                titulo="Fecha de finalización"
                valor={formatearFecha(vacacion.fechaFin)}
              />

              <CampoDetalle
                titulo="Cantidad de días"
                valor={`${vacacion.cantidadDias} ${
                  vacacion.cantidadDias === 1 ? "día" : "días"
                }`}
              />

              <CampoDetalle
                titulo="Origen"
                valor={
                  esDescuentoAutomatico
                    ? `Permiso #${permisoOrigenId}`
                    : "Solicitud de vacaciones"
                }
              />

              <CampoDetalle
                titulo="Teléfono"
                valor={vacacion.telefono || "No registrado"}
              />

              <CampoDetalle
                titulo="Autorizado por"
                valor={
                  vacacion.autorizadoPorNombre ||
                  "Todavía no autorizado"
                }
              />

              <CampoDetalle
                titulo="Fecha de registro"
                valor={formatearFechaHora(vacacion.creadoEn)}
              />

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Observación
                </p>

                <div className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {observacionVisible ||
                    "No se agregó ninguna observación."}
                </div>
              </div>
            </div>
          </div>

          {vacacion.estado === "PENDIENTE" && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <h3 className="font-bold text-amber-900">
                      Solicitud pendiente de autorización
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Esta solicitud todavía debe ser aprobada o rechazada por un administrador.
                    </p>
                  </div>
                </div>

                <BotonesAutorizacion
                  vacacionId={vacacion.id}
                  empleado={vacacion.empleado}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

type CampoDetalleProps = {
  titulo: string;
  valor: string;
};

function CampoDetalle({
  titulo,
  valor,
}: CampoDetalleProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 font-semibold text-slate-900">
        {valor}
      </p>
    </div>
  );
}