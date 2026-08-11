"use server";

import {
  and,
  asc,
  eq,
  gte,
  like,
  lte,
  ne,
  sql,
} from "drizzle-orm";
import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import { db } from "@/db";
import {
  permisos,
  vacaciones,
} from "@/db/schema";
import {
  requerirAdmin,
} from "@/lib/auth";
import {
  calcularDiasHabiles,
  calcularSaldoVacaciones,
  obtenerRangoAnual,
} from "@/lib/vacaciones";

const TIPOS_PERMITIDOS = [
  "PERSONAL",
  "CITA_MEDICA",
  "ENFERMEDAD",
] as const;


function revalidarPermisosYVacaciones(
  permisoId?: number,
) {
  revalidatePath(
    "/administracion/rh/permisos",
  );

  revalidatePath(
    "/administracion/rh/vacaciones",
  );

  if (
    permisoId &&
    permisoId > 0
  ) {
    revalidatePath(
      `/administracion/rh/permisos/${permisoId}`,
    );
  }
}

type TipoPermiso =
  (typeof TIPOS_PERMITIDOS)[number];

function esTipoPermitido(
  tipo: string,
): tipo is TipoPermiso {
  return TIPOS_PERMITIDOS.includes(
    tipo as TipoPermiso,
  );
}

function texto(
  formData: FormData,
  campo: string,
) {
  const valor =
    formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function validarRangoPermiso(
  fechaInicio: string,
  fechaFin: string,
  horaInicio: string,
  horaFin: string,
) {
  const dias =
    calcularDiasHabiles(
      fechaInicio,
      fechaFin,
    );

  if (dias <= 0) {
    return {
      valido: false,
      error: "fechas",
      dias: 0,
    } as const;
  }

  /*
   * Solo exigimos que horaFin sea posterior cuando
   * el permiso empieza y termina el mismo día.
   * Para permisos de varios días las horas representan
   * inicio del primer día y final del último.
   */
  if (
    fechaInicio === fechaFin &&
    horaFin <= horaInicio
  ) {
    return {
      valido: false,
      error: "horario",
      dias: 0,
    } as const;
  }

  return {
    valido: true,
    error: null,
    dias,
  } as const;
}

async function obtenerSituacionVacaciones(
  tx: Parameters<
    Parameters<
      typeof db.transaction
    >[0]
  >[0],
  empleadoId: number,
  fechaReferencia: string,
  permisoExcluirId?: number,
) {
  const rango =
    obtenerRangoAnual(
      fechaReferencia,
    );

  if (!rango) {
    throw new Error(
      "FECHA_INVALIDA",
    );
  }

  /*
   * Buscamos la PRIMERA vacación REAL aprobada
   * del empleado dentro del año.
   *
   * Los registros antiguos [PERMISO:id] no cuentan
   * como vacaciones reales.
   */
  const [primeraVacacion] =
    await tx
      .select({
        fechaInicio:
          vacaciones.fechaInicio,
      })
      .from(vacaciones)
      .where(
        and(
          eq(
            vacaciones.empleadoId,
            empleadoId,
          ),
          eq(
            vacaciones.estado,
            "APROBADA",
          ),
          gte(
            vacaciones.fechaInicio,
            rango.inicio,
          ),
          lte(
            vacaciones.fechaInicio,
            rango.fin,
          ),
          sql<boolean>`
            (
              ${vacaciones.observacion}
              IS NULL
              OR ${vacaciones.observacion}
                NOT LIKE '[PERMISO:%'
            )
          `,
        ),
      )
      .orderBy(
        asc(
          vacaciones.fechaInicio,
        ),
      )
      .limit(1);

  /*
   * Todos los permisos APROBADOS anteriores a la
   * primera vacación aprobada consumen saldo.
   *
   * Esto funciona también para permisos VIEJOS que
   * tienen afecta_vacaciones=false por la migración.
   */
  const condicionesPermisos = [
    eq(
      permisos.empleadoId,
      empleadoId,
    ),
    eq(
      permisos.estado,
      "APROBADO",
    ),
    gte(
      permisos.fecha,
      rango.inicio,
    ),
    lte(
      permisos.fecha,
      rango.fin,
    ),
  ];

  if (
    primeraVacacion?.fechaInicio
  ) {
    condicionesPermisos.push(
      sql<boolean>`
        ${permisos.fecha}
        < ${primeraVacacion.fechaInicio}
      `,
    );
  }

  if (
    permisoExcluirId &&
    permisoExcluirId > 0
  ) {
    condicionesPermisos.push(
      ne(
        permisos.id,
        permisoExcluirId,
      ),
    );
  }

  const [consumo] =
    await tx
      .select({
        dias:
          sql<number>`
            COALESCE(
              SUM(
                GREATEST(
                  COALESCE(
                    ${permisos.diasSolicitados},
                    1
                  ),
                  1
                )
              ),
              0
            )::int
          `,
      })
      .from(permisos)
      .where(
        and(
          ...condicionesPermisos
        ),
      );

  const usados =
    Number(
      consumo?.dias ?? 0,
    );

  const tieneVacacionesAprobadasAntesDelPermiso =
    Boolean(
      primeraVacacion?.fechaInicio &&
      primeraVacacion.fechaInicio <=
        fechaReferencia,
    );

  return {
    primeraVacacionAprobada:
      primeraVacacion?.fechaInicio ??
      null,

    tieneVacacionesAprobadas:
      tieneVacacionesAprobadasAntesDelPermiso,

    diasUsadosPorPermisos:
      usados,

    diasDisponibles:
      calcularSaldoVacaciones(
        usados,
      ),
  };
}

export async function crearPermiso(
  formData: FormData,
) {
  await requerirAdmin();

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const tipo =
    texto(
      formData,
      "tipo",
    );

  const fechaInicio =
    texto(
      formData,
      "fechaInicio",
    );

  const fechaFin =
    texto(
      formData,
      "fechaFin",
    );

  const horaInicio =
    texto(
      formData,
      "horaInicio",
    );

  const horaFin =
    texto(
      formData,
      "horaFin",
    );

  const motivo =
    texto(
      formData,
      "motivo",
    );

  const observacion =
    texto(
      formData,
      "observacion",
    );

  if (
    !Number.isInteger(
      empleadoId,
    ) ||
    empleadoId <= 0 ||
    !tipo ||
    !fechaInicio ||
    !fechaFin ||
    !horaInicio ||
    !horaFin ||
    !motivo
  ) {
    redirect(
      "/administracion/rh/permisos/nuevo?error=campos",
    );
  }

  if (!esTipoPermitido(tipo)) {
    redirect(
      "/administracion/rh/permisos/nuevo?error=tipo",
    );
  }

  const validacion =
    validarRangoPermiso(
      fechaInicio,
      fechaFin,
      horaInicio,
      horaFin,
    );

  if (!validacion.valido) {
    redirect(
      `/administracion/rh/permisos/nuevo?error=${validacion.error}`,
    );
  }

  await db
    .insert(permisos)
    .values({
      empleadoId,
      tipo,

      /*
       * "fecha" continúa siendo la fecha inicial
       * para no romper código histórico.
       */
      fecha: fechaInicio,
      fechaFin,

      horaInicio,
      horaFin,
      motivo,

      observacion:
        observacion || null,

      estado: "PENDIENTE",

      diasSolicitados:
        validacion.dias,

      diasDescontadosVacaciones:
        0,

      afectaVacaciones:
        false,

      actualizadoEn:
        new Date().toISOString(),
    });

  revalidarPermisosYVacaciones();

  redirect(
    "/administracion/rh/permisos?creado=true",
  );
}

export async function eliminarPermiso(
  permisoId: number,
) {
  await requerirAdmin();

  if (
    !Number.isInteger(
      permisoId,
    ) ||
    permisoId <= 0
  ) {
    redirect(
      "/administracion/rh/permisos",
    );
  }

  const resultado =
    await db
      .delete(permisos)
      .where(
        and(
          eq(
            permisos.id,
            permisoId,
          ),
          eq(
            permisos.estado,
            "PENDIENTE",
          ),
        ),
      )
      .returning({
        id: permisos.id,
      });

  if (!resultado[0]) {
    redirect(
      "/administracion/rh/permisos?error=eliminar",
    );
  }

  revalidarPermisosYVacaciones();

  redirect(
    "/administracion/rh/permisos?eliminado=true",
  );
}

export async function aprobarPermiso(
  permisoId: number,
) {
  const sesion =
    await requerirAdmin();

  if (
    !Number.isInteger(
      permisoId,
    ) ||
    permisoId <= 0
  ) {
    redirect(
      "/administracion/rh/permisos",
    );
  }

  try {
    const resultado =
      await db.transaction(
        async (tx) => {
          const [permiso] =
            await tx
              .select({
                id: permisos.id,
                empleadoId:
                  permisos.empleadoId,
                fecha:
                  permisos.fecha,
                fechaFin:
                  permisos.fechaFin,
                diasSolicitados:
                  permisos.diasSolicitados,
              })
              .from(permisos)
              .where(
                and(
                  eq(
                    permisos.id,
                    permisoId,
                  ),
                  eq(
                    permisos.estado,
                    "PENDIENTE",
                  ),
                ),
              )
              .limit(1);

          if (!permiso) {
            throw new Error(
              "PERMISO_YA_PROCESADO",
            );
          }

          const diasSolicitados =
            Math.max(
              1,
              permiso.diasSolicitados,
            );

          const situacion =
            await obtenerSituacionVacaciones(
              tx,
              permiso.empleadoId,
              permiso.fecha,
              permiso.id,
            );

          /*
           * Si ya tiene vacaciones reales aprobadas
           * en ese año, este permiso NO afecta saldo.
           */
          const debeDescontar =
            !situacion.tieneVacacionesAprobadas;

          if (
            debeDescontar &&
            diasSolicitados >
              situacion.diasDisponibles
          ) {
            throw new Error(
              "SALDO_INSUFICIENTE",
            );
          }

          const diasDescontados =
            debeDescontar
              ? diasSolicitados
              : 0;

          const [actualizado] =
            await tx
              .update(permisos)
              .set({
                estado:
                  "APROBADO",

                autorizadoPor:
                  sesion.usuarioId,

                afectaVacaciones:
                  debeDescontar,

                diasDescontadosVacaciones:
                  diasDescontados,

                actualizadoEn:
                  new Date()
                    .toISOString(),
              })
              .where(
                and(
                  eq(
                    permisos.id,
                    permisoId,
                  ),
                  eq(
                    permisos.estado,
                    "PENDIENTE",
                  ),
                ),
              )
              .returning({
                id: permisos.id,
              });

          if (!actualizado) {
            throw new Error(
              "PERMISO_YA_PROCESADO",
            );
          }

          return {
            diasDescontados,
            diasRestantes:
              debeDescontar
                ? situacion
                    .diasDisponibles -
                  diasDescontados
                : situacion
                    .diasDisponibles,
            tieneVacacionesAprobadas:
              situacion
                .tieneVacacionesAprobadas,
          };
        },
      );

    revalidarPermisosYVacaciones(
      permisoId,
    );

    const parametros =
      new URLSearchParams();

    parametros.set(
      "aprobado",
      "true",
    );

    parametros.set(
      "diasDescontados",
      String(
        resultado.diasDescontados,
      ),
    );

    parametros.set(
      "diasRestantes",
      String(
        resultado.diasRestantes,
      ),
    );

    if (
      resultado.tieneVacacionesAprobadas
    ) {
      parametros.set(
        "sinDescuento",
        "vacaciones-aprobadas",
      );
    }

    redirect(
      `/administracion/rh/permisos/${permisoId}?${parametros.toString()}`,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "SALDO_INSUFICIENTE"
    ) {
      redirect(
        `/administracion/rh/permisos/${permisoId}?error=saldo`,
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "PERMISO_YA_PROCESADO"
    ) {
      redirect(
        `/administracion/rh/permisos/${permisoId}?error=estado`,
      );
    }

    throw error;
  }
}

export async function rechazarPermiso(
  permisoId: number,
) {
  const sesion =
    await requerirAdmin();

  if (
    !Number.isInteger(
      permisoId,
    ) ||
    permisoId <= 0
  ) {
    redirect(
      "/administracion/rh/permisos",
    );
  }

  const resultado =
    await db
      .update(permisos)
      .set({
        estado:
          "RECHAZADO",

        autorizadoPor:
          sesion.usuarioId,

        afectaVacaciones:
          false,

        diasDescontadosVacaciones:
          0,

        actualizadoEn:
          new Date()
            .toISOString(),
      })
      .where(
        and(
          eq(
            permisos.id,
            permisoId,
          ),
          eq(
            permisos.estado,
            "PENDIENTE",
          ),
        ),
      )
      .returning({
        id: permisos.id,
      });

  if (!resultado[0]) {
    redirect(
      `/administracion/rh/permisos/${permisoId}?error=estado`,
    );
  }

  revalidarPermisosYVacaciones(
    permisoId,
  );

  redirect(
    `/administracion/rh/permisos/${permisoId}?rechazado=true`,
  );
}

export async function actualizarPermiso(
  permisoId: number,
  formData: FormData,
) {
  await requerirAdmin();

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const tipo =
    texto(
      formData,
      "tipo",
    );

  const fechaInicio =
    texto(
      formData,
      "fechaInicio",
    );

  const fechaFin =
    texto(
      formData,
      "fechaFin",
    );

  const horaInicio =
    texto(
      formData,
      "horaInicio",
    );

  const horaFin =
    texto(
      formData,
      "horaFin",
    );

  const motivo =
    texto(
      formData,
      "motivo",
    );

  const observacion =
    texto(
      formData,
      "observacion",
    );

  if (
    !Number.isInteger(
      permisoId,
    ) ||
    permisoId <= 0
  ) {
    redirect(
      "/administracion/rh/permisos",
    );
  }

  if (
    !Number.isInteger(
      empleadoId,
    ) ||
    empleadoId <= 0 ||
    !tipo ||
    !fechaInicio ||
    !fechaFin ||
    !horaInicio ||
    !horaFin ||
    !motivo
  ) {
    redirect(
      `/administracion/rh/permisos/${permisoId}/editar?error=campos`,
    );
  }

  if (!esTipoPermitido(tipo)) {
    redirect(
      `/administracion/rh/permisos/${permisoId}/editar?error=tipo`,
    );
  }

  const validacion =
    validarRangoPermiso(
      fechaInicio,
      fechaFin,
      horaInicio,
      horaFin,
    );

  if (!validacion.valido) {
    redirect(
      `/administracion/rh/permisos/${permisoId}/editar?error=${validacion.error}`,
    );
  }

  const resultado =
    await db
      .update(permisos)
      .set({
        empleadoId,
        tipo,
        fecha:
          fechaInicio,
        fechaFin,
        horaInicio,
        horaFin,
        motivo,

        observacion:
          observacion || null,

        diasSolicitados:
          validacion.dias,

        /*
         * Un permiso pendiente nunca debe tener
         * descuentos aplicados.
         */
        afectaVacaciones:
          false,

        diasDescontadosVacaciones:
          0,

        actualizadoEn:
          new Date()
            .toISOString(),
      })
      .where(
        and(
          eq(
            permisos.id,
            permisoId,
          ),
          eq(
            permisos.estado,
            "PENDIENTE",
          ),
        ),
      )
      .returning({
        id: permisos.id,
      });

  if (!resultado[0]) {
    redirect(
      `/administracion/rh/permisos/${permisoId}?error=estado`,
    );
  }

  revalidarPermisosYVacaciones(
    permisoId,
  );

  redirect(
    `/administracion/rh/permisos/${permisoId}?actualizado=true`,
  );
}