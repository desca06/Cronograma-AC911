import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Home,
  Plus,
  TriangleAlert,
} from "lucide-react";
import {
  and,
  asc,
  eq,
  gte,
  lte,
} from "drizzle-orm";

import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  cronogramaNotasCemaco,
  trabajos,
} from "@/db/schema";
import {
  requerirAdmin,
} from "@/lib/auth";

import {
  CalendarioCemacoEditable,
} from "./calendario-cemaco-editable";

export const dynamic =
  "force-dynamic";
export const runtime =
  "nodejs";

type Props = {
  searchParams: Promise<{
    mes?:
      | string
      | string[];
  }>;
};

function mesActual() {
  return new Date()
    .toLocaleDateString(
      "en-CA",
      {
        timeZone:
          "America/Guatemala",
      },
    )
    .slice(0, 7);
}

function normalizarMes(
  valor: string,
) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(
    valor,
  )
    ? valor
    : mesActual();
}

function rangoMes(
  mes: string,
) {
  const [
    anio,
    numeroMes,
  ] = mes
    .split("-")
    .map(Number);

  const diasMes =
    new Date(
      Date.UTC(
        anio,
        numeroMes,
        0,
      ),
    ).getUTCDate();

  return {
    inicio:
      `${mes}-01`,
    fin:
      `${mes}-${String(
        diasMes,
      ).padStart(
        2,
        "0",
      )}`,
    diasMes,
  };
}

function formatearMes(
  mes: string,
) {
  const [
    anio,
    numeroMes,
  ] = mes
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
    texto
      .charAt(0)
      .toUpperCase() +
    texto.slice(1)
  );
}

export default async function CalendarioCemacoPage({
  searchParams,
}: Props) {
  await requerirAdmin();

  const parametros =
    await searchParams;

  const mes =
    normalizarMes(
      typeof parametros.mes ===
        "string"
        ? parametros.mes
        : "",
    );

  const {
    inicio,
    fin,
    diasMes,
  } = rangoMes(mes);

  const [
    notas,
    listaTrabajos,
  ] = await Promise.all([
    db
      .select({
        id:
          cronogramaNotasCemaco.id,
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
            inicio,
          ),
          lte(
            cronogramaNotasCemaco.fecha,
            fin,
          ),
        ),
      )
      .orderBy(
        asc(
          cronogramaNotasCemaco.fecha,
        ),
      ),

    db
      .select({
        id: trabajos.id,
        fecha:
          trabajos.fecha,
        tipo:
          trabajos.tipo,
        estado:
          trabajos.estado,
        clienteNombre:
          clientes.nombre,
      })
      .from(trabajos)
      .innerJoin(
        clientes,
        eq(
          trabajos.clienteId,
          clientes.id,
        ),
      )
      .where(
        and(
          gte(
            trabajos.fecha,
            inicio,
          ),
          lte(
            trabajos.fecha,
            fin,
          ),
        ),
      )
      .orderBy(
        asc(
          trabajos.fecha,
        ),
        asc(
          trabajos.id,
        ),
      ),
  ]);

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
        description={`Actividades y trabajos programados de ${formatearMes(
          mes,
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
                    mes
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:w-52"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <CalendarDays
                  size={17}
                />
                Ver calendario
              </button>

              <Link
                href="/cronograma/cemaco"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                <Clock3
                  size={17}
                />
                Ver hoy
              </Link>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/trabajos-asignados"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <CalendarDays
                  size={17}
                />
                Trabajos asignados
              </Link>

              <Link
                href="/trabajos/nuevo"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus
                  size={17}
                />
                Crear trabajo
              </Link>

              <Link
                href="/cronograma"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <CalendarDays
                  size={17}
                />
                Cronograma general
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Home
                  size={17}
                />
                Inicio
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Resumen
            titulo="Trabajos"
            valor={
              listaTrabajos.length
            }
            clase="border-slate-200 bg-white text-slate-900"
          />

          <Resumen
            titulo="Cumplidos"
            valor={
              totalCumplidos
            }
            clase="border-emerald-200 bg-emerald-50 text-emerald-900"
          />

          <Resumen
            titulo="En proceso"
            valor={
              totalEnProceso
            }
            clase="border-amber-200 bg-amber-50 text-amber-900"
          />

          <Resumen
            titulo="Pendientes"
            valor={
              totalPendientes
            }
            clase="border-blue-200 bg-blue-50 text-blue-900"
          />

          <article className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Urgentes
              </p>
              <TriangleAlert
                size={20}
              />
            </div>
            <p className="mt-2 text-3xl font-bold">
              {
                totalUrgentes
              }
            </p>
          </article>
        </section>

        <CalendarioCemacoEditable
          key={mes}
          mes={mes}
          diasMes={
            diasMes
          }
          notasIniciales={
            notas
          }
          trabajos={
            listaTrabajos
          }
        />
      </section>
    </AppShell>
  );
}

function Resumen({
  titulo,
  valor,
  clase,
}: {
  titulo: string;
  valor: number;
  clase: string;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 ${clase}`}
    >
      <p className="text-sm font-medium">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {valor}
      </p>
    </article>
  );
}