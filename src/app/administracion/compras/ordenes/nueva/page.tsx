import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { asc } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { proveedores } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { FormularioOrdenCompra } from "./formulario-orden-compra";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const mensajesError: Record<string, string> = {
  proveedor: "Seleccioná un proveedor válido.",
  fecha: "Ingresá la fecha de la compra.",
  motivo: "Ingresá el motivo de la compra.",
  items:
    "Agregá por lo menos un producto o servicio válido.",
};

export default async function NuevaOrdenCompraPage({
  searchParams,
}: Props) {
  await requerirAdmin();

  const parametros = await searchParams;

  const listaProveedores = await db
    .select({
      id: proveedores.id,
      codigo: proveedores.codigo,
      nombreComercial: proveedores.nombreComercial,
    })
    .from(proveedores)
    .orderBy(asc(proveedores.nombreComercial));

  return (
    <AppShell>
      <PageHeader
        title="Nueva orden de compra"
        description="Registra manualmente los productos y servicios comprados a un proveedor."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href="/administracion/compras/ordenes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-700"
          >
            <ArrowLeft size={18} />
            Volver a Órdenes de compra
          </Link>
        </div>

        {parametros.error &&
          mensajesError[parametros.error] && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {mensajesError[parametros.error]}
            </div>
          )}

        {listaProveedores.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-900">
              Primero necesitás un proveedor
            </h2>

            <p className="mt-2 text-sm text-amber-700">
              No hay proveedores registrados. Creá uno antes de
              registrar la orden de compra.
            </p>

            <Link
              href="/administracion/compras/proveedores/nuevo"
              className="mt-4 inline-flex rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white"
            >
              Registrar proveedor
            </Link>
          </div>
        ) : (
          <FormularioOrdenCompra
            proveedores={listaProveedores}
          />
        )}
      </section>
    </AppShell>
  );
}