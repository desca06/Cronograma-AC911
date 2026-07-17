import { asc, eq } from "drizzle-orm";
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

export default async function MisTrabajosPage({
  searchParams,
}: MisTrabajosPageProps) {
  const sesion = await requerirSesion();

  if (sesion.rol === "SUPERVISOR") {
    redirect("/dashboard");
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

  const usuario = db
    .select({
      empleadoId: usuarios.empleadoId,
    })
    .from(usuarios)
    .where(eq(usuarios.id, sesion.usuarioId))
    .get();

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
              Un supervisor debe vincular tu usuario con
              un empleado.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  const listaTrabajos = db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      direccion: trabajos.direccion,
      estado: trabajos.estado,
      horaInicio: trabajos.horaInicio,
      horaFin: trabajos.horaFin,
      observaciones: trabajos.observaciones,
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
      eq(trabajos.clienteId, clientes.id),
    )
    .leftJoin(
      vehiculos,
      eq(trabajos.vehiculoId, vehiculos.id),
    )
    .where(
      eq(
        trabajoEmpleados.empleadoId,
        usuario.empleadoId,
      ),
    )
    .orderBy(
      asc(trabajos.fecha),
      asc(trabajos.horaInicio),
    )
    .all();

  const mensajeError =
    error === "permiso"
      ? "No tienes permiso para modificar ese trabajo."
      : error === "cuenta"
        ? "Tu cuenta no está vinculada con un empleado."
        : error
          ? "No se pudo actualizar el trabajo."
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

        {exito === "actualizado" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            Trabajo actualizado correctamente.
          </div>
        )}

        {listaTrabajos.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              No tienes trabajos asignados
            </h2>

            <p className="mt-2 text-slate-500">
              Tus nuevas asignaciones aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {listaTrabajos.map((trabajo) => (
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

                <form
                  action={actualizarMiTrabajo}
                  className="mt-6 space-y-4 border-t border-slate-200 pt-5"
                >
                  <input
                    type="hidden"
                    name="trabajoId"
                    value={trabajo.id}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Estado del trabajo
                    </label>

                    <select
                      name="estado"
                      defaultValue={trabajo.estado}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Observaciones
                    </label>

                    <textarea
                      name="observaciones"
                      rows={3}
                      defaultValue={
                        trabajo.observaciones ?? ""
                      }
                      placeholder="Escribe avances, problemas o resultados"
                      className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Guardar actualización
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}