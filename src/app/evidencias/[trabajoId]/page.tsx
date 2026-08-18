import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { CierreTrabajo } from "@/components/cierre-trabajo";
import { db } from "@/db";
import {
  clientes,
  evidencias,
  trabajos,
  trabajoEmpleados,
  usuarios,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

import { subirEvidencia } from "./actions";
import { actualizarMiTrabajo } from "@/app/mis-trabajos/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EvidenciasPageProps = {
  params: Promise<{
    trabajoId: string;
  }>;

  searchParams: Promise<{
    error?: string | string[];
    exito?: string | string[];
  }>;
};

function formatearFechaHora(fecha: Date | string | null | undefined) {
  if (!fecha) return "";
  const valor = fecha instanceof Date ? fecha : new Date(fecha as any);
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(valor);
}

export default async function EvidenciasPage({
  params,
  searchParams,
}: EvidenciasPageProps) {
  const sesion = await requerirSesion();

  const { trabajoId: trabajoIdTexto } = await params;
  const parametros = await searchParams;

  const trabajoId = Number(trabajoIdTexto);

  if (
    !Number.isInteger(trabajoId) ||
    trabajoId <= 0
  ) {
    notFound();
  }

  const [trabajo] = await db
    .select({
      id: trabajos.id,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      fecha: trabajos.fecha,
      estado: trabajos.estado,
      clienteNombre: clientes.nombre,
      firmaCliente: trabajos.firmaCliente,
      firmaClienteNombre: trabajos.firmaClienteNombre,
      firmaClienteFecha: trabajos.firmaClienteFecha,
    })
    .from(trabajos)
    .innerJoin(
      clientes,
      eq(trabajos.clienteId, clientes.id),
    )
    .where(eq(trabajos.id, trabajoId))
    .limit(1);

  if (!trabajo) {
    notFound();
  }

  /*
   * Los supervisores pueden ver cualquier trabajo.
   * Los técnicos solo los trabajos que tengan asignados.
   */
  if (sesion.rol === "TECNICO") {
    const [usuario] = await db
      .select({
        empleadoId: usuarios.empleadoId,
      })
      .from(usuarios)
      .where(eq(usuarios.id, sesion.usuarioId))
      .limit(1);

    if (!usuario?.empleadoId) {
      redirect("/mis-trabajos?error=cuenta");
    }

    const [asignacion] = await db
      .select({
        trabajoId: trabajoEmpleados.trabajoId,
      })
      .from(trabajoEmpleados)
      .where(
        and(
          eq(
            trabajoEmpleados.trabajoId,
            trabajoId,
          ),
          eq(
            trabajoEmpleados.empleadoId,
            usuario.empleadoId,
          ),
        ),
      )
      .limit(1);

    if (!asignacion) {
      redirect("/mis-trabajos?error=permiso");
    }
  }

  const error =
    typeof parametros.error === "string"
      ? parametros.error
      : "";

  const exito =
    typeof parametros.exito === "string"
      ? parametros.exito
      : "";

  const listaEvidencias = await db
    .select({
      id: evidencias.id,
      archivoUrl: evidencias.archivoUrl,
      nombreOriginal: evidencias.nombreOriginal,
      descripcion: evidencias.descripcion,
      creadoEn: evidencias.creadoEn,
      usuarioNombre: usuarios.nombre,
    })
    .from(evidencias)
    .innerJoin(
      usuarios,
      eq(evidencias.usuarioId, usuarios.id),
    )
    .where(
      eq(evidencias.trabajoId, trabajoId),
    )
    .orderBy(desc(evidencias.id))
;

  const mensajeError =
    error === "archivo"
      ? "Selecciona una fotografía."
      : error === "formato"
        ? "Solo se permiten imágenes JPG, PNG o WebP."
        : error === "tamano"
          ? "La fotografía no puede superar los 5 MB."
          : error === "token"
            ? "Falta configurar BLOB_READ_WRITE_TOKEN en Vercel. Crea un Blob Store y vuelve a desplegar."
            : error === "almacenamiento"
              ? "No se pudo guardar la fotografía. Inténtalo de nuevo."
              : error === "base-datos"
                ? "La fotografía se subió, pero no se pudo registrar. Inténtalo de nuevo."
                : error === "firma-requerida"
                  ? "Para finalizar debes capturar la firma del cliente."
                  : error === "firma-invalida"
                    ? "Firma inválida. Intenta nuevamente."
                    : error === "firma-nombre"
                      ? "Ingresa el nombre del cliente que firma."
                      : error
                        ? "No se pudo subir la evidencia."
                        : "";

  const mensajeExito =
    exito === "subida"
      ? "Evidencia subida correctamente."
      : exito === "actualizado"
        ? "Trabajo actualizado correctamente."
        : exito === "finalizado-firma"
          ? "¡Trabajo finalizado con firma! Ya puedes ver el PDF con la firma del cliente."
          : exito === "firma-guardada"
            ? "Firma guardada correctamente."
            : "";

  const rutaRegreso =
    sesion.rol === "TECNICO"
      ? "/mis-trabajos"
      : "/trabajos";

  const puedeFinalizar = sesion.rol === "TECNICO";

  return (
    <AppShell>
      <PageHeader
        title="Evidencias fotográficas"
        description={`Trabajo #${trabajo.id} — ${trabajo.clienteNombre} · ${trabajo.estado}`}
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href={rutaRegreso}
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Volver
          </Link>

          {trabajo.estado === "Finalizado" && trabajo.firmaCliente && (
            <Link
              href={`/trabajos/${trabajo.id}/pdf`}
              target="_blank"
              className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              📄 Ver PDF con firma
            </Link>
          )}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">
                Cliente
              </p>

              <p className="font-bold text-slate-900">
                {trabajo.clienteNombre}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Tipo de trabajo
              </p>

              <p className="font-bold text-slate-900">
                {trabajo.tipo}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Fecha y estado
              </p>

              <p className="font-bold text-slate-900">
                {trabajo.fecha} — {trabajo.estado}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-600">
            {trabajo.descripcion}
          </p>

          {trabajo.firmaCliente && (
            <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-900">
                ✔ Firma de cliente registrada
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {trabajo.firmaClienteNombre}
              </p>
              <p className="text-xs text-slate-600">
                {trabajo.firmaClienteFecha
                  ? `Firmado el ${formatearFechaHora(trabajo.firmaClienteFecha)}`
                  : "Firma registrada"}
              </p>
              <img
                src={trabajo.firmaCliente}
                alt="Firma del cliente"
                className="mt-3 max-h-28 w-full rounded-lg border border-white bg-white object-contain"
              />
            </div>
          )}
        </article>

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

        {puedeFinalizar && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              {trabajo.estado === "Finalizado"
                ? trabajo.firmaCliente
                  ? "Actualizar firma / observación"
                  : "Agregar firma de cierre (trabajo ya finalizado sin firma)"
                : "Finalización del trabajo"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {trabajo.estado === "Finalizado"
                ? "Puedes agregar o reemplazar la firma del cliente aquí."
                : "Sube evidencias y luego finaliza el trabajo solicitando la firma del cliente. La firma aparecerá en el PDF."}
            </p>

            <CierreTrabajo
              trabajoId={trabajo.id}
              estadoActual={trabajo.estado}
              rutaRetorno={`/evidencias/${trabajo.id}`}
              formAction={actualizarMiTrabajo}
              firmaActual={trabajo.firmaCliente}
              nombreFirmaActual={trabajo.firmaClienteNombre}
              fechaFirmaActual={trabajo.firmaClienteFecha}
            />
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Subir evidencia
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Puedes subir fotografías JPG, PNG o WebP de
            hasta 5 MB.
          </p>

          <form
            action={subirEvidencia}
            encType="multipart/form-data"
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <input
              type="hidden"
              name="trabajoId"
              value={trabajo.id}
            />

            <div>
              <label
                htmlFor="foto"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Fotografía
              </label>

              <input
                id="foto"
                type="file"
                name="foto"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              />
            </div>

            <div>
              <label
                htmlFor="descripcion"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Descripción
              </label>

              <input
                id="descripcion"
                name="descripcion"
                placeholder="Ejemplo: instalación terminada"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Subir fotografía
              </button>
            </div>
          </form>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Galería de evidencias
            </h2>

            <p className="text-sm text-slate-500">
              Fotografías registradas:{" "}
              {listaEvidencias.length}
            </p>
          </div>

          {listaEvidencias.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Todavía no hay fotografías para este
              trabajo.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {listaEvidencias.map((evidencia) => (
                <article
                  key={evidencia.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <a
                    href={evidencia.archivoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={evidencia.archivoUrl}
                      alt={
                        evidencia.descripcion ||
                        evidencia.nombreOriginal
                      }
                      className="h-64 w-full object-cover"
                    />
                  </a>

                  <div className="space-y-2 p-5">
                    <p className="font-semibold text-slate-900">
                      {evidencia.descripcion ||
                        "Sin descripción"}
                    </p>

                    <p className="text-sm text-slate-500">
                      Subida por{" "}
                      {evidencia.usuarioNombre}
                    </p>

                    <p className="text-xs text-slate-400">
                      {evidencia.creadoEn}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
