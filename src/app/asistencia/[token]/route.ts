import { NextResponse } from "next/server";
import {
  and,
  eq,
  gte,
  lte,
  ne,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  asistencias,
  empleadoQr,
  empleados,
} from "@/db/schema";
import { validarRedAsistencia } from "@/lib/asistencias-red";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HORA_LIMITE_ENTRADA = "08:01:00";
const HORA_SALIDA_FIJA = "17:00:00";

type RouteProps = {
  params: Promise<{
    token: string;
  }>;
};

function obtenerFechaGuatemala() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function obtenerHoraGuatemala() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "00";

  return `${valor("hour")}:${valor("minute")}:${valor("second")}`;
}

function crearUrlResultado(
  request: Request,
  parametros: Record<string, string>,
) {
  const url = new URL("/asistencia/resultado", request.url);

  for (const [clave, valor] of Object.entries(parametros)) {
    url.searchParams.set(clave, valor);
  }

  return url;
}

function convertirHoraAMinutos(hora: string) {
  const [horas = 0, minutos = 0, segundos = 0] = hora
    .split(":")
    .map(Number);

  return horas * 60 + minutos + (segundos >= 30 ? 1 : 0);
}

function calcularMinutosExtra(horaSalida: string) {
  const salida = convertirHoraAMinutos(horaSalida);
  const salidaFija = convertirHoraAMinutos(HORA_SALIDA_FIJA);

  return Math.max(salida - salidaFija, 0);
}

