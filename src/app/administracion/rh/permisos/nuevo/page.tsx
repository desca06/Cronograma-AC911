import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { empleados } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { FormularioPermiso } from "./formulario-permiso";

export const dynamic = "force-dynamic";

type NuevoPermisoPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NuevoPermisoPage({
  searchParams,
}: NuevoPermisoPageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const listaEmpleados = await db
    .select({
      id: empleados.id,
      nombre: empleados.nombre
    })
    .from(empleados)
    .where(eq(empleados.activo, true))
    .orderBy(asc(empleados.nombre));

  return (
    <AppShell>
      <PageHeader
        title="Nuevo permiso"
        description="Registrá una nueva solicitud de permiso."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/administracion/rh/permisos"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a permisos
          </Link>

          {parametros.error === "campos" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Completá todos los campos obligatorios.
            </div>
          )}

          {parametros.error === "tipo" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El tipo de permiso seleccionado no es válido.
            </div>
          )}

          {parametros.error === "horario" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              En permisos de un solo día, la hora final debe ser posterior a la hora inicial.
            </div>
          )}

          {parametros.error === "fechas" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El rango debe contener al menos un día hábil de lunes a viernes.
            </div>
          )}

          <FormularioPermiso
            empleados={listaEmpleados}
          />
        </div>
      </section>
    </AppShell>
  );
}