import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ImagePlus,
  List,
  Trash2,
} from "lucide-react";
import {
  asc,
  eq,
} from "drizzle-orm";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  expedientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import {
  eliminarFotoExpediente,
  subirFotoExpediente,
} from "../../actions";

import {
  FormularioEditarExpediente,
} from "./formulario-editar-expediente";

export const dynamic =
  "force-dynamic";

type EditarExpedientePageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function EditarExpedientePage({
  params,
  searchParams,
}: EditarExpedientePageProps) {
  await requerirAdmin();

  const { id } =
    await params;

  const parametros =
    await searchParams;

  const expedienteId =
    Number(id);

  if (
    !Number.isInteger(
      expedienteId,
    ) ||
    expedienteId <= 0
  ) {
    notFound();
  }

  const [expediente] =
    await db
      .select({
        id: expedientes.id,
        empleadoId:
          expedientes.empleadoId,
        codigo:
          expedientes.codigo,
        fotoUrl:
          expedientes.fotoUrl,
        dpi: expedientes.dpi,
        nit: expedientes.nit,
        igss: expedientes.igss,
        fechaIngreso:
          expedientes.fechaIngreso,
        contactoEmergencia:
          expedientes.contactoEmergencia,
        telefonoEmergencia:
          expedientes.telefonoEmergencia,
        direccion:
          expedientes.direccion,
        observaciones:
          expedientes.observaciones,
        estado:
          expedientes.estado,
      })
      .from(expedientes)
      .where(
        eq(
          expedientes.id,
          expedienteId,
        ),
      )
      .limit(1);

  if (!expediente) {
    notFound();
  }

  const listaEmpleados =
    await db
      .select({
        id: empleados.id,
        nombre:
          empleados.nombre,
        puesto:
          empleados.puesto,
      })
      .from(empleados)
      .orderBy(
        asc(
          empleados.nombre,
        ),
      );

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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/administracion/rh/expedientes/${expediente.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft
                size={18}
              />
              Volver al detalle
            </Link>

            <Link
              href="/administracion/rh/expedientes"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <List size={18} />
              Todos los expedientes
            </Link>
          </div>

          {parametros.error ===
            "campos" && (
            <AlertaError>
              Complete todos los campos obligatorios.
            </AlertaError>
          )}

          {parametros.error ===
            "estado" && (
            <AlertaError>
              El estado seleccionado no es válido.
            </AlertaError>
          )}

          {parametros.error ===
            "empleado" && (
            <AlertaError>
              El empleado seleccionado no existe.
            </AlertaError>
          )}

          {parametros.error ===
            "duplicado" && (
            <AlertaError>
              El empleado seleccionado ya tiene otro expediente.
            </AlertaError>
          )}

          {parametros.error ===
            "dpi" && (
            <AlertaError>
              Ya existe otro expediente con ese DPI.
            </AlertaError>
          )}

          {parametros.error ===
            "foto-vacia" && (
            <AlertaError>
              Debes seleccionar una imagen antes de subirla.
            </AlertaError>
          )}

          {parametros.error ===
            "foto-tipo" && (
            <AlertaError>
              Solo puedes subir imágenes JPG, JPEG o PNG.
            </AlertaError>
          )}

          {parametros.error ===
            "foto-peso" && (
            <AlertaError>
              La imagen no puede pesar más de 5 MB.
            </AlertaError>
          )}

          {parametros.success ===
            "foto" && (
            <AlertaExito>
              Fotografía actualizada correctamente.
            </AlertaExito>
          )}

          {parametros.success ===
            "foto-eliminada" && (
            <AlertaExito>
              Fotografía eliminada correctamente.
            </AlertaExito>
          )}

          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Fotografía del empleado
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                La fotografía también aparecerá en el PDF del expediente.
              </p>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-[190px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {expediente.fotoUrl ? (
                  <img
                    src={
                      expediente.fotoUrl
                    }
                    alt="Fotografía del empleado"
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center px-4 text-center text-sm font-semibold text-slate-400">
                    Sin fotografía
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertTriangle
                    className="mt-0.5 shrink-0"
                    size={19}
                  />

                  <div>
                    <p className="font-bold">
                      Solo puedes subir imágenes.
                    </p>

                    <p className="mt-1">
                      Formatos permitidos: JPG, JPEG y PNG. Tamaño máximo: 5 MB.
                    </p>
                  </div>
                </div>

                <form
                  action={
                    subirFotoExpediente
                  }
                  className="space-y-3"
                >
                  <input
                    type="hidden"
                    name="expedienteId"
                    value={
                      expediente.id
                    }
                  />

                  <label
                    htmlFor="foto"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Seleccionar imagen
                  </label>

                  <input
                    id="foto"
                    name="foto"
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    required
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <ImagePlus
                      size={18}
                    />

                    {expediente.fotoUrl
                      ? "Cambiar fotografía"
                      : "Subir fotografía"}
                  </button>
                </form>

                {expediente.fotoUrl && (
                  <form
                    action={
                      eliminarFotoExpediente
                    }
                  >
                    <input
                      type="hidden"
                      name="expedienteId"
                      value={
                        expediente.id
                      }
                    />

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2
                        size={18}
                      />
                      Eliminar fotografía
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          <FormularioEditarExpediente
            expediente={
              expediente
            }
            empleados={
              listaEmpleados
            }
          />
        </div>
      </section>
    </AppShell>
  );
}

function AlertaError({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {children}
    </div>
  );
}

function AlertaExito({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
      {children}
    </div>
  );
}