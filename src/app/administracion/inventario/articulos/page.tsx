import Link from "next/link";
import {
  Boxes,
  CircleDollarSign,
  Laptop,
  Package,
  Pencil,
  Plus,
  Power,
  PowerOff,
  ArrowLeft
} from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  articulosInventario,
  categoriasInventario,
  existenciasInventario,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";
import { cambiarEstadoArticulo } from "./actions";

type PageProps = {
  searchParams: Promise<{
    creado?: string;
    editado?: string;
    estado?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatearDinero(valorEnCentavos: number | null) {
  const valor = (valorEnCentavos ?? 0) / 100;

  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(valor);
}

export default async function ArticulosPage({
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const articulos = await db
    .select({
      id: articulosInventario.id,
      codigo: articulosInventario.codigo,
      nombre: articulosInventario.nombre,
      descripcion: articulosInventario.descripcion,
      tipo: articulosInventario.tipo,
      unidadMedida: articulosInventario.unidadMedida,
      marca: articulosInventario.marca,
      modelo: articulosInventario.modelo,
      costoReferencia: articulosInventario.costoReferencia,
      stockMinimo: articulosInventario.stockMinimo,
      controlaStock: articulosInventario.controlaStock,
      estado: articulosInventario.estado,
      categoriaNombre: categoriasInventario.nombre,
      cantidadActual: existenciasInventario.cantidadActual,
      cantidadReservada: existenciasInventario.cantidadReservada,
    })
    .from(articulosInventario)
    .leftJoin(
      categoriasInventario,
      eq(
        articulosInventario.categoriaId,
        categoriasInventario.id,
      ),
    )
    .leftJoin(
      existenciasInventario,
      eq(
        articulosInventario.id,
        existenciasInventario.articuloId,
      ),
    )
    .orderBy(desc(articulosInventario.id));

  const articulosActivos = articulos.filter(
    (articulo) => articulo.estado === "ACTIVO",
  ).length;

  const activosFijos = articulos.filter(
    (articulo) => articulo.tipo === "ACTIVO",
  ).length;

  const consumibles = articulos.filter(
    (articulo) => articulo.tipo === "CONSUMIBLE",
  ).length;

  const valorReferencia = articulos.reduce(
    (total, articulo) => total + Number(articulo.costoReferencia) * Number(articulo.cantidadActual),
    0,
  );

  return (
    <AppShell>
      <PageHeader
        title="Artículos de inventario"
        description="Administra los activos, suministros y materiales del área administrativa de AC911"
      />
      <section className="space-y-6 p-5 md:p-8">
        <div>
        <Link
          href="/administracion/inventario"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
            Regresar a Inventario
        </Link>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <Package size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total de artículos
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {articulos.length}
                </p>

                <p className="text-xs text-slate-400">
                  {articulosActivos} activos
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                <Laptop size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Bienes y activos
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {activosFijos}
                </p>

                <p className="text-xs text-slate-400">
                  Equipo administrativo
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                <Boxes size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Consumibles
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {consumibles}
                </p>

                <p className="text-xs text-slate-400">
                  Papelería y suministros
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CircleDollarSign size={24} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  Valor total de Inventario
                </p>

                <p className="truncate text-xl font-bold text-slate-900">
                  {formatearDinero(valorReferencia)}
                </p>

                <p className="text-xs text-slate-400">
                  Suma del catálogo
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Listado de artículos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulta y administra los artículos registrados en
              el inventario administrativo.
            </p>
          </div>

          <Link
            href="/administracion/inventario/articulos/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Nuevo artículo
          </Link>
        </div>

        {parametros.creado === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Artículo registrado correctamente.
          </div>
        )}

        {parametros.editado === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Artículo actualizado correctamente.
          </div>
        )}

        {parametros.estado === "1" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Estado del artículo actualizado correctamente.
          </div>
        )}

        {parametros.error === "id" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            El artículo seleccionado no existe o no es válido.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Artículo
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Categoría
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tipo
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Existencia
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Costo
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Total de unidades
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
                {articulos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                        <Package size={27} />
                      </div>

                      <p className="mt-4 font-semibold text-slate-700">
                        No hay artículos registrados
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Registra el primer artículo del inventario
                        administrativo.
                      </p>

                      <Link
                        href="/administracion/inventario/articulos/nuevo"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Plus size={18} />
                        Registrar artículo
                      </Link>
                    </td>
                  </tr>
                ) : (
                  articulos.map((articulo) => {
                    const activo =
                      articulo.estado === "ACTIVO";

                    const esActivoFijo =
                      articulo.tipo === "ACTIVO";

                    const existencia =
                      articulo.cantidadActual ?? 0;

                    const reservada =
                      articulo.cantidadReservada ?? 0;

                    const disponible = Math.max(
                      existencia - reservada,
                      0,
                    );

                    const cambiarEstado =
                      cambiarEstadoArticulo.bind(
                        null,
                        articulo.id,
                      );

                    return (
                      <tr
                        key={articulo.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex min-w-[250px] items-center gap-3">
                            <div
                              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                                esActivoFijo
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {esActivoFijo ? (
                                <Laptop size={21} />
                              ) : (
                                <Package size={21} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {articulo.nombre}
                              </p>

                              <p className="mt-0.5 text-xs font-medium text-blue-700">
                                {articulo.codigo}
                              </p>

                              {(articulo.marca ||
                                articulo.modelo) && (
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {[
                                    articulo.marca,
                                    articulo.modelo,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            {articulo.categoriaNombre ??
                              "Sin categoría"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              esActivoFijo
                                ? "bg-purple-100 text-purple-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {esActivoFijo
                              ? "Bien o activo"
                              : "Consumible"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {articulo.controlaStock ? (
                            <div>
                              <p className="font-bold text-slate-900">
                                {disponible}{" "}
                                <span className="text-xs font-medium lowercase text-slate-500">
                                  {articulo.unidadMedida}
                                </span>
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Mínimo: {articulo.stockMinimo}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Sin control
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-700">
                          {formatearDinero(
                            articulo.costoReferencia,
                          )}
                        </td>

                        <td className="px-5 py-4 font-bold text-orange-900">
                            {formatearDinero(
                              Number(articulo.costoReferencia) * Number(articulo.cantidadActual)
                            )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              activo
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {articulo.estado}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/administracion/inventario/articulos/editar/${articulo.id}`}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil size={16} />
                              Editar
                            </Link>

                            <form action={cambiarEstado}>
                              <button
                                type="submit"
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${
                                  activo
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                              >
                                {activo ? (
                                  <PowerOff size={16} />
                                ) : (
                                  <Power size={16} />
                                )}

                                {activo
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