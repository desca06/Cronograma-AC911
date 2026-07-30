import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, Save } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { articulosInventario } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";
import { registrarAjustePositivo, registrarAjusteNegativo } from "../actions";

export const dynamic="force-dynamic";

export default async function AjusteInventarioPage(){
  await requerirAdmin();

  const articulos=await db.select({
    id:articulosInventario.id,
    codigo:articulosInventario.codigo,
    nombre:articulosInventario.nombre
  }).from(articulosInventario)
    .where(eq(articulosInventario.controlaStock,true))
    .orderBy(asc(articulosInventario.nombre));

  async function action(formData:FormData){
    "use server";
    const tipo=String(formData.get("tipo")??"");
    if(tipo==="positivo"){
      await registrarAjustePositivo(formData);
    }else{
      await registrarAjusteNegativo(formData);
    }
  }

  return(
    <AppShell>
      <PageHeader title="Registrar ajuste" description="Corrige diferencias de inventario mediante ajustes positivos o negativos."/>
      <section className="space-y-6 p-5 md:p-8">
        <Link href="/administracion/inventario/existencias" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
          <ArrowLeft size={18}/>Regresar a Existencias
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <SlidersHorizontal size={24}/>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nuevo ajuste de inventario</h2>
              <p className="text-sm text-slate-500">Utiliza esta opción únicamente para corregir diferencias de inventario.</p>
            </div>
          </div>

          <form action={action} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Artículo</label>
                <select name="articuloId" required className="w-full rounded-xl border px-4 py-3">
                  <option value="">Seleccione...</option>
                  {articulos.map(a=>(
                    <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Cantidad</label>
                <input type="number" min={1} required name="cantidad" className="w-full rounded-xl border px-4 py-3"/>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Tipo de ajuste</label>
                <div className="flex gap-8 rounded-xl border p-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tipo" value="positivo" defaultChecked/>
                    Ajuste positivo
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tipo" value="negativo"/>
                    Ajuste negativo
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Motivo</label>
                <select name="motivo" required className="w-full rounded-xl border px-4 py-3">
                  <option value="">Seleccione...</option>
                  <option>Conteo físico</option>
                  <option>Corrección de inventario</option>
                  <option>Material encontrado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Observaciones</label>
              <textarea name="observaciones" rows={4} className="w-full rounded-xl border px-4 py-3"/>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Los ajustes deben utilizarse únicamente para corregir diferencias entre el inventario físico y el registrado en el sistema.
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/administracion/inventario/existencias" className="rounded-xl border px-5 py-3 font-semibold">Cancelar</Link>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white hover:bg-amber-700">
                <Save size={18}/>Registrar ajuste
              </button>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}