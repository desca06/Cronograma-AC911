import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { categoriasInventario } from "@/db/schema";
import { cambiarEstadoCategoria } from "./actions";

type PageProps = {
  searchParams: Promise<{
    creada?: string;
    editada?: string;
    error?: string;
  }>;
};

export default async function CategoriasPage({
  searchParams,
}: PageProps) {
  const parametros = await searchParams;

  const categorias = await db
    .select()
    .from(categoriasInventario)
    .orderBy(desc(categoriasInventario.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Categorías de inventario
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Organiza los materiales, equipos, repuestos y
            herramientas del inventario.
          </p>
        </div>

        <Link
          href="/administracion/inventario/categorias/nueva"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Nueva categoría
        </Link>
      </div>

      {parametros.creada === "1" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Categoría creada correctamente.
        </div>
      )}

      {parametros.editada === "1" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Categoría actualizada correctamente.
        </div>
      )}

      {parametros.error === "id" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          La categoría seleccionada no es válida.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Descripción
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </th>

                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {categorias.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Todavía no hay categorías registradas.
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
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {categoria.nombre}
                        </div>
                      </td>

                      <td className="max-w-md px-6 py-4 text-sm text-slate-600">
                        {categoria.descripcion ||
                          "Sin descripción"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            activa
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {categoria.estado}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/administracion/inventario/categorias/editar/${categoria.id}`}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Editar
                          </Link>

                          <form action={cambiarEstado}>
                            <button
                              type="submit"
                              className={`rounded-lg px-3 py-2 text-sm font-medium text-white transition ${
                                activa
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
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
    </div>
  );
}