import Link from "next/link";
import { ArrowLeft, ArrowUpFromLine, Save } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { articulosInventario } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";
import { registrarSalida } from "../actions";

export const dynamic = "force-dynamic";

export default async function RegistrarSalidaPage() {
  await requerirAdmin();

  const articulos = await db
    .select({
      id: articulosInventario.id,
      nombre: articulosInventario.nombre,
      codigo: articulosInventario.codigo,
    })
    .from(articulosInventario)
    .where(eq(articulosInventario.controlaStock, true))
    .orderBy(asc(articulosInventario.nombre));

  return (
    <AppShell>
      <PageHeader
        title="Registrar salida"
        description="Registra la salida de artículos del inventario administrativo."
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
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-700">
              <ArrowUpFromLine size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Nueva salida de inventario
              </h2>
              <p className="text-sm text-slate-500">
                Registra el egreso de existencias del inventario.
              </p>
            </div>
          </div>

          <form action={registrarSalida} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Artículo
                </label>
                <select
                  name="articuloId"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
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

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Motivo
                </label>
                <select
                  name="motivo"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Seleccione...</option>
                  <option>Consumo interno</option>
                  <option>Otro</option>
                </select>
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
                placeholder="Información adicional (opcional)."
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
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
              >
                <Save size={18} />
                Registrar salida
              </button>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}