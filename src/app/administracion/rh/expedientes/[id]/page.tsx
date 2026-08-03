import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ContactRound,
  Download,
  Edit,
  ExternalLink,
  FileText,
  Hash,
  HeartPulse,
  IdCard,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  expedientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { BotonEliminar } from "./boton-eliminar";

export const dynamic = "force-dynamic";

type ExpedienteDetallePageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    actualizado?: string;
  }>;
};

function formatearFecha(fecha: string | null) {
  if (!fecha) {
    return "No registrada";
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

function formatearFechaHora(fecha: string | null) {
  if (!fecha) {
    return "No registrada";
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

function claseEstado(estado: string) {
  if (estado === "ACTIVO") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function nombreEstado(estado: string) {
  if (estado === "ACTIVO") {
    return "Activo";
  }

  if (estado === "INACTIVO") {
    return "Inactivo";
  }

  return estado;
}

type CampoInformacionProps = {
  icono: React.ReactNode;
  titulo: string;
  valor: string | null | undefined;
};

function CampoInformacion({
  icono,
  titulo,
  valor,
}: CampoInformacionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
          {icono}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {titulo}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-900">
            {valor?.trim() || "No registrado"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ExpedienteDetallePage({
  params,
  searchParams,
}: ExpedienteDetallePageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;

  const expedienteId = Number(id);

  if (
    !Number.isInteger(expedienteId) ||
    expedienteId <= 0
  ) {
    notFound();
  }

  const resultado = await db
    .select({
      id: expedientes.id,
      codigo: expedientes.codigo,
      empleadoId: expedientes.empleadoId,
      empleadoNombre: empleados.nombre,
      empleadoPuesto: empleados.puesto,
      dpi: expedientes.dpi,
      nit: expedientes.nit,
      igss: expedientes.igss,
      fechaIngreso: expedientes.fechaIngreso,
      contactoEmergencia:
        expedientes.contactoEmergencia,
      telefonoEmergencia:
        expedientes.telefonoEmergencia,
      direccion: expedientes.direccion,
      observaciones: expedientes.observaciones,
      estado: expedientes.estado,
      creadoEn: expedientes.creadoEn,
      actualizadoEn: expedientes.actualizadoEn,
    })
    .from(expedientes)
    .innerJoin(
      empleados,
      eq(expedientes.empleadoId, empleados.id),
    )
    .where(eq(expedientes.id, expedienteId))
    .limit(1);

  const expediente = resultado[0];

  if (!expediente) {
    notFound();
  }

  const rutaPdf =
    `/administracion/rh/expedientes/${expediente.id}/pdf`;

  return (
    <AppShell>
      <PageHeader
        title={expediente.codigo ?? "Expediente"}
        description={`Información laboral y personal de ${expediente.empleadoNombre}.`}
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/administracion/rh/expedientes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={18} />
              Volver a expedientes
            </Link>

            <div className="flex flex-wrap gap-3">
              <Link
                href={rutaPdf}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <ExternalLink size={17} />
                Ver PDF
              </Link>

              <Link
                href={`${rutaPdf}?download=1`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Download size={17} />
                Descargar PDF
              </Link>

              <Link
                href={`/administracion/rh/expedientes/${expediente.id}/editar`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <Edit size={17} />
                Editar expediente
              </Link>

              <BotonEliminar
                expedienteId={expediente.id}
                codigo={expediente.codigo ?? "este expediente"}
              />
            </div>
          </div>

          {parametros.actualizado === "true" && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              El expediente fue actualizado correctamente.
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <UserRound size={28} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Empleado
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    {expediente.empleadoNombre}
                  </h2>

                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <BriefcaseBusiness size={15} />
                    {expediente.empleadoPuesto}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-bold ${claseEstado(
                  expediente.estado,
                )}`}
              >
                {nombreEstado(expediente.estado)}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                    <IdCard size={21} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-950">
                      Información personal
                    </h2>

                    <p className="text-sm text-slate-500">
                      Documentos y datos generales.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <CampoInformacion
                    icono={<Hash size={18} />}
                    titulo="Código"
                    valor={expediente.codigo}
                  />

                  <CampoInformacion
                    icono={<IdCard size={18} />}
                    titulo="DPI"
                    valor={expediente.dpi}
                  />

                  <CampoInformacion
                    icono={<FileText size={18} />}
                    titulo="NIT"
                    valor={expediente.nit}
                  />

                  <CampoInformacion
                    icono={<HeartPulse size={18} />}
                    titulo="Número de IGSS"
                    valor={expediente.igss}
                  />

                  <div className="sm:col-span-2">
                    <CampoInformacion
                      icono={<MapPin size={18} />}
                      titulo="Dirección"
                      valor={expediente.direccion}
                    />
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-red-100 p-2.5 text-red-700">
                    <ContactRound size={21} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-950">
                      Contacto de emergencia
                    </h2>

                    <p className="text-sm text-slate-500">
                      Persona de contacto en caso de emergencia.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <CampoInformacion
                    icono={<UserRound size={18} />}
                    titulo="Nombre"
                    valor={expediente.contactoEmergencia}
                  />

                  <CampoInformacion
                    icono={<Phone size={18} />}
                    titulo="Teléfono"
                    valor={expediente.telefonoEmergencia}
                  />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                    <FileText size={21} />
                  </div>

                  <h2 className="font-bold text-slate-950">
                    Observaciones
                  </h2>
                </div>

                <div className="min-h-24 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {expediente.observaciones?.trim() ||
                    "No hay observaciones registradas."}
                </div>
              </article>
            </div>

            <aside className="space-y-6">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
                    <CalendarDays size={21} />
                  </div>

                  <h2 className="font-bold text-slate-950">
                    Fechas
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha de ingreso
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatearFecha(
                        expediente.fechaIngreso,
                      )}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Expediente creado
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatearFechaHora(
                        expediente.creadoEn,
                      )}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Última actualización
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatearFechaHora(
                        expediente.actualizadoEn,
                      )}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <FileText
                  size={24}
                  className="text-blue-700"
                />

                <h2 className="mt-3 font-bold text-blue-950">
                  Expediente en PDF
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Generá el documento con los datos registrados,
                  un espacio reservado para la fotografía del
                  trabajador y áreas de firma para el empleado y
                  Recursos Humanos.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href={rutaPdf}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <ExternalLink size={17} />
                    Abrir PDF
                  </Link>

                  <Link
                    href={`${rutaPdf}?download=1`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Download size={17} />
                    Descargar expediente
                  </Link>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>
    </AppShell>
  );
}