import { desc } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { clientes } from "@/db/schema";

import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
} from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function ClientesPage() {
  const listaClientes = db
    .select()
    .from(clientes)
    .orderBy(desc(clientes.id))
    .all();

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              Control de Trabajos
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Clientes
            </h1>

            <p className="mt-1 text-slate-500">
              Administra los clientes y sus direcciones.
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
            Registrar cliente
          </h2>

          <form
            action={crearCliente}
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
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
                placeholder="Nombre del cliente"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="telefono"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Teléfono
              </label>

              <input
                id="telefono"
                name="telefono"
                type="text"
                placeholder="5555-5555"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="direccion"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Dirección
              </label>

              <input
                id="direccion"
                name="direccion"
                type="text"
                placeholder="Zona, municipio o departamento"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Guardar cliente
              </button>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <label
                htmlFor="notas"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Notas
              </label>

              <textarea
                id="notas"
                name="notas"
                rows={3}
                placeholder="Referencias, contacto adicional u observaciones"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Clientes registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Total: {listaClientes.length}
            </p>
          </div>

          {listaClientes.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Todavía no hay clientes registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Nombre</th>
                    <th className="px-5 py-4">Teléfono</th>
                    <th className="px-5 py-4">Dirección</th>
                    <th className="px-5 py-4">Notas</th>
                    <th className="px-5 py-4">Activo</th>
                    <th className="px-5 py-4">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {listaClientes.map((cliente) => {
                    const formId = `cliente-${cliente.id}`;

                    return (
                      <tr
                        key={cliente.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <input
                            form={formId}
                            name="nombre"
                            required
                            defaultValue={cliente.nombre}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            form={formId}
                            name="telefono"
                            defaultValue={cliente.telefono ?? ""}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            form={formId}
                            name="direccion"
                            defaultValue={cliente.direccion ?? ""}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            form={formId}
                            name="notas"
                            defaultValue={cliente.notas ?? ""}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              form={formId}
                              name="activo"
                              type="checkbox"
                              defaultChecked={cliente.activo}
                              className="h-4 w-4"
                            />

                            {cliente.activo ? "Activo" : "Inactivo"}
                          </label>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <form
                              id={formId}
                              action={actualizarCliente}
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={cliente.id}
                              />
                            </form>

                            <button
                              form={formId}
                              type="submit"
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Guardar
                            </button>

                            <form action={eliminarCliente}>
                              <input
                                type="hidden"
                                name="id"
                                value={cliente.id}
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