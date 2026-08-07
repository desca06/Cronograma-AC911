import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Home,
  TriangleAlert,
} from "lucide-react";
import {
  and,
  asc,
  gte,
  lte,
} from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  cronogramaNotasCemaco,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import {
  CalendarioCemacoEditable,
} from "./calendario-cemaco-editable";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CalendarioCemacoPageProps = {
  searchParams: Promise<{
    mes?: string | string[];
  }>;
};

function obtenerMesActual(): string {
  return new Date()
    .toLocaleDateString("en-CA", {
      timeZone: "America/Guatemala",
    })
    .slice(0, 7);
}

function normalizarMes(
  valor: string,
) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(
    valor,
  )
    ? valor
    : obtenerMesActual();
}

function obtenerRangoMes(
  mes: string,
) {
  const [anio, numeroMes] = mes
    .split("-")
    .map(Number);

  const diasMes = new Date(
    Date.UTC(
      anio,
      numeroMes,
      0,
    ),
  ).getUTCDate();

  return {
    fechaInicio: `${mes}-01`,
    fechaFin: `${mes}-${String(
      diasMes,
    ).padStart(2, "0")}`,
    diasMes,
  };
}

function formatearMes(
  mes: string,
) {
  const [anio, numeroMes] = mes
    .split("-")
    .map(Number);

  const texto =
    new Intl.DateTimeFormat(
      "es-GT",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      },
    ).format(
      new Date(
        Date.UTC(
          anio,
          numeroMes - 1,
          1,
        ),
      ),
    );

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
}

export default async function CalendarioCemacoPage({
  searchParams,
}: CalendarioCemacoPageProps) {
  await requerirAdmin();

  const parametros =
    await searchParams;

  const mesParametro =
    typeof parametros.mes === "string"
      ? parametros.mes
      : "";

  const mesSeleccionado =
    normalizarMes(
      mesParametro,
    );

  const {
    fechaInicio,
    fechaFin,
    diasMes,
  } = obtenerRangoMes(
    mesSeleccionado,
  );

  const notas = await db
    .select({
      id: cronogramaNotasCemaco.id,
      fecha:
        cronogramaNotasCemaco.fecha,
      contenido:
        cronogramaNotasCemaco.contenido,
      importancia:
        cronogramaNotasCemaco.importancia,
      actualizadoEn:
        cronogramaNotasCemaco.actualizadoEn,
    })
    .from(
      cronogramaNotasCemaco,
    )
    .where(
      and(
        gte(
          cronogramaNotasCemaco.fecha,
          fechaInicio,
        ),
        lte(
          cronogramaNotasCemaco.fecha,
          fechaFin,
        ),
      ),
    )
    .orderBy(
      asc(
        cronogramaNotasCemaco.fecha,
      ),
    );

  const totalCumplidos =
    notas.filter(
      (nota) =>
        nota.importancia ===
        "CUMPLIDO",
    ).length;

  const totalEnProceso =
    notas.filter(
      (nota) =>
        nota.importancia ===
        "EN_PROCESO",
    ).length;

  const totalPendientes =
    notas.filter(
      (nota) =>
        nota.importancia ===
        "PENDIENTE",
    ).length;

  const totalUrgentes =
    notas.filter(
      (nota) =>
        nota.importancia ===
        "URGENTE",
    ).length;

  return (
    <AppShell>
      <PageHeader
        title="Calendario CEMACO"
        description={`Organiza y edita las actividades CEMACO de ${formatearMes(
          mesSeleccionado,
        )}.`}
      />

      <section className="space-y-7 p-5 md:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-end">
            <form
              method="GET"
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div>
                <label
                  htmlFor="mes"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Mes de CEMACO
                </label>

                <input
                  id="mes"
                  name="mes"
                  type="month"
                  defaultValue={
                    mesSeleccionado
                  }
                  className="form-control w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-52"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <CalendarDays
                  size={17}
                />
                Ver calendario
              </button>

              <Link
                href="/cronograma/cemaco"
                className="btn btn-outline-primary inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <Clock3
                  size={17}
                />
                Ver hoy
              </Link>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cronograma"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <CalendarDays
                  size={17}
                />
                Cronograma general
              </Link>

              <Link
                href="/dashboard"
                className="btn btn-outline-secondary inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Home
                  size={17}
                />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-700">
              Cumplidos
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {totalCumplidos}
            </p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-700">
              En proceso
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-900">
              {totalEnProceso}
            </p>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">
              Pendientes
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {totalPendientes}
            </p>
          </article>

          <article className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-red-700">
                Urgentes
              </p>

              <TriangleAlert
                size={21}
              />
            </div>

            <p className="mt-2 text-3xl font-bold text-red-900">
              {totalUrgentes}
            </p>
          </article>
        </section>

        <CalendarioCemacoEditable
          key={mesSeleccionado}
          mes={mesSeleccionado}
          diasMes={diasMes}
          notasIniciales={notas}
          trabajos={[]}
        />
      </section>
    </AppShell>
  );
}