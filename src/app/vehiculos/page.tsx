import { desc } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { vehiculos } from "@/db/schema";

import {
  actualizarVehiculo,
  crearVehiculo,
  eliminarVehiculo,
} from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function VehiculosPage() {
  const listaVehiculos = db
    .select()
    .from(vehiculos)
    .orderBy(desc(vehiculos.id))
    .all();

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              Cronogramas
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Vehículos
            </h1>

            <p className="mt-1 text-slate-500">
              Administra los vehículos utilizados por los equipos.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Volver al dashboard
          </Link>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Registrar vehículo
          </h2>

          <form
            action={crearVehiculo}
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <div>
              <label
                htmlFor="nombre"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nombre
              </label>

              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                placeholder="Ejemplo: Ratón"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="placa"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Placa
              </label>

              <input
                id="placa"
                name="placa"
                type="text"
                placeholder="P-123ABC"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="marca"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Marca
              </label>

              <input
                id="marca"
                name="marca"
                type="text"
                placeholder="Toyota"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="modelo"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Modelo
              </label>

              <input
                id="modelo"
                name="modelo"
                type="text"
                placeholder="Hilux 2022"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="estado"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Estado
              </label>

              <select
                id="estado"
                name="estado"
                defaultValue="Disponible"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="Disponible">Disponible</option>
                <option value="En ruta">En ruta</option>
                <option value="En mantenimiento">
                  En mantenimiento
                </option>
                <option value="Fuera de servicio">
                  Fuera de servicio
                </option>
              </select>
            </div>

            <div className="md:col-span-2 xl:col-span-5">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Guardar vehículo
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Vehículos registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Total: {listaVehiculos.length}
            </p>
          </div>

          {listaVehiculos.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Todavía no hay vehículos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Nombre</th>
                    <th className="px-5 py-4">Placa</th>
                    <th className="px-5 py-4">Marca</th>
                    <th className="px-5 py-4">Modelo</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Activo</th>
                    <th className="px-5 py-4">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {listaVehiculos.map((vehiculo) => {
                    const formId = `vehiculo-${vehiculo.id}`;

                    return (
                      <tr
                        key={vehiculo.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <input
                            form={formId}
                            name="nombre"
                            required
                            defaultValue={vehiculo.nombre}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            form={formId}
                            name="placa"
                            defaultValue={vehiculo.placa ?? ""}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            form={formId}
                            name="marca"
                            defaultValue={vehiculo.marca ?? ""}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            form={formId}
                            name="modelo"
                            defaultValue={vehiculo.modelo ?? ""}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <select
                            form={formId}
                            name="estado"
                            defaultValue={vehiculo.estado}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          >
                            <option value="Disponible">
                              Disponible
                            </option>

                            <option value="En ruta">
                              En ruta
                            </option>

                            <option value="En mantenimiento">
                              En mantenimiento
                            </option>

                            <option value="Fuera de servicio">
                              Fuera de servicio
                            </option>
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              form={formId}
                              name="activo"
                              type="checkbox"
                              defaultChecked={vehiculo.activo}
                              className="h-4 w-4"
                            />

                            {vehiculo.activo
                              ? "Activo"
                              : "Inactivo"}
                          </label>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <form
                              id={formId}
                              action={actualizarVehiculo}
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={vehiculo.id}
                              />
                            </form>

                            <button
                              form={formId}
                              type="submit"
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Guardar
                            </button>

                            <form action={eliminarVehiculo}>
                              <input
                                type="hidden"
                                name="id"
                                value={vehiculo.id}
                              />

                              <button
                                type="submit"
                                className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
                              >
                                Eliminar
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}