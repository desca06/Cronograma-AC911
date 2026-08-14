import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  CircleDollarSign,
  Laptop,
  PackageSearch,
  Save,
} from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  articulosInventario,
  categoriasInventario,
} from "@/db/schema";
import { requerirInventario } from "@/lib/auth";
import { editarArticulo } from "@/app/administracion/inventario/articulos/actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

const mensajesError: Record<string, string> = {
  nombre: "Debes ingresar el nombre del artículo.",
  categoria: "Debes seleccionar una categoría válida.",
  "categoria-inactiva":
    "La categoría seleccionada está inactiva.",
  tipo: "Debes seleccionar el tipo de artículo.",
  unidad: "Debes ingresar la unidad de medida.",
  duplicado:
    "Ya existe otro artículo con ese nombre dentro de la categoría seleccionada.",
};

export default async function EditarArticuloPage({
  params,
  searchParams,
}: PageProps) {
  await requerirInventario();

  const { id } = await params;
  const parametros = await searchParams;

  const articuloId = Number(id);

  if (
    !Number.isInteger(articuloId) ||
    articuloId <= 0
  ) {
    notFound();
  }

  const resultadoArticulo = await db
    .select({
      id: articulosInventario.id,
      codigo: articulosInventario.codigo,
      nombre: articulosInventario.nombre,
      descripcion: articulosInventario.descripcion,
      categoriaId: articulosInventario.categoriaId,
      tipo: articulosInventario.tipo,
      unidadMedida: articulosInventario.unidadMedida,
      marca: articulosInventario.marca,
      modelo: articulosInventario.modelo,
      costoReferencia:
        articulosInventario.costoReferencia,
      stockMinimo: articulosInventario.stockMinimo,
      controlaStock:
        articulosInventario.controlaStock,
      estado: articulosInventario.estado,
    })
    .from(articulosInventario)
    .where(eq(articulosInventario.id, articuloId))
    .limit(1);

  const articulo = resultadoArticulo[0];

  if (!articulo) {
    notFound();
  }

  const categorias = await db
    .select({
      id: categoriasInventario.id,
      nombre: categoriasInventario.nombre,
      estado: categoriasInventario.estado,
    })
    .from(categoriasInventario)
    .orderBy(asc(categoriasInventario.nombre));

  const mensajeError = parametros.error
    ? mensajesError[parametros.error]
    : null;

  const costoEnQuetzales =
    (articulo.costoReferencia ?? 0) / 100;

  const editarArticuloConId =
    editarArticulo.bind(null, articulo.id);

  return (
    <AppShell>
      <PageHeader
        title="Editar artículo"
        description={`Actualiza la información de ${articulo.nombre}`}
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href="/administracion/inventario/articulos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={18} />
            Regresar a artículos
          </Link>
        </div>

        {mensajeError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {mensajeError}
          </div>
        )}

        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
              <PackageSearch size={22} />
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-700">
                Código del artículo
              </p>

              <p className="text-lg font-bold text-blue-950">
                {articulo.codigo}
              </p>
            </div>
          </div>
        </div>

        <form
          action={editarArticuloConId}
          className="space-y-6"
        >
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-6">
              <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                    <PackageSearch size={24} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Información general
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Datos principales para identificar el artículo.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="nombre"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Nombre del artículo
                    </label>

                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      maxLength={150}
                      defaultValue={articulo.nombre}
                      placeholder="Ejemplo: Laptop Dell Latitude"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="categoriaId"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Categoría
                    </label>

                    <select
                      id="categoriaId"
                      name="categoriaId"
                      required
                      defaultValue={String(
                        articulo.categoriaId,
                      )}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      {categorias.map((categoria) => (
                        <option
                          key={categoria.id}
                          value={categoria.id}
                          disabled={
                            categoria.estado !== "ACTIVO" &&
                            categoria.id !==
                              articulo.categoriaId
                          }
                        >
                          {categoria.nombre}
                          {categoria.estado !== "ACTIVO"
                            ? " — Inactiva"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="tipo"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Tipo de artículo
                    </label>

                    <select
                      id="tipo"
                      name="tipo"
                      required
                      defaultValue={articulo.tipo}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="ACTIVO">
                        Bien o activo
                      </option>

                      <option value="CONSUMIBLE">
                        Consumible
                      </option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="descripcion"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Descripción
                    </label>

                    <textarea
                      id="descripcion"
                      name="descripcion"
                      rows={4}
                      maxLength={500}
                      defaultValue={
                        articulo.descripcion ?? ""
                      }
                      placeholder="Descripción general, características o uso del artículo"
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                    <Laptop size={24} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Detalles del artículo
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Información adicional de identificación.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
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
                      maxLength={100}
                      defaultValue={articulo.marca ?? ""}
                      placeholder="Ejemplo: Dell"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
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
                      maxLength={100}
                      defaultValue={articulo.modelo ?? ""}
                      placeholder="Ejemplo: Latitude 5420"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="unidadMedida"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Unidad de medida
                    </label>

                    <input
                      id="unidadMedida"
                      name="unidadMedida"
                      type="text"
                      required
                      maxLength={30}
                      defaultValue={
                        articulo.unidadMedida
                      }
                      placeholder="Ejemplo: unidad, caja, resma"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="stockMinimo"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Stock mínimo
                    </label>

                    <input
                      id="stockMinimo"
                      name="stockMinimo"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={
                        articulo.stockMinimo ?? 0
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>
              </article>
            </div>

            <div className="space-y-6">
              <article className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CircleDollarSign size={24} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Costo y control
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Valor de referencia y manejo de existencias.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="costoReferencia"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Costo de referencia
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                        Q
                      </span>

                      <input
                        id="costoReferencia"
                        name="costoReferencia"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={costoEnQuetzales.toFixed(
                          2,
                        )}
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Valor aproximado por unidad.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                    <input
                      name="controlaStock"
                      type="checkbox"
                      defaultChecked={
                        articulo.controlaStock
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Controlar existencias
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        Permite registrar entradas, salidas y
                        disponibilidad del artículo.
                      </span>
                    </span>
                  </label>
                </div>
              </article>

              <article className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <div className="flex gap-3">
                  <Boxes
                    size={21}
                    className="mt-0.5 shrink-0 text-orange-700"
                  />

                  <div>
                    <h3 className="font-bold text-orange-900">
                      Existencias
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-orange-800">
                      Esta pantalla únicamente modifica los datos del
                      artículo. Las cantidades se administrarán desde
                      el módulo de existencias.
                    </p>
                  </div>
                </div>
              </article>

              <article
                className={`rounded-2xl border p-5 ${
                  articulo.estado === "ACTIVO"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    articulo.estado === "ACTIVO"
                      ? "text-emerald-800"
                      : "text-slate-700"
                  }`}
                >
                  Estado actual
                </p>

                <p
                  className={`mt-1 text-lg font-bold ${
                    articulo.estado === "ACTIVO"
                      ? "text-emerald-900"
                      : "text-slate-900"
                  }`}
                >
                  {articulo.estado}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  El estado se cambia desde el listado de artículos.
                </p>
              </article>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-end">
            <Link
              href="/administracion/inventario/articulos"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Save size={18} />
              Guardar cambios
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}