import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ShieldAlert,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    estado?: string;
    nombre?: string;
    hora?: string;
    fecha?: string;
    mensaje?: string;
  }>;
};

function obtenerPresentacion(estado: string) {
  if (
    estado === "ENTRADA" ||
    estado === "SALIDA"
  ) {
    return {
      icono: CheckCircle2,
      iconoClases:
        "bg-emerald-100 text-emerald-700",
      titulo:
        estado === "ENTRADA"
          ? "Entrada registrada"
          : "Salida registrada",
      tarjeta:
        "border-emerald-200",
    };
  }

  if (
    estado === "DUPLICADA" ||
    estado === "COMPLETA"
  ) {
    return {
      icono: Clock3,
      iconoClases:
        "bg-amber-100 text-amber-700",
      titulo: "Marcación ya registrada",
      tarjeta: "border-amber-200",
    };
  }

  if (estado === "RED_NO_AUTORIZADA") {
    return {
      icono: ShieldAlert,
      iconoClases: "bg-red-100 text-red-700",
      titulo: "Red no autorizada",
      tarjeta: "border-red-200",
    };
  }

  return {
    icono: XCircle,
    iconoClases: "bg-red-100 text-red-700",
    titulo: "No fue posible registrar",
    tarjeta: "border-red-200",
  };
}

export default async function ResultadoAsistenciaPage({
  searchParams,
}: PageProps) {
  const parametros = await searchParams;

  const estado = parametros.estado ?? "ERROR";
  const presentacion =
    obtenerPresentacion(estado);

  const Icono = presentacion.icono;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
      <section
        className={`w-full max-w-lg rounded-3xl border bg-white p-7 text-center shadow-xl ${presentacion.tarjeta}`}
      >
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl ${presentacion.iconoClases}`}
        >
          <Icono size={39} />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          {presentacion.titulo}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {parametros.mensaje ??
            "No se pudo completar la marcación."}
        </p>

        {parametros.nombre && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="text-lg font-bold text-slate-900">
              {parametros.nombre}
            </p>

            {parametros.fecha && (
              <p className="mt-2 text-sm text-slate-500">
                Fecha: {parametros.fecha}
              </p>
            )}

            {parametros.hora && (
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {parametros.hora}
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-slate-400">
          La fecha y la hora fueron tomadas directamente
          del servidor de AC-911.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cerrar
        </Link>
      </section>
    </main>
  );
}