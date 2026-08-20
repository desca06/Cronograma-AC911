import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { asc, eq, notInArray } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  expedientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { FormularioExpediente } from "./formulario-expediente";

export const dynamic = "force-dynamic";

type NuevoExpedientePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NuevoExpedientePage({
  searchParams,
}: NuevoExpedientePageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const empleadosConExpediente = await db
    .select({
      empleadoId: expedientes.empleadoId,
    })
    .from(expedientes);

  const idsConExpediente = empleadosConExpediente.map(
    (registro) => registro.empleadoId,
  );

  const listaEmpleados =
    idsConExpediente.length > 0
      ? await db
        .select({
          id: empleados.id,
          nombre: empleados.nombre,
          puesto: empleados.puesto,
        })
        .from(empleados)
        .where(
          notInArray(
            empleados.id,
            idsConExpediente,
          ),
        )
        .orderBy(asc(empleados.nombre))
      : await db
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
        title="Nuevo expediente"
        description="Registrá el expediente laboral de un empleado."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/administracion/rh/expedientes"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Volver a expedientes
          </Link>

          {parametros.error === "campos" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Completá todos los campos obligatorios.
            </div>
          )}

          {parametros.error === "empleado" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El empleado seleccionado no existe.
            </div>
          )}

          {parametros.error === "duplicado" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              El empleado ya tiene un expediente registrado.
            </div>
          )}

          {parametros.error === "dpi" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Ya existe un expediente con ese DPI.
            </div>
          )}
          
          {parametros.error === "fecha-salida" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              La fecha de salida no es válida. Si el empleado sigue laborando, dejá el campo vacío.
            </div>
          )}

          {parametros.error === "crear" && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              No se pudo crear el expediente.
            </div>
          )}

          {listaEmpleados.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-lg font-bold text-amber-900">
                No hay empleados disponibles
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Todos los empleados registrados ya tienen un expediente.
              </p>

              <Link
                href="/administracion/rh/expedientes"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                Volver al listado
              </Link>
            </div>
          ) : (
            <FormularioExpediente
              empleados={listaEmpleados}
            />
          )}
        </div>
      </section>
    </AppShell>
  );
}