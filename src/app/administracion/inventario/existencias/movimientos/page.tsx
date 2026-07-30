import Link from "next/link";
import { ArrowLeft, History, Filter } from "lucide-react";
import { desc } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { movimientosInventario } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function MovimientosInventarioPage() {
  const movimientos = await db
    .select()
    .from(movimientosInventario)
    .orderBy(desc(movimientosInventario.creadoEn));

  const entradas = movimientos.filter(m => m.tipoMovimiento === "ENTRADA").length;
  const salidas = movimientos.filter(m => m.tipoMovimiento === "SALIDA").length;
  const ajustes = movimientos.filter(m => m.tipoMovimiento.includes("AJUSTE")).length;

  const badge = (tipo:string)=>{
    switch(tipo){
      case "ENTRADA":
        return "bg-emerald-100 text-emerald-700";
      case "SALIDA":
        return "bg-red-100 text-red-700";
      case "AJUSTE_POSITIVO":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Movimientos de inventario"
        description="Consulta el historial de movimientos del inventario."
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href="/administracion/inventario/existencias"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft size={18}/>
          Regresar a Existencias
        </Link>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Entradas",entradas,"emerald"],
            ["Salidas",salidas,"red"],
            ["Ajustes",ajustes,"amber"],
            ["Total",movimientos.length,"blue"],
          ].map(([t,v,c])=>(
            <div key={String(t)} className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{t}</p>
              <h2 className={`mt-2 text-3xl font-bold text-${c}-600`}>{v}</h2>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={18}/>
            <h2 className="font-semibold">Filtros (próximamente)</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <input className="rounded-xl border px-4 py-3" placeholder="Buscar artículo..."/>
            <select className="rounded-xl border px-4 py-3">
              <option>Todos los tipos</option>
            </select>
            <input type="date" className="rounded-xl border px-4 py-3"/>
            <input type="date" className="rounded-xl border px-4 py-3"/>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Antes</th>
                <th className="px-4 py-3">Después</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m:any)=>(
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(m.creadoEn).toLocaleString("es-GT")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(m.tipoMovimiento)}`}>
                      {m.tipoMovimiento.replaceAll("_"," ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.cantidad}</td>
                  <td className="px-4 py-3">{m.existenciaAnterior}</td>
                  <td className="px-4 py-3">{m.existenciaNueva}</td>
                  <td className="px-4 py-3">{m.motivo}</td>
                  <td className="px-4 py-3">
                    <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-slate-50">
                      <History size={16}/>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}