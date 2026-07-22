import { asc } from "drizzle-orm";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { clientes } from "@/db/schema";
import { requerirSupervisor } from "@/lib/auth";

import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
} from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClientesPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    exito?: string | string[];
  }>;
};

export default async function ClientesPage({
  searchParams,
}: ClientesPageProps) {
  await requerirSupervisor();

  const parametros = await searchParams;

  const error =
    typeof parametros.error === "string"
      ? parametros.error
      : "";

  const exito =
    typeof parametros.exito === "string"
      ? parametros.exito
      : "";

  const listaClientes = await db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      telefono: clientes.telefono,
      direccion: clientes.direccion,
    })
    .from(clientes)
    .orderBy(asc(clientes.nombre))
;

  const mensajeError =
    error === "nombre"
      ? "Debes escribir el nombre del cliente."
      : error === "datos"
        ? "Los datos enviados no son válidos."
        : error === "no-encontrado"
          ? "El cliente no fue encontrado."
          : error === "trabajos"
            ? "No puedes eliminar este cliente porque tiene trabajos registrados."
            : error
              ? "No fue posible realizar la operación."
              : "";

  const mensajeExito =
    exito === "creado"
      ? "Cliente registrado correctamente."
      : exito === "actualizado"
        ? "Cliente actualizado correctamente."
        : exito === "eliminado"
          ? "Cliente eliminado correctamente."
          : "";

  return (
    <AppShell>
      <PageHeader
        title="Clientes"
        description="Registra clientes y consulta su historial de trabajos"
      />

      <main className="space-y-7 p-5 md:p-8">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Registrar cliente
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ingresa los datos básicos del cliente.
          </p>

          <form
            action={crearCliente}
            className="mt-6 grid gap-5 md:grid-cols-2"
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
                type="tel"
                placeholder="5555-5555"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="direccion"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Dirección
              </label>

              <input
                id="direccion"
                name="direccion"
                placeholder="Dirección del cliente"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Registrar cliente
              </button>
            </div>
          </form>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Clientes registrados
            </h2>

            <p className="text-sm text-slate-500">
              Total: {listaClientes.length}
            </p>
          </div>

          {listaClientes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-lg font-bold text-slate-900">
                No hay clientes registrados
              </h3>

              <p className="mt-2 text-slate-500">
                Registra el primer cliente utilizando el formulario.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {listaClientes.map((cliente) => (
                <article
                  key={cliente.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-semibold text-blue-700">
                    Cliente #{cliente.id}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {cliente.nombre}
                  </h3>

                  <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-slate-500">
                        Teléfono
                      </p>

                      <p className="mt-1 text-slate-800">
                        {cliente.telefono || "Sin teléfono"}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-500">
                        Dirección
                      </p>

                      <p className="mt-1 text-slate-800">
                        {cliente.direccion || "Sin dirección"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                    <Link
                      href={`/clientes/${cliente.id}/historial`}
                      className="rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 transition hover:bg-purple-200"
                    >
                      Ver historial
                    </Link>

                    <details>
                      <summary className="cursor-pointer list-none rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-200">
                        Editar
                      </summary>

                      <div className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <form
                          action={actualizarCliente}
                          className="grid gap-4 sm:grid-cols-2"
                        >
                          <input
                            type="hidden"
                            name="clienteId"
                            value={cliente.id}
                          />

                          <div>
                            <label
                              htmlFor={`nombre-${cliente.id}`}
                              className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                              Nombre
                            </label>

                            <input
                              id={`nombre-${cliente.id}`}
                              name="nombre"
                              required
                              defaultValue={cliente.nombre}
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`telefono-${cliente.id}`}
                              className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                              Teléfono
                            </label>

                            <input
                              id={`telefono-${cliente.id}`}
                              name="telefono"
                              type="tel"
                              defaultValue={cliente.telefono ?? ""}
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor={`direccion-${cliente.id}`}
                              className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                              Dirección
                            </label>

                            <input
                              id={`direccion-${cliente.id}`}
                              name="direccion"
                              defaultValue={cliente.direccion ?? ""}
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <button
                              type="submit"
                              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                            >
                              Guardar cambios
                            </button>
                          </div>
                        </form>
                      </div>
                    </details>

                    <form action={eliminarCliente}>
                      <input
                        type="hidden"
                        name="clienteId"
                        value={cliente.id}
                      />

                      <button
                        type="submit"
                        className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}