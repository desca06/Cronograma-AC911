import Link from "next/link";
import { ArrowLeft, Umbrella } from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { empleados } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

import { FormularioVacaciones } from "./formulario-vacaciones";

export const dynamic = "force-dynamic";

type NuevaVacacionPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function obtenerMensajeError(error?: string) {
  switch (error) {
    case "fechas":
      return "La fecha final debe ser igual o posterior a la fecha de inicio.";

    case "empleado":
      return "El empleado seleccionado no existe o se encuentra inactivo.";

    case "maximo":
      return "Una solicitud no puede superar los 15 días hábiles.";

    case "agotadas":
      return "El trabajador ya agotó sus 15 días hábiles de vacaciones. No tiene más días disponibles.";

    case "saldo":
      return "Días insuficientes. La solicitud supera el saldo de vacaciones disponible.";

    case "datos":
      return "Completá correctamente todos los campos obligatorios.";

    default:
      return null;
  }
}

export default async function NuevaVacacionPage({
  searchParams,
}: NuevaVacacionPageProps) {
  await requerirAdmin();

  const parametros = await searchParams;
  const mensajeError = obtenerMensajeError(
    parametros.error,
  );

  const listaEmpleados = await db
    .select({
      id: empleados.id,
      nombre: empleados.nombre,
      puesto: empleados.puesto,
    })
    .from(empleados)
    .where(eq(empleados.activo, true))
    .orderBy(asc(empleados.nombre));

  return (
    <AppShell>
      <PageHeader
        title="Nueva solicitud"
        description="Registrar un período de vacaciones para un empleado."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/administracion/rh/vacaciones"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a vacaciones
          </Link>

          {mensajeError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {mensajeError}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 md:px-8">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                  <Umbrella size={24} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Datos de la solicitud
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    La solicitud será registrada inicialmente como pendiente.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {listaEmpleados.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                  No existen empleados activos. Activá o registrá un empleado
                  antes de crear una solicitud de vacaciones.
                </div>
              ) : (
                <FormularioVacaciones
                  empleados={listaEmpleados}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}