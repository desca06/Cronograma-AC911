import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  empleados,
  vacaciones,
} from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

import { FormularioEditarVacacion } from "./formulario-editar-vacacion";

export const dynamic = "force-dynamic";

type EditarVacacionPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditarVacacionPage({
  params,
  searchParams,
}: EditarVacacionPageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;

  const vacacionId = Number(id);

  if (
    !Number.isInteger(vacacionId) ||
    vacacionId <= 0
  ) {
    notFound();
  }

  const resultado = await db
    .select({
      id: vacaciones.id,
      empleadoId: vacaciones.empleadoId,
      fechaInicio: vacaciones.fechaInicio,
      fechaFin: vacaciones.fechaFin,
      cantidadDias: vacaciones.cantidadDias,
      observacion: vacaciones.observacion,
      estado: vacaciones.estado,
    })
    .from(vacaciones)
    .where(eq(vacaciones.id, vacacionId))
    .limit(1);

  const vacacion = resultado[0];

  if (!vacacion) {
    notFound();
  }

  const listaEmpleados = await db
    .select({
      id: empleados.id,
      nombre: empleados.nombre,
      puesto: empleados.puesto,
    })
    .from(empleados)
    .orderBy(asc(empleados.nombre));

  return (
    <AppShell>
      <PageHeader
        title="Editar vacaciones"
        description="Modificá la información del registro seleccionado."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/administracion/rh/vacaciones/${vacacion.id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver al detalle
          </Link>

          {parametros.error === "campos" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Completá todos los campos obligatorios.
            </div>
          )}

          {parametros.error === "fechas" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Las fechas ingresadas no son válidas.
            </div>
          )}

          {parametros.error === "rango" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              La fecha final no puede ser anterior a la fecha inicial.
            </div>
          )}

          <FormularioEditarVacacion
            vacacion={vacacion}
            empleados={listaEmpleados}
          />
        </div>
      </section>
    </AppShell>
  );
}