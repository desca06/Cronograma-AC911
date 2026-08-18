import {
  and,
  asc,
  desc,
  eq,
  inArray,
  ne,
} from "drizzle-orm";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { CierreTrabajo } from "@/components/cierre-trabajo";
import { db } from "@/db";
import {
  clientes,
  trabajos,
  trabajoEmpleados,
  trabajoObservacionesTecnico,
  usuarios,
  vehiculos,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

import { actualizarMiTrabajo } from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const coloresEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En camino": "bg-purple-100 text-purple-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Finalizado: "bg-emerald-100 text-emerald-800",
};

type MisTrabajosPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    exito?: string | string[];
  }>;
};

function formatearFechaHora(
  fecha: Date,
) {
  return new Intl.DateTimeFormat(
    "es-GT",
    {
      timeZone:
        "America/Guatemala",
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(fecha);
}

export default async function MisTrabajosPage({
  searchParams,
}: MisTrabajosPageProps) {
  const sesion = await requerirSesion();

  const parametros = await searchParams;

  const error =
    typeof parametros.error === "string"
      ? parametros.error
      : "";

  const exito =
    typeof parametros.exito === "string"
      ? parametros.exito
      : "";

  const [usuario] = await db
    .select({
      empleadoId: usuarios.empleadoId,
    })
    .from(usuarios)
    .where(
      eq(
        usuarios.id,
        sesion.usuarioId,
      ),
    )
    .limit(1);

  if (!usuario?.empleadoId) {
    return (
      <AppShell>
        <PageHeader
          title="Mis trabajos"
          description={`Bienvenido, ${sesion.nombre}`}
        />

        <section className="p-5 md:p-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-xl font-bold text-amber-900">
              Cuenta sin empleado vinculado
            </h2>

            <p className="mt-2 text-amber-700">
              Un supervisor debe vincular tu usuario
              con un empleado.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  const listaTrabajos = await db
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
      clienteNombre: clientes.nombre,
      vehiculoNombre: vehiculos.nombre,
      firmaCliente: trabajos.firmaCliente,
      firmaClienteNombre: trabajos.firmaClienteNombre,
      firmaClienteFecha: trabajos.firmaClienteFecha,
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
        ne(
          trabajos.estado,
          "Finalizado",
        ),
      ),
    )
    .orderBy(
      asc(trabajos.fecha),
      asc(trabajos.horaInicio),
    );

  const idsTrabajos =
    listaTrabajos.map(
      (trabajo) => trabajo.id,
    );

  const observaciones =
    idsTrabajos.length > 0
      ? await db
          .select({
            id:
              trabajoObservacionesTecnico.id,
            trabajoId:
              trabajoObservacionesTecnico.trabajoId,
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
            inArray(
              trabajoObservacionesTecnico.trabajoId,
              idsTrabajos,
            ),
          )
          .orderBy(
            desc(
              trabajoObservacionesTecnico.creadoEn,
            ),
          )
      : [];

  const observacionesPorTrabajo =
    new Map<
      number,
      typeof observaciones
    >();

  for (const observacion of observaciones) {
    const actuales =
      observacionesPorTrabajo.get(
        observacion.trabajoId,
      ) ?? [];

    actuales.push(observacion);

    observacionesPorTrabajo.set(
      observacion.trabajoId,
      actuales,
    );
  }

  const mensajeError =
    error === "permiso"
      ? "No tienes permiso para modificar ese trabajo."
      : error === "cuenta"
        ? "Tu cuenta no está vinculada con un empleado."
        : error === "no-encontrado"
          ? "El trabajo no fue encontrado."
          : error === "firma-requerida"
            ? "Para finalizar debes capturar la firma del cliente y su nombre."
            : error === "firma-invalida"
              ? "La firma capturada no es válida. Intenta firmar nuevamente."
              : error === "firma-nombre"
                ? "Debes ingresar el nombre completo del cliente que firma."
                : error
                  ? "No se pudo realizar la operación."
                  : "";

  const mensajeExito =
    exito === "actualizado"
      ? "Trabajo actualizado correctamente."
      : exito === "finalizado-firma"
        ? "¡Trabajo finalizado con firma del cliente! El PDF ya incluye la firma."
        : exito === "firma-guardada"
          ? "Firma del cliente guardada correctamente."
          : exito === "sin-cambios"
            ? "No había cambios nuevos para guardar."
            : "";

  return (
    <AppShell>
      <PageHeader
        title="Mis trabajos"
        description={`Bienvenido, ${sesion.nombre}. Consulta y actualiza tus asignaciones`}
      />

      <section className="space-y-6 p-5 md:p-8">
        {mensajeError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {mensajeError}
          </div>
        )}

        {mensajeExito && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {mensajeExito}
          </div>
        )}

        {listaTrabajos.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              No tienes trabajos asignados
            </h2>

            <p className="mt-2 text-slate-500">
              Tus nuevas asignaciones aparecerán aquí. Revisa el historial para ver finalizados.
            </p>

            <Link
              href="/historial"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              Ver historial
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {listaTrabajos.map((trabajo) => {
              const historial =
                observacionesPorTrabajo.get(
                  trabajo.id,
                ) ?? [];

              return (
                <article
                  key={trabajo.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-700">
                        {trabajo.fecha}
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {trabajo.clienteNombre}
                      </h2>

                      <p className="mt-1 font-medium text-slate-700">
                        {trabajo.tipo}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        coloresEstado[
                          trabajo.estado
                        ] ??
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {trabajo.estado}
                    </span>
                  </div>

                  <p className="mt-5 text-slate-700">
                    {trabajo.descripcion}
                  </p>

                  <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <p>
                      <strong>Hora:</strong>{" "}
                      {trabajo.horaInicio ||
                        "Sin definir"}
                      {trabajo.horaFin
                        ? ` - ${trabajo.horaFin}`
                        : ""}
                    </p>

                    <p>
                      <strong>Vehículo:</strong>{" "}
                      {trabajo.vehiculoNombre ||
                        "Sin vehículo"}
                    </p>

                    <p className="sm:col-span-2">
                      <strong>Dirección:</strong>{" "}
                      {trabajo.direccion ||
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

                  <Link
                    href={`/evidencias/${trabajo.id}`}
                    className="mt-6 block w-full rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    📸 Ver o subir evidencias
                  </Link>

                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Historial de observaciones
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Cada actualización queda guardada y no reemplaza las anteriores.
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        {historial.length}
                      </span>
                    </div>

                    {historial.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                        Todavía no hay observaciones del técnico.
                      </div>
                    ) : (
                      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                        {historial.map(
                          (registro) => (
                            <div
                              key={registro.id}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-bold text-slate-900">
                                  {registro.autor ||
                                    "Técnico"}
                                </p>

                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                                  {
                                    registro.estadoTrabajo
                                  }
                                </span>
                              </div>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {
                                  registro.observacion
                                }
                              </p>

                              <p className="mt-3 text-xs font-medium text-slate-500">
                                {formatearFechaHora(
                                  registro.creadoEn,
                                )}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nuevo componente de cierre con firma */}
                  <CierreTrabajo
                    trabajoId={trabajo.id}
                    estadoActual={trabajo.estado}
                    rutaRetorno="/mis-trabajos"
                    formAction={actualizarMiTrabajo}
                    firmaActual={trabajo.firmaCliente}
                    nombreFirmaActual={trabajo.firmaClienteNombre}
                    fechaFirmaActual={trabajo.firmaClienteFecha}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
