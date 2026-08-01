import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Eye,
  Mail,
  Package,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings2,
  Wrench,
} from "lucide-react";
import { asc } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { proveedores } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{
    buscar?: string | string[];
    tipo?: string | string[];
    eliminado?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

function obtenerParametro(
  valor: string | string[] | undefined,
) {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function obtenerNombreTipo(tipo: string) {
  switch (tipo) {
    case "PRODUCTOS":
      return "Productos";
    case "SERVICIOS":
      return "Servicios";
    case "MIXTO":
      return "Mixto";
    default:
      return tipo;
  }
}

function obtenerEstiloTipo(tipo: string) {
  switch (tipo) {
    case "PRODUCTOS":
      return {
        clases: "bg-blue-100 text-blue-700",
        icono: Package,
      };

    case "SERVICIOS":
      return {
        clases: "bg-purple-100 text-purple-700",
        icono: Wrench,
      };

    case "MIXTO":
      return {
        clases: "bg-orange-100 text-orange-700",
        icono: Settings2,
      };

    default:
      return {
        clases: "bg-slate-100 text-slate-700",
        icono: Building2,
      };
  }
}

export default async function ProveedoresPage({
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const parametros = await searchParams;

  const busqueda = obtenerParametro(
    parametros.buscar,
  ).toLowerCase();

  const tipoFiltro = obtenerParametro(
    parametros.tipo,
  );

  const listaProveedores = await db
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
    })
    .from(proveedores)
    .orderBy(
      asc(proveedores.nombreComercial),
    );

  const proveedoresFiltrados =
    listaProveedores.filter((proveedor) => {
      const textoProveedor = [
        proveedor.codigo,
        proveedor.nombreComercial,
        proveedor.razonSocial,
        proveedor.nit,
        proveedor.telefono,
        proveedor.correo,
        proveedor.contactoPrincipal,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda =
        !busqueda ||
        textoProveedor.includes(busqueda);

      const coincideTipo =
        !tipoFiltro ||
        proveedor.tipo === tipoFiltro;

      return coincideBusqueda && coincideTipo;
    });

  const productos = listaProveedores.filter(
    (proveedor) =>
      proveedor.tipo === "PRODUCTOS",
  ).length;

  const servicios = listaProveedores.filter(
    (proveedor) =>
      proveedor.tipo === "SERVICIOS",
  ).length;

  const mixtos = listaProveedores.filter(
    (proveedor) =>
      proveedor.tipo === "MIXTO",
  ).length;

  const hayFiltros =
    Boolean(busqueda) ||
    Boolean(tipoFiltro);

  return (
    <AppShell>
      <PageHeader
        title="Proveedores"
        description="Administra los proveedores de productos y servicios utilizados por AC911."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div>
          <Link
            href="/administracion/compras"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={18} />
            Regresar a Compras
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <Building2 size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total proveedores
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {listaProveedores.length}
                </p>

                <p className="text-xs text-slate-400">
                  Registrados en el sistema
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <Package size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Productos
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {productos}
                </p>

                <p className="text-xs text-slate-400">
                  Proveen artículos
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                <Wrench size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Servicios
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {servicios}
                </p>

                <p className="text-xs text-slate-400">
                  Proveen servicios
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                <Settings2 size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Mixtos
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {mixtos}
                </p>

                <p className="text-xs text-slate-400">
                  Productos y servicios
                </p>
              </div>
            </div>
          </article>
        </div>

        {parametros.eliminado === "1" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Proveedor eliminado correctamente.
          </div>
        )}

        {parametros.error === "id" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            El proveedor seleccionado no existe o no es válido.
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <form
              method="get"
              className="grid flex-1 gap-4 md:grid-cols-[1fr_240px_auto]"
            >
              <div>
                <label
                  htmlFor="buscar"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Buscar proveedor
                </label>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="buscar"
                    name="buscar"
                    defaultValue={obtenerParametro(
                      parametros.buscar,
                    )}
                    placeholder="Código, nombre, NIT, teléfono o correo"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="tipo"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Tipo
                </label>

                <select
                  id="tipo"
                  name="tipo"
                  defaultValue={tipoFiltro}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Todos los tipos
                  </option>
                  <option value="PRODUCTOS">
                    Productos
                  </option>
                  <option value="SERVICIOS">
                    Servicios
                  </option>
                  <option value="MIXTO">
                    Mixto
                  </option>
                </select>
              </div>

              <div className="flex gap-2 md:items-end">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Search size={17} />
                  Buscar
                </button>

                {hayFiltros && (
                  <Link
                    href="/administracion/compras/proveedores"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Limpiar
                  </Link>
                )}
              </div>
            </form>

            <Link
              href="/administracion/compras/proveedores/nuevo"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={18} />
              Nuevo proveedor
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Proveedores registrados
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {hayFiltros
                  ? `Mostrando ${proveedoresFiltrados.length} de ${listaProveedores.length}`
                  : `${listaProveedores.length} proveedores registrados`}
              </p>
            </div>

            {hayFiltros && (
              <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                Filtros activos
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Proveedor
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    NIT
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tipo
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contacto
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Datos comerciales
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {proveedoresFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                        <Building2 size={27} />
                      </div>

                      <p className="mt-4 font-semibold text-slate-700">
                        No se encontraron proveedores
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Registra un proveedor nuevo o cambia los filtros.
                      </p>

                      <Link
                        href="/administracion/compras/proveedores/nuevo"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Plus size={18} />
                        Registrar proveedor
                      </Link>
                    </td>
                  </tr>
                ) : (
                  proveedoresFiltrados.map(
                    (proveedor) => {
                      const estilo =
                        obtenerEstiloTipo(
                          proveedor.tipo,
                        );

                      const IconoTipo =
                        estilo.icono;

                      return (
                        <tr
                          key={proveedor.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex min-w-[250px] items-center gap-3">
                              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                                <Building2 size={21} />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {
                                    proveedor.nombreComercial
                                  }
                                </p>

                                <p className="mt-1 text-xs font-bold text-blue-700">
                                  {proveedor.codigo}
                                </p>

                                {proveedor.razonSocial && (
                                  <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                                    {
                                      proveedor.razonSocial
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                            {proveedor.nit}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${estilo.clases}`}
                            >
                              <IconoTipo size={14} />
                              {obtenerNombreTipo(
                                proveedor.tipo,
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="min-w-[190px] text-sm">
                              <p className="font-semibold text-slate-800">
                                {proveedor.contactoPrincipal ||
                                  "Sin contacto"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {proveedor.telefonoContacto ||
                                  "Sin teléfono de contacto"}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="min-w-[230px] space-y-2 text-xs text-slate-600">
                              <p className="flex items-center gap-2">
                                <Phone
                                  size={14}
                                  className="text-slate-400"
                                />
                                {proveedor.telefono ||
                                  "Sin teléfono"}
                              </p>

                              <p className="flex items-center gap-2">
                                <Mail
                                  size={14}
                                  className="text-slate-400"
                                />
                                {proveedor.correo ||
                                  "Sin correo"}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/administracion/compras/proveedores/${proveedor.id}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Eye size={16} />
                                Detalle
                              </Link>

                              <Link
                                href={`/administracion/compras/proveedores/${proveedor.id}/editar`}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                              >
                                <Pencil size={16} />
                                Editar
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
