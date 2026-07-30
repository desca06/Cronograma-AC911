import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  ClipboardList,
  FileText,
  Hash,
  Package,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  articulosInventario,
  movimientosInventario,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function obtenerEstiloMovimiento(tipo: string) {
  switch (tipo) {
    case "ENTRADA":
      return {
        texto: "Entrada",
        clases: "bg-emerald-100 text-emerald-700",
        icono: ArrowDownToLine,
      };

    case "SALIDA":
      return {
        texto: "Salida",
        clases: "bg-red-100 text-red-700",
        icono: ArrowUpFromLine,
      };

    case "AJUSTE_POSITIVO":
      return {
        texto: "Ajuste positivo",
        clases: "bg-blue-100 text-blue-700",
        icono: SlidersHorizontal,
      };

    case "AJUSTE_NEGATIVO":
      return {
        texto: "Ajuste negativo",
        clases: "bg-amber-100 text-amber-700",
        icono: SlidersHorizontal,
      };

    default:
      return {
        texto: tipo.replaceAll("_", " "),
        clases: "bg-slate-100 text-slate-700",
        icono: ClipboardList,
      };
  }
}

function formatearFecha(fecha: Date | string | null) {
  if (!fecha) {
    return "Sin fecha registrada";
  }

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(fecha));
}

export default async function DetalleMovimientoInventarioPage({
  params,
}: PageProps) {
  await requerirAdmin();

  const { id } = await params;
  const movimientoId = Number(id)

  const [movimiento] = await db
    .select({
      id: movimientosInventario.id,
      articuloId: movimientosInventario.articuloId,
      usuarioId: movimientosInventario.usuarioId,
      tipoMovimiento: movimientosInventario.tipoMovimiento,
      cantidad: movimientosInventario.cantidad,
      existenciaAnterior: movimientosInventario.existenciaAnterior,
      existenciaNueva: movimientosInventario.existenciaNueva,
      motivo: movimientosInventario.motivo,
      observaciones: movimientosInventario.observaciones,
      documentoReferencia: movimientosInventario.documentoReferencia,
      creadoEn: movimientosInventario.creadoEn,

      codigoArticulo: articulosInventario.codigo,
      nombreArticulo: articulosInventario.nombre,
      unidadMedida: articulosInventario.unidadMedida,
    })
    .from(movimientosInventario)
    .leftJoin(
      articulosInventario,
      eq(movimientosInventario.articuloId, articulosInventario.id)
    )
    .where(eq(movimientosInventario.id, movimientoId))
    .limit(1);

  if (!movimiento) {
    notFound();
  }

  const estilo = obtenerEstiloMovimiento(movimiento.tipoMovimiento);
  const IconoMovimiento = estilo.icono;

  const cantidadConSigno =
    movimiento.tipoMovimiento === "SALIDA" ||
    movimiento.tipoMovimiento === "AJUSTE_NEGATIVO"
      ? `-${movimiento.cantidad}`
      : `+${movimiento.cantidad}`;

  return (
    <AppShell>
      <PageHeader
        title="Detalle del movimiento"
        description="Consulta toda la información registrada para este movimiento de inventario."
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href="/administracion/inventario/existencias/movimientos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Regresar a Movimientos
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`grid h-14 w-14 place-items-center rounded-2xl ${estilo.clases}`}
              >
                <IconoMovimiento size={26} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Movimiento de inventario
                </p>
                <h2 className="text-xl font-bold text-slate-900">
                  {movimiento.nombreArticulo ?? "Artículo no disponible"}
                </h2>
                <p className="text-sm text-slate-500">
                  Código: {movimiento.codigoArticulo ?? "Sin código"}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${estilo.clases}`}
            >
              <IconoMovimiento size={16} />
              {estilo.texto}
            </span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <Package size={20} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Información del artículo
                </h3>
                <p className="text-sm text-slate-500">
                  Datos relacionados con el artículo afectado.
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {movimiento.nombreArticulo ?? "No disponible"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Código
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {movimiento.codigoArticulo ?? "Sin código"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unidad de medida
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {movimiento.unidadMedida ?? "No registrada"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ID del artículo
                </dt>
                <dd className="mt-1 break-all font-mono text-sm text-slate-700">
                  {movimiento.articuloId}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
                <ClipboardList size={20} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Información del movimiento
                </h3>
                <p className="text-sm text-slate-500">
                  Existencias antes y después de la operación.
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tipo
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {estilo.texto}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cantidad
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-900">
                  {cantidadConSigno}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Existencia anterior
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-700">
                  {movimiento.existenciaAnterior}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Existencia nueva
                </dt>
                <dd className="mt-1 text-2xl font-bold text-blue-700">
                  {movimiento.existenciaNueva}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <FileText size={20} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Detalles adicionales
              </h3>
              <p className="text-sm text-slate-500">
                Motivo, observaciones, fecha y responsable.
              </p>
            </div>
          </div>

          <dl className="grid gap-5 md:grid-cols-2">
            <div>
              <dt className="mb-2 text-sm font-semibold text-slate-600">
                Motivo
              </dt>
              <dd className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
                {movimiento.motivo}
              </dd>
            </div>

            <div>
              <dt className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Hash size={16} />
                Documento de referencia
              </dt>
              <dd className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
                {movimiento.documentoReferencia || "No aplica"}
              </dd>
            </div>

            <div className="md:col-span-2">
              <dt className="mb-2 text-sm font-semibold text-slate-600">
                Observaciones
              </dt>
              <dd className="min-h-24 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
                {movimiento.observaciones || "Sin observaciones"}
              </dd>
            </div>

            <div>
              <dt className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <CalendarDays size={16} />
                Fecha y hora
              </dt>
              <dd className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
                {formatearFecha(movimiento.creadoEn)}
              </dd>
            </div>

            <div>
              <dt className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <UserRound size={16} />
                Usuario responsable
              </dt>
              <dd className="break-all rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
                {movimiento.usuarioId ?? "Usuario no registrado"}
              </dd>
            </div>

            <div className="md:col-span-2">
              <dt className="mb-2 text-sm font-semibold text-slate-600">
                ID del movimiento
              </dt>
              <dd className="break-all rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700">
                {movimiento.id}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </AppShell>
  );
}