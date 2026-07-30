import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";

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

function obtenerNombreTipo(tipo?: string) {
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
      return "Seleccioná un artículo válido.";
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
      return "No hay suficientes unidades para completar el movimiento.";
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
      existenciaId: existenciasInventario.id,
      articuloId: articulosInventario.id,
      codigo: articulosInventario.codigo,
      nombre: articulosInventario.nombre,
      tipo: articulosInventario.tipo,
      unidadMedida: articulosInventario.unidadMedida,
      stockMinimo: articulosInventario.stockMinimo,
      estadoArticulo: articulosInventario.estado,
      controlaStock: articulosInventario.controlaStock,
      categoria: categoriasInventario.nombre,
      cantidadActual: existenciasInventario.cantidadActual,
      cantidadReservada: existenciasInventario.cantidadReservada,
      ultimaEntrada: existenciasInventario.ultimaEntrada,
      ultimaSalida: existenciasInventario.ultimaSalida,
      actualizadoEn: existenciasInventario.actualizadoEn,
    })
    .from(articulosInventario)
    .innerJoin(
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
      const reservada =
        existencia.cantidadReservada ?? 0;
      const disponible = Math.max(
        actual - reservada,
        0,
      );

      acumulado.totalArticulos += 1;
      acumulado.totalUnidades += actual;
      acumulado.totalReservadas += reservada;
      acumulado.totalDisponibles += disponible;

      if (disponible <= 0) {
        acumulado.sinStock += 1;
      } else if (
        disponible <= existencia.stockMinimo
      ) {
        acumulado.stockBajo += 1;
      }

      return acumulado;
    },
    {
      totalArticulos: 0,
      totalUnidades: 0,
      totalReservadas: 0,
      totalDisponibles: 0,
      stockBajo: 0,
      sinStock: 0,
    },
  );

  const mensajeError = obtenerMensajeError(
    parametros.error,
  );

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Inventario administrativo
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            Existencias
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Consultá el stock actual, reservado y disponible
            de cada artículo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/administracion/inventario/existencias/entrada"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Registrar entrada
          </Link>

          <Link
            href="/administracion/inventario/existencias/salida"
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Registrar salida
          </Link>

          <Link
            href="/administracion/inventario/existencias/ajuste"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Registrar ajuste
          </Link>

          <Link
            href="/administracion/inventario/existencias/movimientos"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ver movimientos
          </Link>
        </div>
      </section>

      {parametros.exito === "movimiento" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {obtenerNombreTipo(parametros.tipo)} registrada
          correctamente.
        </div>
      )}

      {mensajeError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {mensajeError}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <TarjetaResumen
          titulo="Artículos"
          valor={resumen.totalArticulos}
          descripcion="Con control de stock"
        />

        <TarjetaResumen
          titulo="Unidades"
          valor={resumen.totalUnidades}
          descripcion="Existencia física"
        />

        <TarjetaResumen
          titulo="Reservadas"
          valor={resumen.totalReservadas}
          descripcion="No disponibles"
        />

        <TarjetaResumen
          titulo="Disponibles"
          valor={resumen.totalDisponibles}
          descripcion="Para utilizar"
        />

        <TarjetaResumen
          titulo="Stock bajo"
          valor={resumen.stockBajo}
          descripcion="Requieren atención"
        />

        <TarjetaResumen
          titulo="Sin stock"
          valor={resumen.sinStock}
          descripcion="Existencia agotada"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Inventario actual
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            El stock disponible se calcula restando las
            unidades reservadas al stock actual.
          </p>
        </div>

        {existencias.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium text-slate-700">
              No hay artículos con control de stock.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Creá un artículo y habilitá la opción de controlar
              existencias.
            </p>

            <Link
              href="/administracion/inventario/articulos/nuevo"
              className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Crear artículo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Artículo</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3 text-right">
                    Actual
                  </th>
                  <th className="px-5 py-3 text-right">
                    Reservado
                  </th>
                  <th className="px-5 py-3 text-right">
                    Disponible
                  </th>
                  <th className="px-5 py-3 text-right">
                    Mínimo
                  </th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">
                    Último movimiento
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {existencias.map((existencia) => {
                  const actual =
                    existencia.cantidadActual ?? 0;

                  const reservada =
                    existencia.cantidadReservada ?? 0;

                  const disponible = Math.max(
                    actual - reservada,
                    0,
                  );

                  const ultimaFecha =
                    existencia.ultimaEntrada &&
                    existencia.ultimaSalida
                      ? existencia.ultimaEntrada >
                        existencia.ultimaSalida
                        ? existencia.ultimaEntrada
                        : existencia.ultimaSalida
                      : existencia.ultimaEntrada ??
                        existencia.ultimaSalida;

                  const estadoStock =
                    disponible <= 0
                      ? "SIN_STOCK"
                      : disponible <=
                          existencia.stockMinimo
                        ? "BAJO"
                        : "NORMAL";

                  return (
                    <tr
                      key={existencia.articuloId}
                      className="text-sm text-slate-700 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {existencia.nombre}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>
                            {existencia.codigo ||
                              `ART-${existencia.articuloId}`}
                          </span>

                          <span>•</span>

                          <span>
                            {existencia.tipo}
                          </span>

                          {existencia.estadoArticulo !==
                            "ACTIVO" && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-rose-600">
                                Artículo inactivo
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {existencia.categoria}
                      </td>

                      <td className="px-5 py-4 text-right font-medium">
                        {actual}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          {existencia.unidadMedida}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {reservada}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-900">
                        {disponible}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {existencia.stockMinimo}
                      </td>

                      <td className="px-5 py-4">
                        <EstadoStock estado={estadoStock} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatearFecha(ultimaFecha)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  descripcion,
}: {
  titulo: string;
  valor: number;
  descripcion: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {descripcion}
      </p>
    </article>
  );
}

function EstadoStock({
  estado,
}: {
  estado: "NORMAL" | "BAJO" | "SIN_STOCK";
}) {
  if (estado === "SIN_STOCK") {
    return (
      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
        Sin stock
      </span>
    );
  }

  if (estado === "BAJO") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Stock bajo
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Normal
    </span>
  );
}