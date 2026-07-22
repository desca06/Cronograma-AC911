import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  empleados,
  evidencias,
  trabajos,
  trabajoEmpleados,
  vehiculos,
} from "@/db/schema";
import { requerirSupervisor } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const coloresEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En camino": "bg-purple-100 text-purple-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Finalizado: "bg-emerald-100 text-emerald-800",
};

type HistorialClientePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HistorialClientePage({
  params,
}: HistorialClientePageProps) {
  await requerirSupervisor();

  const { id: clienteIdTexto } = await params;
  const clienteId = Number(clienteIdTexto);

  if (
    !Number.isInteger(clienteId) ||
    clienteId <= 0
  ) {
    notFound();
  }

  const [cliente] = await db
  .select({
    id: clientes.id,
    nombre: clientes.nombre,
    telefono: clientes.telefono,
    direccion: clientes.direccion,
  })
  .from(clientes)
  .where(eq(clientes.id, clienteId))
  .limit(1);

  if (!cliente) {
    notFound();
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
      observaciones: trabajos.observaciones,
      vehiculoNombre: vehiculos.nombre,
    })
    .from(trabajos)
    .leftJoin(
      vehiculos,
      eq(trabajos.vehiculoId, vehiculos.id),
    )
    .where(eq(trabajos.clienteId, clienteId))
    .orderBy(
      desc(trabajos.fecha),
      desc(trabajos.id),
    )

  const trabajosConDetalles = await Promise.all(
    listaTrabajos.map(async (trabajo) => {
      const empleadosAsignados = await db
        .select({
          id: empleados.id,
          nombre: empleados.nombre,
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
            trabajo.id,
          ),
        )

      const [contadorEvidencias] = await db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(evidencias)
        .where(
          eq(
            evidencias.trabajoId,
            trabajo.id,
          ),
        )
        .limit(1);

      return {
        ...trabajo,
        empleadosAsignados,
        totalEvidencias: Number(
          contadorEvidencias?.total ?? 0,
        ),
      };
    }),
  );

  const totalTrabajos =
    trabajosConDetalles.length;

  const totalFinalizados =
    trabajosConDetalles.filter(
      (trabajo) =>
        trabajo.estado === "Finalizado",
    ).length;

  const totalActivos =
    trabajosConDetalles.filter(
      (trabajo) =>
        trabajo.estado !== "Finalizado",
    ).length;

  return (
    <AppShell>
      <PageHeader
        title="Historial del cliente"
        description={`Registro completo de ${cliente.nombre}`}
      />

      <section className="space-y-7 p-5 md:p-8">
        <div>
          <Link
            href="/clientes"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Volver a clientes
          </Link>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">
                Cliente
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {cliente.nombre}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Teléfono
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {cliente.telefono ||
                  "Sin teléfono"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Dirección
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {cliente.direccion ||
                  "Sin dirección"}
              </p>
            </div>
          </div>
        </article>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total de trabajos
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalTrabajos}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">
              Finalizados
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {totalFinalizados}
            </p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-700">
              Pendientes o activos
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-900">
              {totalActivos}
            </p>
          </article>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Trabajos registrados
            </h2>

            <p className="text-sm text-slate-500">
              Ordenados del más reciente al más antiguo
            </p>
          </div>

          {trabajosConDetalles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Sin trabajos registrados
              </h3>

              <p className="mt-2 text-slate-500">
                Este cliente todavía no tiene trabajos
                en el sistema.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {trabajosConDetalles.map(
                (trabajo) => (
                  <article
                    key={trabajo.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-700">
                          Trabajo #{trabajo.id}
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-slate-900">
                          {trabajo.tipo}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {trabajo.fecha}

                          {trabajo.horaInicio
                            ? ` · ${trabajo.horaInicio}`
                            : ""}

                          {trabajo.horaFin
                            ? ` - ${trabajo.horaFin}`
                            : ""}
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

                    <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                      <div>
                        <p className="font-semibold text-slate-500">
                          Dirección del trabajo
                        </p>

                        <p className="mt-1 text-slate-800">
                          {trabajo.direccion ||
                            "Sin dirección"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-500">
                          Vehículo
                        </p>

                        <p className="mt-1 text-slate-800">
                          {trabajo.vehiculoNombre ||
                            "Sin vehículo asignado"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-500">
                          Empleados asignados
                        </p>

                        <p className="mt-1 text-slate-800">
                          {trabajo.empleadosAsignados
                            .length > 0
                            ? trabajo.empleadosAsignados
                                .map(
                                  (empleado) =>
                                    empleado.nombre,
                                )
                                .join(", ")
                            : "Sin empleados asignados"}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-500">
                          Evidencias
                        </p>

                        <p className="mt-1 text-slate-800">
                          {trabajo.totalEvidencias}{" "}
                          fotografía
                          {trabajo.totalEvidencias === 1
                            ? ""
                            : "s"}
                        </p>
                      </div>
                    </div>

                    {trabajo.observaciones && (
                      <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-600">
                          Observaciones
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {trabajo.observaciones}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                      <Link
                        href={`/evidencias/${trabajo.id}`}
                        className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200"
                      >
                        Ver evidencias
                      </Link>

                      <Link
                        href={`/trabajos/${trabajo.id}/editar`}
                        className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-200"
                      >
                        Editar trabajo
                      </Link>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}