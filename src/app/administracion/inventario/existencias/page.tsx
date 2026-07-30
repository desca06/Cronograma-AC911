import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  PackageCheck,
  PackageX,
  SlidersHorizontal,
} from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  articulosInventario,
  categoriasInventario,
  existenciasInventario,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{
    exito?: string;
    error?: string;
    tipo?: string;
  }>;
};

export const dynamic = "force-dynamic";

function obtenerNombreMovimiento(tipo?: string) {
  switch (tipo) {
    case "ENTRADA":
      return "Entrada";
    case "SALIDA":
      return "Salida";
    case "AJUSTE_POSITIVO":
      return "Ajuste positivo";
    case "AJUSTE_NEGATIVO":
      return "Ajuste negativo";
    default:
      return "Movimiento";
  }
}

function obtenerMensajeError(error?: string) {
  switch (error) {
    case "articulo":
      return "Selecciona un artículo válido.";
    case "cantidad":
      return "La cantidad debe ser un número entero mayor que cero.";
    case "motivo":
      return "El motivo del movimiento es obligatorio.";
    case "inexistente":
      return "El artículo seleccionado no existe.";
    case "inactivo":
      return "No se pueden registrar movimientos para un artículo inactivo.";
    case "sin-control":
      return "Este artículo no tiene habilitado el control de existencias.";
    case "sin-existencia":
      return "El artículo todavía no tiene un registro de existencia.";
    case "stock-insuficiente":
      return "No hay suficientes unidades disponibles para completar el movimiento.";
    default:
      return null;
  }
}

