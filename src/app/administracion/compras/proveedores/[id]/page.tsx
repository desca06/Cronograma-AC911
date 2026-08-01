import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { proveedores } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { eliminarProveedor } from "../actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    creado?: string;
    actualizado?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatearFecha(fecha: Date | null) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(fecha);
}

function obtenerNombreTipo(tipo: string) {
  switch (tipo) {
    case "PRODUCTOS":
      return "Productos";

    case "SERVICIOS":
      return "Servicios";

    case "MIXTO":
      return "Productos y servicios";

    default:
      return tipo;
  }
}

function obtenerEstiloTipo(tipo: string) {
  switch (tipo) {
    case "PRODUCTOS":
      return "bg-blue-100 text-blue-700";

    case "SERVICIOS":
      return "bg-purple-100 text-purple-700";

    case "MIXTO":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function DetalleProveedorPage({
  params,
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;

  const proveedorId = Number(id);

  if (
    !Number.isInteger(proveedorId) ||
    proveedorId <= 0
  ) {
    notFound();
  }

  const [proveedor] = await db
    .select({
      id: proveedores.id,
      codigo: proveedores.codigo,
      nombreComercial:
        proveedores.nombreComercial,
      razonSocial: proveedores.razonSocial,
      nit: proveedores.nit,
      telefono: proveedores.telefono,
      correo: proveedores.correo,
      direccion: proveedores.direccion,
      contactoPrincipal:
        proveedores.contactoPrincipal,
      telefonoContacto:
        proveedores.telefonoContacto,
      tipo: proveedores.tipo,
      observaciones:
        proveedores.observaciones,
      creadoEn: proveedores.creadoEn,
      actualizadoEn: proveedores.actualizadoEn,
    })
    .from(proveedores)
    .where(eq(proveedores.id, proveedorId))
    .limit(1);

  if (!proveedor) {
    notFound();
  }

  const eliminar = eliminarProveedor.bind(
    null,
    proveedor.id,
  );

  return (
    <AppShell>
      <PageHeader
        title="Detalle del proveedor"
        description={`Consulta la información registrada de ${proveedor.nombreComercial}.`}
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/administracion/compras/proveedores"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={18} />
            Regresar a Proveedores
          </Link>

          <Link
            href={`/administracion/compras/proveedores/${proveedor.id}/editar`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Pencil size={17} />
            Editar proveedor
          </Link>
        </div>

        {parametros.creado === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Proveedor creado correctamente.
          </div>
        )}

        {parametros.actualizado === "1" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Proveedor actualizado correctamente.
          </div>
        )}

        {parametros.error === "relaciones" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            No se puede eliminar este proveedor porque tiene registros relacionados.
          </div>
        )}

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <Building2 size={27} />
              </div>

              <div>
                <p className="text-sm font-bold text-blue-700">
                  {proveedor.codigo}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {proveedor.nombreComercial}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {proveedor.razonSocial ||
                    "Sin razón social registrada"}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-bold ${obtenerEstiloTipo(
                proveedor.tipo,
              )}`}
            >
              {obtenerNombreTipo(proveedor.tipo)}
            </span>
          </div>
        </article>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <Building2 size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Información comercial
                </h3>

                <p className="text-sm text-slate-500">
                  Identificación y clasificación del proveedor.
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Código
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {proveedor.codigo}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  NIT
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {proveedor.nit}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nombre comercial
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {proveedor.nombreComercial}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Razón social
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {proveedor.razonSocial ||
                    "No registrada"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tipo de proveedor
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {obtenerNombreTipo(
                    proveedor.tipo,
                  )}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <UserRound size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Información de contacto
                </h3>

                <p className="text-sm text-slate-500">
                  Persona y canales de comunicación.
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Contacto principal
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {proveedor.contactoPrincipal ||
                    "No registrado"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Phone size={14} />
                  Teléfono del contacto
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {proveedor.telefonoContacto ||
                    "No registrado"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Phone size={14} />
                  Teléfono comercial
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {proveedor.telefono ||
                    "No registrado"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Mail size={14} />
                  Correo electrónico
                </dt>

                <dd className="mt-1 break-all font-semibold text-slate-900">
                  {proveedor.correo ||
                    "No registrado"}
                </dd>
              </div>
            </dl>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <MapPin size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Dirección
                </h3>

                <p className="text-sm text-slate-500">
                  Ubicación fiscal o comercial.
                </p>
              </div>
            </div>

            <div className="mt-6 min-h-36 whitespace-pre-wrap rounded-xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">
              {proveedor.direccion ||
                "Sin dirección registrada."}
            </div>
          </article>

          <article className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-700">
                <Building2 size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Observaciones
                </h3>

                <p className="text-sm text-slate-500">
                  Notas internas sobre el proveedor.
                </p>
              </div>
            </div>

            <div className="mt-6 min-h-36 whitespace-pre-wrap rounded-xl bg-orange-50 p-4 text-sm leading-7 text-orange-950">
              {proveedor.observaciones ||
                "Sin observaciones registradas."}
            </div>
          </article>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <CalendarDays size={21} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Registro del sistema
              </h3>

              <p className="text-sm text-slate-500">
                Fechas de creación y última actualización.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Creado
              </dt>

              <dd className="mt-1 font-semibold text-slate-900">
                {formatearFecha(proveedor.creadoEn)}
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Última actualización
              </dt>

              <dd className="mt-1 font-semibold text-slate-900">
                {formatearFecha(
                  proveedor.actualizadoEn,
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Eliminar proveedor
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Solo se podrá eliminar si no tiene órdenes de compra u otros registros relacionados.
              </p>
            </div>

            <form action={eliminar}>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <Trash2 size={17} />
                Eliminar proveedor
              </button>
            </form>
          </div>
        </article>
      </section>
    </AppShell>
  );
}