function obtenerRangoMes(fecha: string) {
  const [anio, mes] = fecha.split("-").map(Number);
  const ultimoDia = new Date(
    Date.UTC(anio, mes, 0),
  ).getUTCDate();

  const prefijo = `${anio}-${String(mes).padStart(2, "0")}`;

  return {
    inicio: `${prefijo}-01`,
    fin: `${prefijo}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

function textoHorasExtra(minutos: number) {
  return `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
}

export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  const { token } = await params;

  if (!token || token.length < 32) {
    return NextResponse.redirect(
      crearUrlResultado(request, {
        estado: "ERROR",
        mensaje: "El código QR no es válido.",
      }),
    );
  }

  /*
   * IMPORTANTE:
   * La petición completa se pasa a validarRedAsistencia()
   * para que pueda leer los headers que Vercel agrega con
   * la IP pública real del dispositivo/red que escanea el QR.
   */
  const red = await validarRedAsistencia(request);

  if (!red.autorizado) {
    return NextResponse.redirect(
      crearUrlResultado(request, {
        estado: "RED_NO_AUTORIZADA",
        mensaje: red.motivo,
      }),
    );
  }

  const coincidencias = await db
    .select({
      id: empleados.id,
      nombre: empleados.nombre,
      activo: empleados.activo,
      limiteMinutosExtraMensuales:
        empleados.limiteMinutosExtraMensuales,
    })
    .from(empleadoQr)
    .innerJoin(
      empleados,
      eq(empleadoQr.empleadoId, empleados.id),
    )
    .where(eq(empleadoQr.token, token))
    .limit(2);

  if (coincidencias.length !== 1) {
    return NextResponse.redirect(
      crearUrlResultado(request, {
        estado: "ERROR",
        mensaje:
          coincidencias.length === 0
            ? "El código QR no existe o fue reemplazado."
            : "El código QR está duplicado. Comuníquese con administración.",
      }),
    );
  }

  const empleado = coincidencias[0];

  if (!empleado.activo) {
    return NextResponse.redirect(
      crearUrlResultado(request, {
        estado: "ERROR",
        mensaje:
          "El empleado está inactivo y no puede registrar asistencia.",
      }),
    );
  }

  const fecha = obtenerFechaGuatemala();
  const hora = obtenerHoraGuatemala();

  const resultado = await db.transaction(async (tx) => {
    /*
     * Evita dos marcaciones simultáneas para el mismo empleado.
     */
    await tx.execute(
      sql`select pg_advisory_xact_lock(${empleado.id})`,
    );

    const [registro] = await tx
      .select({
        id: asistencias.id,
        horaEntrada: asistencias.horaEntrada,
        horaSalida: asistencias.horaSalida,
      })
      .from(asistencias)
      .where(
        and(
          eq(asistencias.empleadoId, empleado.id),
          eq(asistencias.fecha, fecha),
        ),
      )
      .limit(1);

    /*
     * PRIMER ESCANEO DEL DÍA = ENTRADA
     */
    if (!registro) {
      const estadoEntrada =
        hora > HORA_LIMITE_ENTRADA
          ? "TARDE"
          : "PRESENTE";

      await tx.insert(asistencias).values({
        empleadoId: empleado.id,
        fecha,
        horaEntrada: hora,
        horaSalida: null,
        estado: estadoEntrada,
        minutosHoraExtra: 0,
        observacion:
          estadoEntrada === "TARDE"
            ? "Entrada tardía registrada mediante código QR."
            : "Entrada registrada mediante código QR.",
      });

      return {
        tipo: "ENTRADA",
        hora,
        mensaje:
          estadoEntrada === "TARDE"
            ? "Entrada registrada con tardanza."
            : "Entrada registrada correctamente.",
      };
    }

    /*
     * SEGUNDO ESCANEO = SALIDA.
     * Se bloquea un doble escaneo accidental durante 2 minutos.
     */
    if (!registro.horaSalida) {
      if (registro.horaEntrada) {
        const entrada = new Date(
          `${fecha}T${registro.horaEntrada}`,
        );

        const ahora = new Date(
          `${fecha}T${hora}`,
        );

        const diferenciaMinutos =
          (ahora.getTime() - entrada.getTime()) /
          60000;

        if (diferenciaMinutos < 2) {
          return {
            tipo: "DUPLICADA",
            hora: registro.horaEntrada,
            mensaje:
              "La entrada ya fue registrada. Espera antes de volver a escanear.",
          };
        }
      }

      const minutosExtraPosibles =
        calcularMinutosExtra(hora);

      const rangoMes =
        obtenerRangoMes(fecha);

      const [resumenHorasExtra] = await tx
        .select({
          utilizados: sql<number>`
            coalesce(
              sum(${asistencias.minutosHoraExtra}),
              0
            )::int
          `,
        })
        .from(asistencias)
        .where(
          and(
            eq(
              asistencias.empleadoId,
              empleado.id,
            ),
            gte(
              asistencias.fecha,
              rangoMes.inicio,
            ),
            lte(
              asistencias.fecha,
              rangoMes.fin,
            ),
            ne(
              asistencias.id,
              registro.id,
            ),
          ),
        );

      const minutosUtilizados =
        resumenHorasExtra?.utilizados ?? 0;

      const limite = Math.max(
        empleado.limiteMinutosExtraMensuales ?? 0,
        0,
      );

      const minutosDisponibles = Math.max(
        limite - minutosUtilizados,
        0,
      );

      const minutosHoraExtra = Math.min(
        minutosExtraPosibles,
        minutosDisponibles,
      );

      const alcanzoLimite =
        minutosExtraPosibles >
        minutosDisponibles;

      let observacion =
        "Entrada y salida registradas mediante código QR.";

      if (minutosHoraExtra > 0) {
        observacion += ` Horas extra registradas: ${textoHorasExtra(
          minutosHoraExtra,
        )}.`;
      }

      if (
        minutosExtraPosibles > 0 &&
        minutosDisponibles === 0
      ) {
        observacion +=
          " No se registraron horas extra porque el empleado ya alcanzó su límite mensual.";
      } else if (alcanzoLimite) {
        observacion +=
          " Solo se registró el tiempo disponible porque el empleado alcanzó su límite mensual.";
      }

      await tx
        .update(asistencias)
        .set({
          horaSalida: hora,
          minutosHoraExtra,
          observacion,
        })
        .where(
          eq(
            asistencias.id,
            registro.id,
          ),
        );

      return {
        tipo: "SALIDA",
        hora,
        mensaje:
          minutosHoraExtra > 0
            ? `Salida registrada. Horas extra: ${textoHorasExtra(
                minutosHoraExtra,
              )}.`
            : "Salida registrada correctamente.",
      };
    }

    /*
     * Ya existe entrada y salida para hoy.
     */
    return {
      tipo: "COMPLETA",
      hora: registro.horaSalida,
      mensaje:
        "La asistencia de hoy ya tiene entrada y salida.",
    };
  });

  return NextResponse.redirect(
    crearUrlResultado(request, {
      estado: resultado.tipo,
      nombre: empleado.nombre,
      hora: resultado.hora ?? hora,
      fecha,
      mensaje: resultado.mensaje,
    }),
  );
}