function formatearFecha(fecha: Date | null) {
  if (!fecha) {
    return "Sin movimientos";
  }

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

export default async function ExistenciasPage({
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const existencias = await db
    .select({
      articuloId: articulosInventario.id,
      codigo: articulosInventario.codigo,
      nombre: articulosInventario.nombre,
      tipo: articulosInventario.tipo,
      unidadMedida: articulosInventario.unidadMedida,
      marca: articulosInventario.marca,
      modelo: articulosInventario.modelo,
      stockMinimo: articulosInventario.stockMinimo,
      estadoArticulo: articulosInventario.estado,
      categoriaNombre: categoriasInventario.nombre,
      cantidadActual: existenciasInventario.cantidadActual,
      cantidadReservada: existenciasInventario.cantidadReservada,
      ultimaEntrada: existenciasInventario.ultimaEntrada,
      ultimaSalida: existenciasInventario.ultimaSalida,
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
    .where(eq(articulosInventario.controlaStock, true))
    .orderBy(
      asc(categoriasInventario.nombre),
      asc(articulosInventario.nombre),
    );

  const resumen = existencias.reduce(
    (acumulado, existencia) => {
      const actual = existencia.cantidadActual ?? 0;
      const reservada = existencia.cantidadReservada ?? 0;
      const disponible = Math.max(actual - reservada, 0);

      acumulado.totalArticulos += 1;
      acumulado.totalUnidades += actual;
      acumulado.totalDisponibles += disponible;

      if (disponible <= 0) {
        acumulado.sinStock += 1;
      } else if (disponible <= existencia.stockMinimo) {
        acumulado.stockBajo += 1;
      }

      return acumulado;
    },
    {
      totalArticulos: 0,
      totalUnidades: 0,
      totalDisponibles: 0,
      stockBajo: 0,
      sinStock: 0,
    },
  );

  const mensajeError = obtenerMensajeError(parametros.error);

  return (
    <AppShell>
      <PageHeader
        title="Existencias de inventario"
        description="Consulta y controla el stock actual de los artículos administrativos de AC911"
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
                <Boxes size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Artículos controlados</p>
                <p className="text-2xl font-bold text-slate-900">{resumen.totalArticulos}</p>
                <p className="text-xs text-slate-400">Con control de existencias</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <PackageCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Unidades disponibles</p>
                <p className="text-2xl font-bold text-slate-900">{resumen.totalDisponibles}</p>
                <p className="text-xs text-slate-400">De {resumen.totalUnidades} unidades físicas</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Stock bajo</p>
                <p className="text-2xl font-bold text-slate-900">{resumen.stockBajo}</p>
                <p className="text-xs text-slate-400">Requieren reposición</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-700">
                <PackageX size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Sin stock</p>
                <p className="text-2xl font-bold text-slate-900">{resumen.sinStock}</p>
                <p className="text-xs text-slate-400">Artículos agotados</p>
              </div>
            </div>
          </article>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Control de existencias</h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra entradas, salidas, ajustes y consulta el historial de movimientos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/administracion/inventario/existencias/entrada"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <ArrowDownToLine size={18} />
              Registrar entrada
            </Link>

            <Link
              href="/administracion/inventario/existencias/salida"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <ArrowUpFromLine size={18} />
              Registrar salida
            </Link>

            <Link
              href="/administracion/inventario/existencias/ajuste"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              <SlidersHorizontal size={18} />
              Registrar ajuste
            </Link>

            <Link
              href="/administracion/inventario/existencias/movimientos"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <ClipboardList size={18} />
              Ver movimientos
            </Link>
          </div>
        </div>

        {parametros.exito === "movimiento" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {obtenerNombreMovimiento(parametros.tipo)} registrada correctamente.
          </div>
        )}

        {mensajeError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {mensajeError}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Artículo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Categoría</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actual</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Reservado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Disponible</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Mínimo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Último movimiento</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {existencias.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                        <Boxes size={27} />
                      </div>
                      <p className="mt-4 font-semibold text-slate-700">No hay existencias registradas</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Primero registra artículos con el control de stock habilitado.
                      </p>
                      <Link
                        href="/administracion/inventario/articulos/nuevo"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Registrar artículo
                      </Link>
                    </td>
                  </tr>
                ) : (
                  existencias.map((existencia) => {
                    const actual = existencia.cantidadActual ?? 0;
                    const reservada = existencia.cantidadReservada ?? 0;
                    const disponible = Math.max(actual - reservada, 0);

                    const ultimaFecha =
                      existencia.ultimaEntrada && existencia.ultimaSalida
                        ? existencia.ultimaEntrada > existencia.ultimaSalida
                          ? existencia.ultimaEntrada
                          : existencia.ultimaSalida
                        : existencia.ultimaEntrada ?? existencia.ultimaSalida;

                    const estadoStock =
                      disponible <= 0
                        ? "SIN_STOCK"
                        : disponible <= existencia.stockMinimo
                          ? "BAJO"
                          : "NORMAL";

                    return (
                      <tr key={existencia.articuloId} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="min-w-[260px]">
                            <p className="font-semibold text-slate-900">{existencia.nombre}</p>
                            <p className="mt-0.5 text-xs font-medium text-blue-700">
                              {existencia.codigo ?? `ART-${existencia.articuloId}`}
                            </p>
                            {(existencia.marca || existencia.modelo) && (
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {[existencia.marca, existencia.modelo].filter(Boolean).join(" · ")}
                              </p>
                            )}
                            {existencia.estadoArticulo !== "ACTIVO" && (
                              <p className="mt-1 text-xs font-semibold text-red-600">Artículo inactivo</p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            {existencia.categoriaNombre ?? "Sin categoría"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <p className="font-bold text-slate-900">{actual}</p>
                          <p className="mt-1 text-xs lowercase text-slate-500">{existencia.unidadMedida}</p>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-600">{reservada}</td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <p className="font-bold text-slate-900">{disponible}</p>
                          <p className="mt-1 text-xs lowercase text-slate-500">{existencia.unidadMedida}</p>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-600">
                          {existencia.stockMinimo}
                        </td>

                        <td className="px-6 py-4">
                          <EstadoStock estado={estadoStock} />
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {formatearFecha(ultimaFecha)}
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

function EstadoStock({
  estado,
}: {
  estado: "NORMAL" | "BAJO" | "SIN_STOCK";
}) {
  if (estado === "SIN_STOCK") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
        Sin stock
      </span>
    );
  }

  if (estado === "BAJO") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        Stock bajo
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
      Normal
    </span>
  );
}