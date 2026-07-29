import Link from "next/link";
import { desc } from "drizzle-orm";
import {
  Boxes,
  Pencil,
  Plus,
  Power,
  PowerOff,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { categoriasInventario } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";
import { cambiarEstadoCategoria } from "./actions";

type PageProps = {
  searchParams: Promise<{
    creada?: string;
    editada?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CategoriasPage({
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const categorias = await db
    .select()
    .from(categoriasInventario)
    .orderBy(desc(categoriasInventario.id));

  const categoriasActivas = categorias.filter(
    (categoria) => categoria.estado === "ACTIVO",
  ).length;

  const categoriasInactivas =
    categorias.length - categoriasActivas;

  return (
    <AppShell>
      <PageHeader
        title="Categorías de inventario"
        description="Organiza los materiales, equipos, repuestos y herramientas de AC911"
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <Boxes size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total de categorías
                </p>

                <p className="text-2xl font-bold text-blue-900">
                  {categorias.length}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Power size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Categorías activas
                </p>

                <p className="text-2xl font-bold text-green-900">
                  {categoriasActivas}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-700">
                <PowerOff size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Categorías inactivas
                </p>

                <p className="text-2xl font-bold text-red-900">
                  {categoriasInactivas}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Listado de categorías
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulta, edita, activa o desactiva las categorías
              del inventario.
            </p>
          </div>

          <Link
            href="/administracion/inventario/categorias/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Nueva categoría
          </Link>
        </div>

        {parametros.creada === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Categoría creada correctamente.
          </div>
        )}

        {parametros.editada === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Categoría actualizada correctamente.
          </div>
        )}

        {parametros.error === "id" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            La categoría seleccionada no es válida.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Categoría
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Descripción
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {categorias.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                        <Boxes size={26} />
                      </div>

                      <p className="mt-4 font-semibold text-slate-700">
                        No hay categorías registradas
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Crea la primera categoría para organizar el
                        inventario.
                      </p>
                    </td>
                  </tr>
                ) : (
                  categorias.map((categoria) => {
                    const activa =
                      categoria.estado === "ACTIVO";

                    const cambiarEstado =
                      cambiarEstadoCategoria.bind(
                        null,
                        categoria.id,
                      );

                    return (
                      <tr
                        key={categoria.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                              <Boxes size={20} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {categoria.nombre}
                              </p>

                              <p className="text-xs text-slate-400">
                                ID #{categoria.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-md px-6 py-4 text-sm leading-6 text-slate-600">
                          {categoria.descripcion ||
                            "Sin descripción"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                              activa
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {categoria.estado}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/administracion/inventario/categorias/editar/${categoria.id}`}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil size={16} />
                              Editar
                            </Link>

                            <form action={cambiarEstado}>
                              <button
                                type="submit"
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${
                                  activa
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                              >
                                {activa ? (
                                  <PowerOff size={16} />
                                ) : (
                                  <Power size={16} />
                                )}

                                {activa
                                  ? "Desactivar"
                                  : "Activar"}
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}