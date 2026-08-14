import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { proveedores } from "@/db/schema";
import { requerirCompras } from "@/lib/auth";

import { actualizarProveedor } from "../../actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

const mensajesError: Record<string, string> = {
  nombre:
    "Debes ingresar el nombre comercial del proveedor.",
  nit: "Debes ingresar un NIT válido.",
  tipo:
    "Debes seleccionar un tipo de proveedor válido.",
  duplicado:
    "Ya existe otro proveedor registrado con ese NIT.",
};

export default async function EditarProveedorPage({
  params,
  searchParams,
}: PageProps) {
  await requerirCompras();

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
    })
    .from(proveedores)
    .where(eq(proveedores.id, proveedorId))
    .limit(1);

  if (!proveedor) {
    notFound();
  }

  const actualizar =
    actualizarProveedor.bind(
      null,
      proveedor.id,
    );

  const mensajeError = parametros.error
    ? mensajesError[parametros.error]
    : null;

  return (
    <AppShell>
      <PageHeader
        title="Editar proveedor"
        description={`Actualiza la información de ${proveedor.nombreComercial}.`}
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href={`/administracion/compras/proveedores/${proveedor.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Regresar al detalle
        </Link>

        {mensajeError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {mensajeError}
          </div>
        )}

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
              <Building2 size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                {proveedor.codigo}
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {proveedor.nombreComercial}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Modifica únicamente la información que sea necesaria.
              </p>
            </div>
          </div>
        </article>

        <form
          action={actualizar}
          className="space-y-6"
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                  <Building2 size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Información comercial
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Identificación y clasificación del proveedor.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="nombreComercial"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nombre comercial
                  </label>

                  <input
                    id="nombreComercial"
                    name="nombreComercial"
                    required
                    maxLength={150}
                    defaultValue={
                      proveedor.nombreComercial
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="razonSocial"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Razón social
                  </label>

                  <input
                    id="razonSocial"
                    name="razonSocial"
                    maxLength={180}
                    defaultValue={
                      proveedor.razonSocial ?? ""
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nit"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    NIT
                  </label>

                  <input
                    id="nit"
                    name="nit"
                    required
                    maxLength={25}
                    defaultValue={proveedor.nit}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="tipo"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Tipo de proveedor
                  </label>

                  <select
                    id="tipo"
                    name="tipo"
                    required
                    defaultValue={proveedor.tipo}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="PRODUCTOS">
                      Productos
                    </option>

                    <option value="SERVICIOS">
                      Servicios
                    </option>

                    <option value="MIXTO">
                      Productos y servicios
                    </option>
                  </select>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                  <UserRound size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Información de contacto
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Persona responsable y canales comerciales.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="contactoPrincipal"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nombre del contacto
                  </label>

                  <input
                    id="contactoPrincipal"
                    name="contactoPrincipal"
                    maxLength={150}
                    defaultValue={
                      proveedor.contactoPrincipal ??
                      ""
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefonoContacto"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Teléfono del contacto
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="telefonoContacto"
                      name="telefonoContacto"
                      maxLength={30}
                      defaultValue={
                        proveedor.telefonoContacto ??
                        ""
                      }
                      className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="telefono"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Teléfono comercial
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="telefono"
                      name="telefono"
                      maxLength={30}
                      defaultValue={
                        proveedor.telefono ?? ""
                      }
                      className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="correo"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Correo electrónico
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="correo"
                      name="correo"
                      type="email"
                      maxLength={180}
                      defaultValue={
                        proveedor.correo ?? ""
                      }
                      className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <MapPin size={24} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ubicación y observaciones
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Dirección comercial y notas internas.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <div>
                <label
                  htmlFor="direccion"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Dirección
                </label>

                <textarea
                  id="direccion"
                  name="direccion"
                  rows={5}
                  defaultValue={
                    proveedor.direccion ?? ""
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="observaciones"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Observaciones
                </label>

                <textarea
                  id="observaciones"
                  name="observaciones"
                  rows={5}
                  defaultValue={
                    proveedor.observaciones ?? ""
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
          </article>

          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-end">
            <Link
              href={`/administracion/compras/proveedores/${proveedor.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Save size={18} />
              Guardar cambios
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}