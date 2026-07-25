import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  UserMinus,
  UserRoundCheck,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requerirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const resumen = [
  {
    titulo: "Presentes hoy",
    cantidad: 8,
    icono: UserRoundCheck,
    estilos: {
      borde: "border-emerald-200",
      fondo: "bg-emerald-50",
      fondoIcono: "bg-emerald-100",
      textoIcono: "text-emerald-700",
      textoCantidad: "text-emerald-700",
    },
  },
  {
    titulo: "Tardanzas",
    cantidad: 2,
    icono: Clock3,
    estilos: {
      borde: "border-amber-200",
      fondo: "bg-amber-50",
      fondoIcono: "bg-amber-100",
      textoIcono: "text-amber-700",
      textoCantidad: "text-amber-700",
    },
  },
  {
    titulo: "Ausentes",
    cantidad: 1,
    icono: UserMinus,
    estilos: {
      borde: "border-red-200",
      fondo: "bg-red-50",
      fondoIcono: "bg-red-100",
      textoIcono: "text-red-700",
      textoCantidad: "text-red-700",
    },
  },
  {
    titulo: "Permisos",
    cantidad: 1,
    icono: HeartPulse,
    estilos: {
      borde: "border-blue-200",
      fondo: "bg-blue-50",
      fondoIcono: "bg-blue-100",
      textoIcono: "text-blue-700",
      textoCantidad: "text-blue-700",
    },
  },
];

const asistenciasEjemplo = [
  {
    id: 1,
    empleado: "Carlos Godoy",
    fecha: "25/07/2026",
    entrada: "07:55",
    salida: "17:05",
    estado: "PRESENTE",
    observacion: "Jornada completa",
  },
  {
    id: 2,
    empleado: "Rubén López",
    fecha: "25/07/2026",
    entrada: "08:18",
    salida: "17:00",
    estado: "TARDE",
    observacion: "18 minutos de retraso",
  },
  {
    id: 3,
    empleado: "José Martínez",
    fecha: "25/07/2026",
    entrada: "—",
    salida: "—",
    estado: "AUSENTE",
    observacion: "Sin justificación",
  },
  {
    id: 4,
    empleado: "Luis Pérez",
    fecha: "25/07/2026",
    entrada: "—",
    salida: "—",
    estado: "PERMISO",
    observacion: "Cita médica",
  },
];

function obtenerEstiloEstado(estado: string) {
  switch (estado) {
    case "PRESENTE":
      return "bg-emerald-100 text-emerald-700";

    case "TARDE":
      return "bg-amber-100 text-amber-700";

    case "AUSENTE":
      return "bg-red-100 text-red-700";

    case "PERMISO":
      return "bg-blue-100 text-blue-700";

    case "VACACIONES":
      return "bg-purple-100 text-purple-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function AsistenciasPage() {
  await requerirAdmin();

  return (
    <AppShell>
      <PageHeader
        title="Control de Asistencias"
        description="Gestiona entradas, salidas y estados laborales del personal"
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Resumen del día
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Estado actual de las asistencias registradas.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <CheckCircle2 size={18} />
            Registrar asistencia
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {resumen.map((item) => {
            const Icono = item.icono;

            return (
              <article
                key={item.titulo}
                className={`rounded-2xl border p-5 shadow-sm ${item.estilos.borde} ${item.estilos.fondo}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      {item.titulo}
                    </p>

                    <p
                      className={`mt-2 text-3xl font-bold ${item.estilos.textoCantidad}`}
                    >
                      {item.cantidad}
                    </p>
                  </div>

                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${item.estilos.fondoIcono} ${item.estilos.textoIcono}`}
                  >
                    <Icono size={24} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Registro de asistencias
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Listado de entradas, salidas y estados del personal.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Empleado</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Entrada</th>
                  <th className="px-5 py-4">Salida</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Observación</th>
                  <th className="px-5 py-4">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {asistenciasEjemplo.map((asistencia) => (
                  <tr
                    key={asistencia.id}
                    className="text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                      {asistencia.empleado}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {asistencia.fecha}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {asistencia.entrada}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {asistencia.salida}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${obtenerEstiloEstado(
                          asistencia.estado,
                        )}`}
                      >
                        {asistencia.estado}
                      </span>
                    </td>

                    <td className="min-w-[220px] px-5 py-4">
                      {asistencia.observacion}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}