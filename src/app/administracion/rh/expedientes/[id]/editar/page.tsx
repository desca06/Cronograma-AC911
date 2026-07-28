import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  expedientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { FormularioEditarExpediente } from "./formulario-editar-expediente";

export const dynamic = "force-dynamic";

type EditarExpedientePageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditarExpedientePage({
  params,
  searchParams,
}: EditarExpedientePageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;

  const expedienteId = Number(id);

  if (
    !Number.isInteger(expedienteId) ||
    expedienteId <= 0
  ) {
    notFound();
  }

  const resultado = await db
    .select({
      id: expedientes.id,
      empleadoId: expedientes.empleadoId,
      codigo: expedientes.codigo,
      dpi: expedientes.dpi,
      nit: expedientes.nit,
      igss: expedientes.igss,
      fechaIngreso: expedientes.fechaIngreso,
      contactoEmergencia:
        expedientes.contactoEmergencia,
      telefonoEmergencia:
        expedientes.telefonoEmergencia,
      direccion: expedientes.direccion,
      observaciones: expedientes.observaciones,
      estado: expedientes.estado,
    })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId))
    .limit(1);

  const expediente = resultado[0];

  if (!expediente) {
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
        title="Editar expediente"
        description={`Actualizá la información del expediente ${
          expediente.codigo ?? ""
        }.`}
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/administracion/rh/expedientes/${expediente.id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver al detalle
          </Link>

          {parametros.error === "campos" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Complete todos los campos obligatorios.
            </div>
          )}

          {parametros.error === "estado" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El estado seleccionado no es válido.
            </div>
          )}

          {parametros.error === "empleado" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El empleado seleccionado no existe.
            </div>
          )}

          {parametros.error === "duplicado" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El empleado seleccionado ya tiene otro expediente.
            </div>
          )}

          {parametros.error === "dpi" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Ya existe otro expediente con ese DPI.
            </div>
          )}

          <FormularioEditarExpediente
            expediente={expediente}
            empleados={listaEmpleados}
          />
        </div>
      </section>
    </AppShell>
  );
}