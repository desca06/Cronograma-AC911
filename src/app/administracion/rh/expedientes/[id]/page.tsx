import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Edit3,
  FileText,
  Hash,
  IdCard,
  MapPin,
  Phone,
  ShieldCheck,
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

import {
  DescargarPdfAutomatico,
} from "./descargar-pdf-automatico";

export const dynamic =
  "force-dynamic";

type ExpedienteDetallePageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    success?: string;
    pdf?: string;
  }>;
};

function formatearFecha(
  fecha: string,
) {
  return new Intl.DateTimeFormat(
    "es-GT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      `${fecha}T00:00:00Z`,
    ),
  );
}

function valor(
  texto: string | null,
) {
  return texto?.trim() ||
    "No registrado";
}

export default async function ExpedienteDetallePage({
  params,
  searchParams,
}: ExpedienteDetallePageProps) {
  await requerirAdmin();

  const { id } =
    await params;

  const parametros =
    await searchParams;

  const expedienteId =
    Number(id);

  if (
    !Number.isInteger(
      expedienteId,
    ) ||
    expedienteId <= 0
  ) {
    notFound();
  }

  const [expediente] =
    await db
      .select({
        id: expedientes.id,
        codigo:
          expedientes.codigo,
        fotoUrl:
          expedientes.fotoUrl,
        dpi: expedientes.dpi,
        nit: expedientes.nit,
        igss: expedientes.igss,
        fechaIngreso:
          expedientes.fechaIngreso,
        fechaSalida:
          expedientes.fechaSalida,
        contactoEmergencia:
          expedientes.contactoEmergencia,
        telefonoEmergencia:
          expedientes.telefonoEmergencia,
        direccion:
          expedientes.direccion,
        observaciones:
          expedientes.observaciones,
        estado:
          expedientes.estado,
        empleado:
          empleados.nombre,
        puesto:
          empleados.puesto,
      })
      .from(expedientes)
      .innerJoin(
        empleados,
        eq(
          expedientes.empleadoId,
          empleados.id,
        ),
      )
      .where(
        eq(
          expedientes.id,
          expedienteId,
        ),
      )
      .limit(1);

  if (!expediente) {
    notFound();
  }

  const descargarPdf =
    parametros.pdf === "1";

  return (
    <AppShell>
      <DescargarPdfAutomatico
        expedienteId={
          expediente.id
        }
        activar={
          descargarPdf
        }
      />

      <PageHeader
        title="Detalle del expediente"
        description={`Información laboral de ${expediente.empleado}.`}
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/administracion/rh/expedientes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft
                size={18}
              />
              Volver a expedientes
            </Link>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/administracion/rh/expedientes/${expediente.id}/editar`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Edit3
                  size={17}
                />
                Editar expediente
              </Link>

              <a
                href={`/administracion/rh/expedientes/${expediente.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <FileText
                  size={17}
                />
                Ver PDF
              </a>

              <a
                href={`/administracion/rh/expedientes/${expediente.id}/pdf?download=1`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Download
                  size={17}
                />
                Descargar PDF
              </a>
            </div>
          </div>

          {parametros.success ===
            "actualizado" && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Cambios guardados correctamente.
                {descargarPdf
                  ? " El PDF actualizado se descargará automáticamente."
                  : ""}
              </div>
            )}

          {parametros.success ===
            "creado" && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Expediente creado correctamente.
                {descargarPdf
                  ? " El PDF se descargará automáticamente."
                  : ""}
              </div>
            )}

          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[4/5] bg-slate-100">
                {expediente.fotoUrl ? (
                  <img
                    src={
                      expediente.fotoUrl
                    }
                    alt={`Fotografía de ${expediente.empleado}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <UserRound
                      size={78}
                    />
                  </div>
                )}
              </div>

              <div className="p-5">
                <p className="text-xl font-bold text-slate-900">
                  {
                    expediente.empleado
                  }
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {expediente.puesto}
                </p>

                <span
                  className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${expediente.estado ===
                      "ACTIVO"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-700"
                    }`}
                >
                  {expediente.estado ===
                    "ACTIVO"
                    ? "Activo"
                    : "Inactivo"}
                </span>
              </div>
            </aside>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Información del expediente
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Dato
                    icono={
                      <Hash
                        size={18}
                      />
                    }
                    etiqueta="Código"
                    valor={
                      expediente.codigo ??
                      "Sin código"
                    }
                  />

                  <Dato
                    icono={
                      <CalendarDays
                        size={18}
                      />
                    }
                    etiqueta="Fecha de ingreso"
                    valor={formatearFecha(
                      expediente.fechaIngreso,
                    )}
                  />

                  <Dato
                    icono={
                      <CalendarDays
                        size={18}
                      />
                    }
                    etiqueta="Fecha de salida"
                    valor={
                      expediente.fechaSalida
                        ? formatearFecha(
                          expediente.fechaSalida,
                        )
                        : "Sigue laborando"
                    }
                  />

                  <Dato
                    icono={
                      <IdCard
                        size={18}
                      />
                    }
                    etiqueta="DPI"
                    valor={
                      expediente.dpi
                    }
                  />

                  <Dato
                    icono={
                      <IdCard
                        size={18}
                      />
                    }
                    etiqueta="NIT"
                    valor={valor(
                      expediente.nit,
                    )}
                  />

                  <Dato
                    icono={
                      <ShieldCheck
                        size={18}
                      />
                    }
                    etiqueta="IGSS"
                    valor={valor(
                      expediente.igss,
                    )}
                  />

                  <Dato
                    icono={
                      <MapPin
                        size={18}
                      />
                    }
                    etiqueta="Dirección"
                    valor={
                      expediente.direccion
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Contacto de emergencia
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Dato
                    icono={
                      <UserRound
                        size={18}
                      />
                    }
                    etiqueta="Contacto"
                    valor={
                      expediente.contactoEmergencia
                    }
                  />

                  <Dato
                    icono={
                      <Phone
                        size={18}
                      />
                    }
                    etiqueta="Teléfono"
                    valor={
                      expediente.telefonoEmergencia
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Observaciones
                </h2>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {valor(
                    expediente.observaciones,
                  )}
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
  icono,
  etiqueta,
  valor,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icono}

        <span className="text-xs font-bold uppercase tracking-wide">
          {etiqueta}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {valor}
      </p>
    </div>
  );
}