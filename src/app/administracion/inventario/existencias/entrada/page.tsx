import Link from "next/link";
import { ArrowLeft, ArrowDownToLine, Save } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { articulosInventario } from "@/db/schema";
import { requerirInventario } from "@/lib/auth";
import { registrarEntrada } from "../actions";

export const dynamic = "force-dynamic";

export default async function RegistrarEntradaPage() {
  await requerirInventario();

  const articulos = await db
    .select({
      id: articulosInventario.id,
      nombre: articulosInventario.nombre,
      codigo: articulosInventario.codigo,
      unidadMedida: articulosInventario.unidadMedida,
    })
    .from(articulosInventario)
    .where(eq(articulosInventario.controlaStock, true))
    .orderBy(asc(articulosInventario.nombre));

  return (
    <AppShell>
      <PageHeader
        title="Registrar entrada"
        description="Registra el ingreso de existencias al inventario."
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href="/administracion/inventario/existencias"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Regresar a Existencias
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ArrowDownToLine size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Nueva entrada de inventario
              </h2>

              <p className="text-sm text-slate-500">
                Completa la información del ingreso.
              </p>
            </div>
          </div>

          <form action={registrarEntrada} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Artículo
                </label>

                <select
                  name="articuloId"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Seleccione...</option>

                  {articulos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codigo} - {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Cantidad
                </label>

                <input
                  type="number"
                  name="cantidad"
                  min={1}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Motivo
                </label>

                <input
                  type="text"
                  name="motivo"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Compra, devolución, donación..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Documento de referencia
                </label>

                <input
                  type="text"
                  name="documentoReferencia"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Factura, OC..."
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observaciones
              </label>

              <textarea
                name="observaciones"
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Link
                href="/administracion/inventario/existencias"
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                <Save size={18} />
                Registrar entrada
              </button>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}