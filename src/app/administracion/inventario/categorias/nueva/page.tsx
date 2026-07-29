import Link from "next/link";
import { ArrowLeft, Save, Tags } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";
import { crearCategoria } from "../actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function NuevaCategoriaPage({
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  return (
    <AppShell>
      <PageHeader
        title="Nueva categoría"
        description="Registra una categoría para organizar los artículos del inventario"
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5">
            <Link
              href="/administracion/inventario/categorias"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
            >
              <ArrowLeft size={18} />
              Volver a categorías
            </Link>
          </div>

          {parametros.error === "nombre" && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              El nombre de la categoría es obligatorio.
            </div>
          )}

          {parametros.error === "duplicada" && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Ya existe una categoría con ese nombre.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                  <Tags size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Información de la categoría
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Completa los datos principales para registrar la categoría.
                  </p>
                </div>
              </div>
            </div>

            <form action={crearCategoria} className="space-y-6 p-6">
              <div>
                <label
                  htmlFor="nombre"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nombre de la categoría
                </label>

                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Ejemplo: Refrigerantes"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="descripcion"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={5}
                  maxLength={300}
                  placeholder="Ejemplo: Gases utilizados para la carga y mantenimiento de equipos de aire acondicionado."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <Link
                  href="/administracion/inventario/categorias"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </Link>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Save size={18} />
                  Guardar categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}