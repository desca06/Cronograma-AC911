import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  evidencias,
  trabajos,
  trabajoEmpleados,
  usuarios,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

import { subirEvidencia } from "../actions";

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

  const trabajo = db
    .select({
      id: trabajos.id,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      fecha: trabajos.fecha,
      estado: trabajos.estado,
      clienteNombre: clientes.nombre,
    })
    .from(trabajos)
    .innerJoin(
      clientes,
      eq(trabajos.clienteId, clientes.id),
    )
    .where(eq(trabajos.id, trabajoId))
    .get();

  if (!trabajo) {
    notFound();
  }

  /*
   * Los supervisores pueden ver cualquier trabajo.
   * Los técnicos solo los trabajos que tengan asignados.
   */
  if (sesion.rol === "TECNICO") {
    const usuario = db
      .select({
        empleadoId: usuarios.empleadoId,
      })
      .from(usuarios)
      .where(eq(usuarios.id, sesion.usuarioId))
      .get();

    if (!usuario?.empleadoId) {
      redirect("/mis-trabajos?error=cuenta");
    }

    const asignacion = db
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
      .get();

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

  const listaEvidencias = db
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
    .all();

  const mensajeError =
    error === "archivo"
      ? "Selecciona una fotografía."
      : error === "formato"
        ? "Solo se permiten imágenes JPG, PNG o WebP."
        : error === "tamano"
          ? "La fotografía no puede superar los 5 MB."
          : error
            ? "No se pudo subir la evidencia."
            : "";

  const rutaRegreso =
    sesion.rol === "TECNICO"
      ? "/mis-trabajos"
      : "/trabajos";

  return (
    <AppShell>
      <PageHeader
        title="Evidencias fotográficas"
        description={`Trabajo #${trabajo.id} — ${trabajo.clienteNombre}`}
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href={rutaRegreso}
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Volver
          </Link>
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
        </article>

        {mensajeError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {mensajeError}
          </div>
        )}

        {exito === "subida" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            Evidencia subida correctamente.
          </div>
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