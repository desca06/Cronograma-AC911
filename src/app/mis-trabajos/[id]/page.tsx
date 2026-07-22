import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  trabajos,
  trabajoEmpleados,
  usuarios,
  vehiculos,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

import { actualizarMiTrabajo } from "../actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const coloresEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En camino": "bg-purple-100 text-purple-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Finalizado: "bg-emerald-100 text-emerald-800",
};

type TrabajoAsignadoPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string | string[];
    exito?: string | string[];
  }>;
};

export default async function TrabajoAsignadoPage({
  params,
  searchParams,
}: TrabajoAsignadoPageProps) {
  const sesion = await requerirSesion();

  if (sesion.rol !== "TECNICO") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const trabajoId = Number(id);

  if (
    !Number.isInteger(trabajoId) ||
    trabajoId <= 0
  ) {
    redirect(
      "/mis-trabajos?error=no-encontrado",
    );
  }

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
    redirect(
      "/mis-trabajos?error=cuenta",
    );
  }

  /*
   * La consulta incluye la asignación del técnico.
   * Así nadie puede abrir un trabajo ajeno
   * escribiendo otro ID en la dirección.
   */
  const [trabajo] = await db
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

      observacionesTecnico:
        trabajos.observacionesTecnico,

      clienteNombre: clientes.nombre,
      vehiculoNombre: vehiculos.nombre,
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
        eq(trabajos.id, trabajoId),
      ),
    )
    .limit(1);

  if (!trabajo) {
    redirect(
      "/mis-trabajos?error=permiso",
    );
  }

  const mensajeError =
    error === "permiso"
      ? "No tienes permiso para modificar este trabajo."
      : error === "cuenta"
        ? "Tu cuenta no está vinculada con un empleado."
        : error === "no-encontrado"
          ? "El trabajo no fue encontrado."
          : error
            ? "No se pudo realizar la operación."
            : "";

  return (
    <AppShell>
      <PageHeader
        title="Trabajo asignado"
        description={`Consulta y actualiza el trabajo #${trabajo.id}`}
      />

      <section className="space-y-5 p-5 md:p-8">
        <Link
          href="/mis-trabajos"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Volver a mis trabajos
        </Link>

        {mensajeError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {mensajeError}
          </div>
        )}

        {exito === "actualizado" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            Trabajo actualizado correctamente.
          </div>
        )}

        {exito === "sin-cambios" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
            No había cambios nuevos para guardar.
          </div>
        )}

        <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                {trabajo.fecha}
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {trabajo.clienteNombre}
              </h2>

              <p className="mt-1 font-medium text-slate-700">
                {trabajo.tipo}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                coloresEstado[trabajo.estado] ??
                "bg-slate-100 text-slate-700"
              }`}
            >
              {trabajo.estado}
            </span>
          </div>

          <p className="mt-5 text-slate-700">
            {trabajo.descripcion}
          </p>

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
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
            Ver o subir evidencias
          </Link>

          <form
            action={actualizarMiTrabajo}
            className="mt-6 space-y-4 border-t border-slate-200 pt-5"
          >
            <input
              type="hidden"
              name="trabajoId"
              value={trabajo.id}
            />

            <input
              type="hidden"
              name="rutaRetorno"
              value={`/mis-trabajos/${trabajo.id}`}
            />

            <div>
              <label
                htmlFor={`estado-${trabajo.id}`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Estado del trabajo
              </label>

              <select
                id={`estado-${trabajo.id}`}
                name="estado"
                defaultValue={trabajo.estado}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="Pendiente">
                  Pendiente
                </option>

                <option value="En camino">
                  En camino
                </option>

                <option value="En proceso">
                  En proceso
                </option>

                <option value="Finalizado">
                  Finalizado
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor={`observaciones-tecnico-${trabajo.id}`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Observaciones del técnico
              </label>

              <textarea
                id={`observaciones-tecnico-${trabajo.id}`}
                name="observacionesTecnico"
                rows={4}
                defaultValue={
                  trabajo.observacionesTecnico ??
                  ""
                }
                placeholder="Escribe avances, problemas, materiales utilizados o resultados"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Guardar actualización
            </button>
          </form>
        </article>
      </section>
    </AppShell>
  );
}