import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clienteAreas,
  clienteSubtiendas,
  clientes,
} from "@/db/schema";
import { requerirCompras } from "@/lib/auth";

import { FormularioCotizacion } from "./formulario-cotizacion";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

const mensajesError: Record<string, string> = {
  cliente: "Debes seleccionar un cliente válido.",
  titulo: "Debes ingresar el título de la cotización.",
  fecha: "Debes seleccionar una fecha válida.",
  vigencia: "Los días de vigencia deben ser mayores que cero.",
  porcentajes:
    "El anticipo y el pago final deben sumar exactamente 100%.",
  datos:
    "Revisa la vigencia y los porcentajes de pago ingresados.",
  items:
    "Debes agregar por lo menos un producto, servicio o costo adicional válido.",
  ubicacion:
    "La subtienda o el área no pertenecen a ese cliente.",
};

export default async function NuevaCotizacionPage({
  searchParams,
}: PageProps) {
  await requerirCompras();

  const parametros = await searchParams;

  const [
    listaClientes,
    listaSubtiendas,
    listaAreas,
  ] = await Promise.all([
    db
      .select({
        id: clientes.id,
        nombre: clientes.nombre,
      })
      .from(clientes)
      .where(eq(clientes.activo, true))
      .orderBy(asc(clientes.nombre)),

    db
      .select({
        id: clienteSubtiendas.id,
        clienteId: clienteSubtiendas.clienteId,
        nombre: clienteSubtiendas.nombre,
      })
      .from(clienteSubtiendas)
      .where(eq(clienteSubtiendas.activo, true))
      .orderBy(asc(clienteSubtiendas.nombre)),

    db
      .select({
        id: clienteAreas.id,
        subtiendaId: clienteAreas.subtiendaId,
        nombre: clienteAreas.nombre,
      })
      .from(clienteAreas)
      .where(eq(clienteAreas.activo, true))
      .orderBy(asc(clienteAreas.nombre)),
  ]);

  const mensajeError = parametros.error
    ? mensajesError[parametros.error]
    : null;

  const fechaHoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
  });

  return (
    <AppShell>
      <PageHeader
        title="Nueva cotización"
        description="Crea una propuesta comercial con productos, servicios y costos adicionales."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href="/administracion/compras/cotizaciones"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={18} />
            Regresar a Cotizaciones
          </Link>
        </div>

        {mensajeError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {mensajeError}
          </div>
        )}

        {listaClientes.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-900">
              No hay clientes activos
            </h2>

            <p className="mt-2 text-sm text-amber-800">
              Primero debes registrar o activar un cliente para poder
              crear una cotización.
            </p>

            <Link
              href="/clientes"
              className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Ir a clientes
            </Link>
          </div>
        ) : (
          <FormularioCotizacion
            clientes={listaClientes}
            subtiendas={listaSubtiendas}
            areas={listaAreas}
            fechaInicial={fechaHoy}
          />
        )}
      </section>
    </AppShell>
  );
}