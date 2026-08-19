import {
  asc,
  desc,
  eq,
} from "drizzle-orm";
import {
  ArrowLeft,
  Download,
  FileText,
  ImageIcon,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clienteAreas,
  clienteSubtiendas,
  clientes,
  empleados,
  evidencias,
  trabajoEmpleados,
  trabajoObservacionesTecnico,
  trabajos,
  usuarios,
  vehiculos,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatearFechaHora(
  fecha: Date | string,
) {
  const valor =
    fecha instanceof Date
      ? fecha
      : new Date(fecha);

  return new Intl.DateTimeFormat(
    "es-GT",
    {
      timeZone:
        "America/Guatemala",
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(valor);
}

const coloresEstado: Record<
  string,
  string
> = {
  Pendiente:
    "bg-amber-100 text-amber-800",
  "En camino":
    "bg-purple-100 text-purple-800",
  "En proceso":
    "bg-blue-100 text-blue-800",
  Finalizado:
    "bg-emerald-100 text-emerald-800",
  Cancelado:
    "bg-red-100 text-red-800",
};

export default async function ReporteTrabajoPage({
  params,
}: PageProps) {
  await requerirAdmin();

  const { id } = await params;
  const trabajoId = Number(id);

  if (
    !Number.isInteger(
      trabajoId,
    ) ||
    trabajoId <= 0
  ) {
    notFound();
  }

  const [trabajo] = await db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion:
        trabajos.descripcion,
      direccion:
        trabajos.direccion,
      estado: trabajos.estado,
      horaInicio:
        trabajos.horaInicio,
      horaFin:
        trabajos.horaFin,
      observacionesSupervisor:
        trabajos.observaciones,
      clienteNombre:
        clientes.nombre,
      clienteTelefono:
        clientes.telefono,
      subtiendaNombre:
        clienteSubtiendas.nombre,
      areaNombre:
        clienteAreas.nombre,
      vehiculoNombre:
        vehiculos.nombre,
      vehiculoPlaca:
        vehiculos.placa,
      firmaClienteUrl:
        trabajos.firmaClienteUrl,
      firmaClienteNombre:
        trabajos.firmaClienteNombre,
      firmaClienteEn:
        trabajos.firmaClienteEn,
    })
    .from(trabajos)
    .innerJoin(
      clientes,
      eq(
        trabajos.clienteId,
        clientes.id,
      ),
    )
    .leftJoin(
      clienteSubtiendas,
      eq(
        trabajos.subtiendaId,
        clienteSubtiendas.id,
      ),
    )
    .leftJoin(
      clienteAreas,
      eq(
        trabajos.areaId,
        clienteAreas.id,
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
      eq(
        trabajos.id,
        trabajoId,
      ),
    )
    .limit(1);

  if (!trabajo) {
    notFound();
  }

  const tecnicos = await db
    .select({
      id: empleados.id,
      nombre: empleados.nombre,
      puesto: empleados.puesto,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      empleados,
      eq(
        trabajoEmpleados.empleadoId,
        empleados.id,
      ),
    )
    .where(
      eq(
        trabajoEmpleados.trabajoId,
        trabajoId,
      ),
    )
    .orderBy(
      asc(empleados.nombre),
    );

  const historial =
    await db
      .select({
        id:
          trabajoObservacionesTecnico.id,
        observacion:
          trabajoObservacionesTecnico.observacion,
        estadoTrabajo:
          trabajoObservacionesTecnico.estadoTrabajo,
        creadoEn:
          trabajoObservacionesTecnico.creadoEn,
        autor:
          usuarios.nombre,
      })
      .from(
        trabajoObservacionesTecnico,
      )
      .leftJoin(
        usuarios,
        eq(
          trabajoObservacionesTecnico.usuarioId,
          usuarios.id,
        ),
      )
      .where(
        eq(
          trabajoObservacionesTecnico.trabajoId,
          trabajoId,
        ),
      )
      .orderBy(
        asc(
          trabajoObservacionesTecnico.creadoEn,
        ),
      );

  const listaEvidencias =
    await db
      .select({
        id: evidencias.id,
        archivoUrl:
          evidencias.archivoUrl,
        nombreOriginal:
          evidencias.nombreOriginal,
        descripcion:
          evidencias.descripcion,
        creadoEn:
          evidencias.creadoEn,
        autor:
          usuarios.nombre,
      })
      .from(evidencias)
      .leftJoin(
        usuarios,
        eq(
          evidencias.usuarioId,
          usuarios.id,
        ),
      )
      .where(
        eq(
          evidencias.trabajoId,
          trabajoId,
        ),
      )
      .orderBy(
        desc(
          evidencias.creadoEn,
        ),
      );

  return (
    <AppShell>
      <PageHeader
        title="Reporte de trabajo"
        description={`Trabajo #${trabajo.id} · ${trabajo.clienteNombre}`}
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/trabajos"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Volver a trabajos
          </Link>

          <Link
            href={`/trabajos/${trabajo.id}/editar`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Pencil size={17} />
            Editar trabajo
          </Link>

          <Link
            href={`/trabajos/${trabajo.id}/pdf`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <FileText size={17} />
            Ver PDF
          </Link>

          <Link
            href={`/trabajos/${trabajo.id}/pdf?download=1`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Download size={17} />
            Descargar PDF
          </Link>
        </div>

        <article className="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 bg-sky-950 p-6 text-white sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-300">
                TRABAJO #{trabajo.id}
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {trabajo.clienteNombre}
              </h2>

              <p className="mt-1 text-sky-100">
                {trabajo.tipo}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-xs font-bold ${
                coloresEstado[
                  trabajo.estado
                ] ??
                "bg-slate-100 text-slate-700"
              }`}
            >
              {trabajo.estado}
            </span>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <Dato
              titulo="Fecha"
              valor={trabajo.fecha}
            />

            <Dato
              titulo="Horario"
              valor={
                trabajo.horaInicio
                  ? `${trabajo.horaInicio}${trabajo.horaFin ? ` - ${trabajo.horaFin}` : ""}`
                  : "Sin definir"
              }
            />

            <Dato
              titulo="Subtienda"
              valor={
                trabajo.subtiendaNombre ||
                "Sin subtienda"
              }
            />

            <Dato
              titulo="Área"
              valor={
                trabajo.areaNombre ||
                "Sin área"
              }
            />

            <Dato
              titulo="Dirección"
              valor={
                trabajo.direccion ||
                "Sin dirección"
              }
            />

            <Dato
              titulo="Vehículo"
              valor={
                trabajo.vehiculoNombre
                  ? `${trabajo.vehiculoNombre}${trabajo.vehiculoPlaca ? ` · ${trabajo.vehiculoPlaca}` : ""}`
                  : "Sin vehículo"
              }
            />

            <Dato
              titulo="Teléfono cliente"
              valor={
                trabajo.clienteTelefono ||
                "No registrado"
              }
            />

            <Dato
              titulo="Personal asignado"
              valor={
                tecnicos.length
                  ? tecnicos
                      .map(
                        (item) =>
                          `${item.nombre} (${item.puesto})`,
                      )
                      .join(", ")
                  : "Sin personal asignado"
              }
            />
          </div>
        </article>

        <Seccion
          titulo="Descripción del trabajo"
        >
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {trabajo.descripcion}
          </p>
        </Seccion>

        <Seccion
          titulo="Indicaciones del supervisor"
        >
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {trabajo.observacionesSupervisor ||
              "El supervisor no agregó indicaciones."}
          </p>
        </Seccion>

        <Seccion
          titulo="Historial de observaciones técnicas"
        >
          {historial.length === 0 ? (
            <p className="text-sm text-slate-500">
              Todavía no hay observaciones registradas.
            </p>
          ) : (
            <div className="space-y-3">
              {historial.map(
                (registro) => (
                  <article
                    key={
                      registro.id
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-slate-900">
                        {registro.autor ||
                          "Técnico"}
                      </strong>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        {
                          registro.estadoTrabajo
                        }
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {
                        registro.observacion
                      }
                    </p>

                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {formatearFechaHora(
                        registro.creadoEn,
                      )}
                    </p>
                  </article>
                ),
              )}
            </div>
          )}
        </Seccion>

        <Seccion titulo="Firma del cliente">
          {trabajo.firmaClienteUrl ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">
                {trabajo.firmaClienteNombre || "Cliente"}
              </p>

              <img
                src={trabajo.firmaClienteUrl}
                alt="Firma del cliente"
                className="h-32 w-full max-w-md rounded-xl border border-slate-200 bg-white object-contain"
              />

              {trabajo.firmaClienteEn && (
                <p className="text-xs text-slate-500">
                  Firmado el{" "}
                  {formatearFechaHora(trabajo.firmaClienteEn)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Este trabajo todavía no tiene firma del cliente.
            </p>
          )}
        </Seccion>

        <Seccion
          titulo={`Evidencias (${listaEvidencias.length})`}
        >
          {listaEvidencias.length ===
          0 ? (
            <p className="text-sm text-slate-500">
              Este trabajo no tiene evidencias cargadas.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listaEvidencias.map(
                (evidencia) => (
                  <a
                    key={
                      evidencia.id
                    }
                    href={
                      evidencia.archivoUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-700">
                        <ImageIcon
                          size={20}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {
                            evidencia.nombreOriginal
                          }
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatearFechaHora(
                            evidencia.creadoEn,
                          )}
                        </p>
                      </div>
                    </div>

                    {evidencia.descripcion && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {
                          evidencia.descripcion
                        }
                      </p>
                    )}
                  </a>
                ),
              )}
            </div>
          )}
        </Seccion>
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
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">
        {titulo}
      </h3>

      {children}
    </article>
  );
}