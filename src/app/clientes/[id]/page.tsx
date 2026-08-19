import { asc, eq, inArray } from "drizzle-orm";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  clienteAreas,
  clienteSubtiendas,
  clientes,
} from "@/db/schema";
import { requerirSupervisor } from "@/lib/auth";

import {
  crearArea,
  crearSubtienda,
  eliminarArea,
  eliminarSubtienda,
} from "../actions-ubicaciones";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    exito?: string | string[];
  }>;
};

function leerTexto(
  valor: string | string[] | undefined,
) {
  return typeof valor === "string" ? valor : "";
}

export default async function ClienteUbicacionesPage({
  params,
  searchParams,
}: PageProps) {
  await requerirSupervisor();

  const { id } = await params;
  const parametros = await searchParams;
  const clienteId = Number(id);

  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    notFound();
  }

  const [cliente] = await db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      telefono: clientes.telefono,
      direccion: clientes.direccion,
    })
    .from(clientes)
    .where(eq(clientes.id, clienteId))
    .limit(1);

  if (!cliente) {
    notFound();
  }

  const listaSubtiendas = await db
    .select({
      id: clienteSubtiendas.id,
      nombre: clienteSubtiendas.nombre,
    })
    .from(clienteSubtiendas)
    .where(eq(clienteSubtiendas.clienteId, clienteId))
    .orderBy(asc(clienteSubtiendas.nombre));

  const listaAreas =
    listaSubtiendas.length === 0
      ? []
      : await db
          .select({
            id: clienteAreas.id,
            nombre: clienteAreas.nombre,
            subtiendaId: clienteAreas.subtiendaId,
          })
          .from(clienteAreas)
          .where(
            inArray(
              clienteAreas.subtiendaId,
              listaSubtiendas.map((item) => item.id),
            ),
          )
          .orderBy(asc(clienteAreas.nombre));

  const error = leerTexto(parametros.error);
  const exito = leerTexto(parametros.exito);

  const mensajeError =
    error === "nombre"
      ? "Escribí el nombre antes de guardar."
      : error === "datos"
        ? "Los datos enviados no son válidos."
        : "";

  const mensajeExito =
    exito === "subtienda"
      ? "Subtienda agregada."
      : exito === "subtienda-eliminada"
        ? "Subtienda eliminada."
        : exito === "area"
          ? "Área agregada."
          : exito === "area-eliminada"
            ? "Área eliminada."
            : "";

  return (
    <AppShell>
      <PageHeader
        title="Subtiendas y áreas"
        description={`Ubicaciones de ${cliente.nombre} para asignar en los trabajos.`}
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Volver a clientes
        </Link>

        {mensajeError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {mensajeError}
          </div>
        )}

        {mensajeExito && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {mensajeExito}
          </div>
        )}

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">
            Cliente #{cliente.id}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            {cliente.nombre}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {cliente.direccion || "Sin dirección"}
            {cliente.telefono ? ` · ${cliente.telefono}` : ""}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
              <Store size={21} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                Nueva subtienda
              </h3>
              <p className="text-sm text-slate-500">
                Ejemplo: Subtienda 1, Roosevelt, Portales.
              </p>
            </div>
          </div>

          <form
            action={crearSubtienda}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="hidden"
              name="clienteId"
              value={cliente.id}
            />
            <input
              name="nombre"
              required
              placeholder="Nombre de la subtienda"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Agregar
            </button>
          </form>
        </article>

        {listaSubtiendas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-lg font-bold text-slate-900">
              Todavía no hay subtiendas
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Agregá la primera para luego cargar sus áreas.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {listaSubtiendas.map((subtienda) => {
              const areas = listaAreas.filter(
                (area) => area.subtiendaId === subtienda.id,
              );

              return (
                <article
                  key={subtienda.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700">
                        <Store size={21} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {subtienda.nombre}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {areas.length} área
                          {areas.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <form action={eliminarSubtienda}>
                      <input
                        type="hidden"
                        name="clienteId"
                        value={cliente.id}
                      />
                      <input
                        type="hidden"
                        name="subtiendaId"
                        value={subtienda.id}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
                      >
                        <Trash2 size={16} />
                        Eliminar subtienda
                      </button>
                    </form>
                  </div>

                  <form
                    action={crearArea}
                    className="mt-5 flex flex-col gap-3 sm:flex-row"
                  >
                    <input
                      type="hidden"
                      name="clienteId"
                      value={cliente.id}
                    />
                    <input
                      type="hidden"
                      name="subtiendaId"
                      value={subtienda.id}
                    />
                    <input
                      name="nombre"
                      required
                      placeholder="Nombre del área"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-800 hover:bg-violet-100"
                    >
                      <Plus size={17} />
                      Agregar área
                    </button>
                  </form>

                  {areas.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      Esta subtienda todavía no tiene áreas.
                    </p>
                  ) : (
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {areas.map((area) => (
                        <li
                          key={area.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <MapPin
                              size={16}
                              className="text-violet-600"
                            />
                            {area.nombre}
                          </span>

                          <form action={eliminarArea}>
                            <input
                              type="hidden"
                              name="clienteId"
                              value={cliente.id}
                            />
                            <input
                              type="hidden"
                              name="areaId"
                              value={area.id}
                            />
                            <button
                              type="submit"
                              className="text-xs font-semibold text-red-600 hover:text-red-800"
                            >
                              Quitar
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}