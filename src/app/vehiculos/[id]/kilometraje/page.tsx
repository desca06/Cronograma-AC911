import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gauge } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  vehiculoKilometraje,
  vehiculos,
  usuarios,
  trabajos,
  clientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import { ajustarKilometraje } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

function formatearKm(valor: number | null | undefined) {
  if (valor == null) {
    return "—";
  }

  return `${new Intl.NumberFormat("es-GT").format(valor)} km`;
}

export default async function KilometrajeVehiculoPage({
  params,
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;
  const vehiculoId = Number(id);

  if (!Number.isInteger(vehiculoId) || vehiculoId <= 0) {
    notFound();
  }

  const [vehiculo] = await db
    .select({
      id: vehiculos.id,
      nombre: vehiculos.nombre,
      placa: vehiculos.placa,
      marca: vehiculos.marca,
      modelo: vehiculos.modelo,
      kmActual: vehiculos.kmActual,
    })
    .from(vehiculos)
    .where(eq(vehiculos.id, vehiculoId))
    .limit(1);

  if (!vehiculo) {
    notFound();
  }

  const historial = await db
    .select({
      id: vehiculoKilometraje.id,
      tipo: vehiculoKilometraje.tipo,
      kmAnterior: vehiculoKilometraje.kmAnterior,
      kmSalida: vehiculoKilometraje.kmSalida,
      kmLlegada: vehiculoKilometraje.kmLlegada,
      kmRecorridos: vehiculoKilometraje.kmRecorridos,
      nota: vehiculoKilometraje.nota,
      creadoEn: vehiculoKilometraje.creadoEn,
      autor: usuarios.nombre,
      trabajoId: trabajos.id,
      trabajoFecha: trabajos.fecha,
      clienteNombre: clientes.nombre,
    })
    .from(vehiculoKilometraje)
    .leftJoin(
      usuarios,
      eq(vehiculoKilometraje.usuarioId, usuarios.id),
    )
    .leftJoin(
      trabajos,
      eq(vehiculoKilometraje.trabajoId, trabajos.id),
    )
    .leftJoin(
      clientes,
      eq(trabajos.clienteId, clientes.id),
    )
    .where(eq(vehiculoKilometraje.vehiculoId, vehiculoId))
    .orderBy(desc(vehiculoKilometraje.creadoEn));

  const kmRecorridosTotal = historial
    .filter((item) => item.tipo === "TRABAJO")
    .reduce((total, item) => total + item.kmRecorridos, 0);

  return (
    <AppShell>
      <PageHeader
        title={`Kilometraje · ${vehiculo.nombre}`}
        description={`${vehiculo.placa || "Sin placa"} · ${vehiculo.marca || ""} ${vehiculo.modelo || ""}`.trim()}
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href="/vehiculos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          Volver a vehículos
        </Link>

        {parametros.error === "km" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            El kilometraje debe ser un número entero mayor o igual a 0.
          </div>
        )}

        {parametros.success === "ajuste" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Kilometraje actualizado.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <Gauge size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Km actual
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatearKm(vehiculo.kmActual)}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Recorrido en trabajos
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatearKm(kmRecorridosTotal)}
            </p>
          </article>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Ajuste manual
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Usalo si el odómetro no coincide. Queda en el historial.
          </p>

          <form action={ajustarKilometraje} className="mt-5 grid gap-4 md:grid-cols-3">
            <input type="hidden" name="vehiculoId" value={vehiculo.id} />

            <div>
              <label
                htmlFor="kmNuevo"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Km actual
              </label>
              <input
                id="kmNuevo"
                name="kmNuevo"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={vehiculo.kmActual}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="nota"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Motivo
              </label>
              <input
                id="nota"
                name="nota"
                type="text"
                placeholder="Ejemplo: Corrección de odómetro"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Guardar ajuste
              </button>
            </div>
          </form>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Historial de kilometraje
            </h2>
          </div>

          {historial.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Todavía no hay movimientos de km.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Salida</th>
                    <th className="px-5 py-3">Llegada</th>
                    <th className="px-5 py-3">Recorrido</th>
                    <th className="px-5 py-3">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {historial.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {formatearFecha(item.creadoEn)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            item.tipo === "TRABAJO"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.tipo === "TRABAJO" ? "Trabajo" : "Ajuste"}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {formatearKm(item.kmSalida)}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {formatearKm(item.kmLlegada)}
                      </td>
                      <td className="px-5 py-3 font-bold text-emerald-700">
                        {item.kmRecorridos >= 0
                          ? `+${formatearKm(item.kmRecorridos)}`
                          : formatearKm(item.kmRecorridos)}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {item.trabajoId
                          ? `Trabajo #${item.trabajoId}${item.clienteNombre ? ` · ${item.clienteNombre}` : ""}`
                          : item.nota || item.autor || "Ajuste"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </AppShell>
  );
}