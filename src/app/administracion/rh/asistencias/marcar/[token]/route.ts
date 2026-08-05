import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
    asistencias,
    empleadoQr,
    empleados,
} from "@/db/schema";
import { validarRedAsistencia } from "@/lib/asistencias-red";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const partes = new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone: "America/Guatemala",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        },
    ).formatToParts(new Date());

    const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
        partes.find((parte) => parte.type === tipo)
            ?.value ?? "00";

    return `${valor("hour")}:${valor("minute")}:${valor("second")}`;
}

function crearUrlResultado(
    request: Request,
    parametros: Record<string, string>,
) {
    const url = new URL(
        "/asistencia/resultado",
        request.url,
    );

    for (const [clave, valor] of Object.entries(
        parametros,
    )) {
        url.searchParams.set(clave, valor);
    }

    return url;
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

    const red = await validarRedAsistencia();

    if (!red.autorizado) {
        return NextResponse.redirect(
            crearUrlResultado(request, {
                estado: "RED_NO_AUTORIZADA",
                mensaje: red.motivo,
            }),
        );
    }

    const [empleado] = await db
        .select({
            id: empleados.id,
            nombre: empleados.nombre,
            activo: empleados.activo,
        })
        .from(empleadoQr)
        .innerJoin(
            empleados,
            eq(empleadoQr.empleadoId, empleados.id),
        )
        .where(eq(empleadoQr.token, token))
        .limit(1);

    if (!empleado) {
        return NextResponse.redirect(
            crearUrlResultado(request, {
                estado: "ERROR",
                mensaje:
                    "El código QR no existe o fue reemplazado.",
            }),
        );
    }

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

    const resultado = await db.transaction(
        async (tx) => {
            /*
             * Bloqueamos temporalmente la marcación de este
             * empleado para evitar dos registros simultáneos.
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
                        eq(
                            asistencias.empleadoId,
                            empleado.id,
                        ),
                        eq(asistencias.fecha, fecha),
                    ),
                )
                .limit(1);

            if (!registro) {
                await tx.insert(asistencias).values({
                    empleadoId: empleado.id,
                    fecha,
                    horaEntrada: hora,
                    horaSalida: null,
                    estado: "PRESENTE",
                    observacion:
                        "Entrada registrada mediante código QR.",
                });

                return {
                    tipo: "ENTRADA",
                    hora,
                };
            }

            if (!registro.horaSalida) {
                /*
                 * Evita que un doble escaneo inmediato registre
                 * una salida accidental.
                 */
                if (registro.horaEntrada) {
                    const entrada = new Date(
                        `${fecha}T${registro.horaEntrada}`,
                    );

                    const ahora = new Date(
                        `${fecha}T${hora}`,
                    );

                    const diferenciaMinutos =
                        (ahora.getTime() -
                            entrada.getTime()) /
                        60000;

                    if (diferenciaMinutos < 2) {
                        return {
                            tipo: "DUPLICADA",
                            hora: registro.horaEntrada,
                        };
                    }
                }

                await tx
                    .update(asistencias)
                    .set({
                        horaSalida: hora,
                        observacion:
                            "Entrada y salida registradas mediante código QR.",
                    })
                    .where(eq(asistencias.id, registro.id));

                return {
                    tipo: "SALIDA",
                    hora,
                };
            }

            return {
                tipo: "COMPLETA",
                hora: registro.horaSalida,
            };
        },
    );

    const mensajes = {
        ENTRADA: "Entrada registrada correctamente.",
        SALIDA: "Salida registrada correctamente.",
        DUPLICADA:
            "La entrada ya fue registrada. Espera antes de volver a escanear.",
        COMPLETA:
            "La asistencia de hoy ya tiene entrada y salida.",
    } as const;

    return NextResponse.redirect(
        crearUrlResultado(request, {
            estado: resultado.tipo,
            nombre: empleado.nombre,
            hora: resultado.hora ?? hora,
            fecha,
            mensaje: mensajes
            [
                resultado.tipo as keyof typeof mensajes
            ],
        }),
    );
}