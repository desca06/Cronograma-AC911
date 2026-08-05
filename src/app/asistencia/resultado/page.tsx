import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  LogIn,
  LogOut,
  ShieldAlert,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    estado?: string | string[];
    nombre?: string | string[];
    hora?: string | string[];
    fecha?: string | string[];
    mensaje?: string | string[];
  }>;
};

type PresentacionEstado = {
  icono: React.ElementType;
  titulo: string;
  descripcion: string;
  iconoClases: string;
  tarjeta: string;
  encabezado: string;
  etiqueta: string;
  etiquetaClases: string;
};

function obtenerParametro(
  valor: string | string[] | undefined,
) {
  return typeof valor === "string"
    ? valor
    : "";
}

function obtenerPresentacion(
  estado: string,
): PresentacionEstado {
  if (estado === "ENTRADA") {
    return {
      icono: LogIn,
      titulo: "Entrada registrada",
      descripcion:
        "Tu ingreso fue registrado correctamente en el sistema.",
      iconoClases:
        "bg-emerald-100 text-emerald-700",
      tarjeta: "border-emerald-200",
      encabezado:
        "from-emerald-50 via-white to-white",
      etiqueta: "Registro exitoso",
      etiquetaClases:
        "bg-emerald-100 text-emerald-700",
    };
  }

  if (estado === "SALIDA") {
    return {
      icono: LogOut,
      titulo: "Salida registrada",
      descripcion:
        "Tu salida fue registrada correctamente en el sistema.",
      iconoClases:
        "bg-blue-100 text-blue-700",
      tarjeta: "border-blue-200",
      encabezado:
        "from-blue-50 via-white to-white",
      etiqueta: "Registro exitoso",
      etiquetaClases:
        "bg-blue-100 text-blue-700",
    };
  }

  if (estado === "DUPLICADA") {
    return {
      icono: Clock3,
      titulo: "Entrada ya registrada",
      descripcion:
        "Tu entrada ya fue registrada recientemente. Esperá antes de volver a escanear.",
      iconoClases:
        "bg-amber-100 text-amber-700",
      tarjeta: "border-amber-200",
      encabezado:
        "from-amber-50 via-white to-white",
      etiqueta: "Marcación duplicada",
      etiquetaClases:
        "bg-amber-100 text-amber-700",
    };
  }

  if (estado === "COMPLETA") {
    return {
      icono: CheckCircle2,
      titulo: "Asistencia completa",
      descripcion:
        "La asistencia de hoy ya cuenta con entrada y salida registradas.",
      iconoClases:
        "bg-violet-100 text-violet-700",
      tarjeta: "border-violet-200",
      encabezado:
        "from-violet-50 via-white to-white",
      etiqueta: "Jornada completada",
      etiquetaClases:
        "bg-violet-100 text-violet-700",
    };
  }

  if (estado === "RED_NO_AUTORIZADA") {
    return {
      icono: ShieldAlert,
      titulo: "Red no autorizada",
      descripcion:
        "Conectate a la red Wi-Fi autorizada de AC-911 para registrar tu asistencia.",
      iconoClases:
        "bg-red-100 text-red-700",
      tarjeta: "border-red-200",
      encabezado:
        "from-red-50 via-white to-white",
      etiqueta: "Acceso bloqueado",
      etiquetaClases:
        "bg-red-100 text-red-700",
    };
  }

  return {
    icono: AlertTriangle,
    titulo: "No fue posible registrar",
    descripcion:
      "Ocurrió un problema al procesar el código QR.",
    iconoClases:
      "bg-red-100 text-red-700",
    tarjeta: "border-red-200",
    encabezado:
      "from-red-50 via-white to-white",
    etiqueta: "Error de marcación",
    etiquetaClases:
      "bg-red-100 text-red-700",
  };
}

function formatearFecha(fecha: string) {
  if (!fecha) {
    return "No disponible";
  }

  const [anio, mes, dia] = fecha
    .split("-")
    .map(Number);

  if (!anio || !mes || !dia) {
    return fecha;
  }

  const texto = new Intl.DateTimeFormat(
    "es-GT",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(anio, mes - 1, dia),
    ),
  );

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
}

function formatearHora(hora: string) {
  if (!hora) {
    return "No disponible";
  }

  return hora.slice(0, 8);
}

export default async function ResultadoAsistenciaPage({
  searchParams,
}: PageProps) {
  const parametros = await searchParams;

  const estado =
    obtenerParametro(parametros.estado) ||
    "ERROR";

  const nombre = obtenerParametro(
    parametros.nombre,
  );

  const hora = obtenerParametro(
    parametros.hora,
  );

  const fecha = obtenerParametro(
    parametros.fecha,
  );

  const mensaje = obtenerParametro(
    parametros.mensaje,
  );

  const presentacion =
    obtenerPresentacion(estado);

  const Icono = presentacion.icono;

  const registroExitoso =
    estado === "ENTRADA" ||
    estado === "SALIDA" ||
    estado === "COMPLETA";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center justify-center">
        <section
          className={`w-full overflow-hidden rounded-3xl border bg-white shadow-xl ${presentacion.tarjeta}`}
        >
          <div
            className={`bg-gradient-to-b px-5 py-7 text-center sm:px-10 sm:py-10 ${presentacion.encabezado}`}
          >
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl sm:h-24 sm:w-24 ${presentacion.iconoClases}`}
            >
              <Icono
                size={42}
                className="sm:h-12 sm:w-12"
              />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Control de asistencia AC-911
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              {presentacion.titulo}
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
              {mensaje ||
                presentacion.descripcion}
            </p>

            <span
              className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold sm:text-sm ${presentacion.etiquetaClases}`}
            >
              {registroExitoso && (
                <CheckCircle2 size={16} />
              )}

              {presentacion.etiqueta}
            </span>
          </div>

          {(nombre || fecha || hora) && (
            <div className="border-t border-slate-200 px-5 py-6 sm:px-8">
              <div className="grid gap-4">
                {nombre && (
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <UserRound size={25} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Empleado
                      </p>

                      <p className="mt-1 break-words text-lg font-bold text-slate-950">
                        {nombre}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {fecha && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                          <CalendarDays size={21} />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Fecha
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatearFecha(
                              fecha,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {hora && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <Clock3 size={21} />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Hora registrada
                          </p>

                          <p className="mt-1 text-xl font-bold text-slate-950">
                            {formatearHora(
                              hora,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 bg-slate-50 px-5 py-6 text-center sm:px-8">
            <p className="text-xs leading-5 text-slate-500 sm:text-sm">
              La fecha y la hora fueron tomadas
              directamente del servidor de AC-911.
              Podés cerrar esta página después de
              confirmar tus datos.
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              <Home size={17} />
              Ir al inicio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}