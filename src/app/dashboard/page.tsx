import { asc, eq } from "drizzle-orm";
import {
  BriefcaseBusiness,
  Car,
  CheckCircle2,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { db } from "@/db";
import {
  clientes,
  empleados,
  trabajos,
  trabajoEmpleados,
  vehiculos,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const coloresEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En camino": "bg-purple-100 text-purple-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Finalizado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-red-100 text-red-800",
};

function obtenerFechaHoy(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
  });
}

export default async function DashboardPage() {
  /*
   * Verifica que exista una sesión.
   * Los técnicos no pueden entrar al dashboard administrativo.
   */
  const sesion = await requerirSesion();

  if (sesion.rol === "TECNICO") {
    redirect("/mis-trabajos");
  }

  const fechaHoy = obtenerFechaHoy();

  /*
   * Empleados activos
   */
  const empleadosActivos = db
    .select({
      id: empleados.id,
    })
    .from(empleados)
    .where(eq(empleados.activo, true))
    .all();

  /*
   * Vehículos activos
   */
  const vehiculosActivos = db
    .select({
      id: vehiculos.id,
      estado: vehiculos.estado,
    })
    .from(vehiculos)
    .where(eq(vehiculos.activo, true))
    .all();

  /*
   * Trabajos programados para hoy
   */
  const listaTrabajosHoy = db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      estado: trabajos.estado,
      horaInicio: trabajos.horaInicio,
      clienteNombre: clientes.nombre,
      vehiculoNombre: vehiculos.nombre,
    })
    .from(trabajos)
    .innerJoin(
      clientes,
      eq(trabajos.clienteId, clientes.id),
    )
    .leftJoin(
      vehiculos,
      eq(trabajos.vehiculoId, vehiculos.id),
    )
    .where(eq(trabajos.fecha, fechaHoy))
    .orderBy(
      asc(trabajos.horaInicio),
      asc(trabajos.id),
    )
    .all();

  /*
   * Empleados asignados a los trabajos
   */
  const asignaciones = db
    .select({
      trabajoId: trabajoEmpleados.trabajoId,
      empleadoNombre: empleados.nombre,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      empleados,
      eq(trabajoEmpleados.empleadoId, empleados.id),
    )
    .all();

  const empleadosPorTrabajo =
    asignaciones.reduce<Record<number, string[]>>(
      (resultado, asignacion) => {
        if (!resultado[asignacion.trabajoId]) {
          resultado[asignacion.trabajoId] = [];
        }

        resultado[asignacion.trabajoId].push(
          asignacion.empleadoNombre,
        );

        return resultado;
      },
      {},
    );

  const trabajosFinalizados =
    listaTrabajosHoy.filter(
      (trabajo) =>
        trabajo.estado === "Finalizado",
    ).length;

  const vehiculosEnRuta =
    vehiculosActivos.filter(
      (vehiculo) =>
        vehiculo.estado === "En ruta",
    ).length;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description={`Bienvenido, ${sesion.nombre}. Resumen general de las operaciones del día`}
        action={
          <a
            href="/trabajos"
            className="mt-14 md:mt-12 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            + Nuevo trabajo
          </a>
        }
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Trabajos hoy"
            value={listaTrabajosHoy.length}
            helper="Trabajos programados para hoy"
            icon={BriefcaseBusiness}
          />

          <StatCard
            label="Empleados activos"
            value={empleadosActivos.length}
            helper="Personal disponible registrado"
            icon={Users}
          />

          <StatCard
            label="Vehículos en ruta"
            value={vehiculosEnRuta}
            helper={`${vehiculosActivos.length} vehículos activos`}
            icon={Car}
          />

          <StatCard
            label="Finalizados"
            value={trabajosFinalizados}
            helper={`De ${listaTrabajosHoy.length} trabajos del día`}
            icon={CheckCircle2}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Trabajos del día
              </h2>

              <p className="text-sm text-slate-500">
                Asignaciones y estado actual
              </p>
            </div>

            <a
              href="/cronograma"
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Ver cronograma completo
            </a>
          </div>

          {listaTrabajosHoy.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="font-bold text-slate-900">
                No hay trabajos programados hoy
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Crea un trabajo nuevo para que aparezca
                en el dashboard.
              </p>

              <a
                href="/trabajos"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Crear trabajo
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Cliente
                    </th>

                    <th className="px-5 py-4">
                      Trabajo
                    </th>

                    <th className="px-5 py-4">
                      Equipo
                    </th>

                    <th className="px-5 py-4">
                      Vehículo
                    </th>

                    <th className="px-5 py-4">
                      Hora
                    </th>

                    <th className="px-5 py-4">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {listaTrabajosHoy.map(
                    (trabajo) => (
                      <tr
                        key={trabajo.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {trabajo.clienteNombre}
                          </p>

                          <p className="text-xs text-slate-500">
                            Orden #{trabajo.id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {trabajo.tipo}
                          </p>

                          <p className="max-w-xs truncate text-xs text-slate-500">
                            {trabajo.descripcion}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {empleadosPorTrabajo[
                            trabajo.id
                          ]?.join(", ") ||
                            "Sin empleados"}
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {trabajo.vehiculoNombre ||
                            "Sin vehículo"}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {trabajo.horaInicio ||
                            "Sin definir"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              coloresEstado[
                                trabajo.estado
                              ] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {trabajo.estado}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}