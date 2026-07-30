import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  History,
} from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  articulosInventario,
  movimientosInventario,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function obtenerEstiloMovimiento(tipo: string) {
  switch (tipo) {
    case "ENTRADA":
      return {
        texto: "Entrada",
        clases: "bg-emerald-100 text-emerald-700",
        icono: ArrowDownToLine,
      };

    case "SALIDA":
      return {
        texto: "Salida",
        clases: "bg-red-100 text-red-700",
        icono: ArrowUpFromLine,
      };

    case "AJUSTE_POSITIVO":
      return {
        texto: "Ajuste positivo",
        clases: "bg-blue-100 text-blue-700",
        icono: SlidersHorizontal,
      };

    case "AJUSTE_NEGATIVO":
      return {
        texto: "Ajuste negativo",
        clases: "bg-amber-100 text-amber-700",
        icono: SlidersHorizontal,
      };

    default:
      return {
        texto: tipo.replaceAll("_", " "),
        clases: "bg-slate-100 text-slate-700",
        icono: History,
      };
  }
}

export default async function MovimientosInventarioPage() {
  await requerirAdmin();

  const movimientos = await db
    .select({
      id: movimientosInventario.id,
      articuloId: movimientosInventario.articuloId,
      codigoArticulo: articulosInventario.codigo,
      nombreArticulo: articulosInventario.nombre,
      tipoMovimiento: movimientosInventario.tipoMovimiento,
      cantidad: movimientosInventario.cantidad,
      existenciaAnterior: movimientosInventario.existenciaAnterior,
      existenciaNueva: movimientosInventario.existenciaNueva,
      motivo: movimientosInventario.motivo,
      creadoEn: movimientosInventario.creadoEn,
    })
    .from(movimientosInventario)
    .leftJoin(
      articulosInventario,
      eq(movimientosInventario.articuloId, articulosInventario.id)
    )
    .orderBy(desc(movimientosInventario.creadoEn));

  const entradas = movimientos.filter(
    (movimiento) => movimiento.tipoMovimiento === "ENTRADA"
  ).length;

  const salidas = movimientos.filter(
    (movimiento) => movimiento.tipoMovimiento === "SALIDA"
  ).length;

  const ajustes = movimientos.filter((movimiento) =>
    movimiento.tipoMovimiento.startsWith("AJUSTE")
  ).length;

  return (
    <AppShell>
      <PageHeader
        title="Movimientos de inventario"
        description="Consulta el historial de entradas, salidas y ajustes realizados."
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href="/administracion/inventario/existencias"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Regresar a Existencias
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Entradas</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {entradas}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Salidas</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{salidas}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Ajustes</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{ajustes}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Movimientos totales
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {movimientos.length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
              <History size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Historial de movimientos
              </h2>
              <p className="text-sm text-slate-500">
                Selecciona un movimiento para consultar toda su información.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Artículo</th>
                  <th className="px-5 py-4">Código</th>
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4 text-right">Cantidad</th>
                  <th className="px-5 py-4 text-right">Existencia anterior</th>
                  <th className="px-5 py-4 text-right">Existencia nueva</th>
                  <th className="px-5 py-4">Motivo</th>
                  <th className="px-5 py-4 text-right">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {movimientos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      Todavía no existen movimientos de inventario.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((movimiento) => {
                    const estilo = obtenerEstiloMovimiento(
                      movimiento.tipoMovimiento
                    );
                    const IconoMovimiento = estilo.icono;

                    return (
                      <tr
                        key={movimiento.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {movimiento.nombreArticulo ??
                              "Artículo no disponible"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {movimiento.codigoArticulo ?? "Sin código"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${estilo.clases}`}
                          >
                            <IconoMovimiento size={14} />
                            {estilo.texto}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-slate-900">
                          {movimiento.cantidad}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-600">
                          {movimiento.existenciaAnterior}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-slate-900">
                          {movimiento.existenciaNueva}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-600">
                          <p className="truncate">{movimiento.motivo}</p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/administracion/inventario/existencias/movimientos/${movimiento.id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          >
                            Ver detalle
                            <ArrowRight size={16} />
                          </Link>
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