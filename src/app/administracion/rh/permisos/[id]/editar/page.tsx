import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  permisos,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { FormularioEditarPermiso } from "./formulario-editar-permiso";

export const dynamic = "force-dynamic";

type EditarPermisoPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditarPermisoPage({
  params,
  searchParams,
}: EditarPermisoPageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;

  const permisoId = Number(id);

  if (
    !Number.isInteger(permisoId) ||
    permisoId <= 0
  ) {
    notFound();
  }

  const resultado = await db
    .select({
      id: permisos.id,
      empleadoId: permisos.empleadoId,
      tipo: permisos.tipo,
      fecha: permisos.fecha,
      horaInicio: permisos.horaInicio,
      horaFin: permisos.horaFin,
      motivo: permisos.motivo,
      observacion: permisos.observacion,
      estado: permisos.estado,
    })
    .from(permisos)
    .where(eq(permisos.id, permisoId))
    .limit(1);

  const permiso = resultado[0];

  if (!permiso) {
    notFound();
  }

  if (permiso.estado !== "PENDIENTE") {
    notFound();
  }

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
        title="Editar permiso"
        description="Actualizá la información del permiso."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/administracion/rh/permisos/${permiso.id}`}
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

          {parametros.error === "tipo" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El tipo de permiso no es válido.
            </div>
          )}

          {parametros.error === "horario" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              La hora final debe ser posterior a la inicial.
            </div>
          )}

          <FormularioEditarPermiso
            permiso={permiso}
            empleados={listaEmpleados}
          />
        </div>
      </section>
    </AppShell>
  );
}