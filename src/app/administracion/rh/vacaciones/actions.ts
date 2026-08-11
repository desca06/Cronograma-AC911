"use server";

import {
  and,
  asc,
  eq,
  gte,
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
  empleados,
  permisos,
  vacaciones,
} from "@/db/schema";
import {
  requerirAdmin,
} from "@/lib/auth";
import {
  calcularDiasHabiles,
  calcularSaldoAnualVacaciones,
  DIAS_VACACIONES_ANUALES,
  esVacacionGeneradaPorPermiso,
  obtenerRangoAnual,
} from "@/lib/vacaciones";

type ClienteTransaccion =
  Parameters<
    Parameters<
      typeof db.transaction
    >[0]
  >[0];

async function obtenerSaldoVacaciones(
  cliente:
    | typeof db
    | ClienteTransaccion,
  empleadoId: number,
  fechaReferencia: string,
  vacacionExcluirId?: number,
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

  const condicionesVacaciones = [
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
  ];

  if (
    vacacionExcluirId &&
    vacacionExcluirId > 0
  ) {
    condicionesVacaciones.push(
      ne(
        vacaciones.id,
        vacacionExcluirId,
      ),
    );
  }

  const [vacacionesUsadas] =
    await cliente
      .select({
        dias:
          sql<number>`
            COALESCE(
              SUM(
                ${vacaciones.cantidadDias}
              ),
              0
            )::int
          `,
      })
      .from(vacaciones)
      .where(
        and(
          ...condicionesVacaciones
        ),
      );

  /*
   * Primera vacación real aprobada del año.
   * Los permisos anteriores a esta fecha consumen saldo.
   */
  const [primeraVacacion] =
    await cliente
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

  const [permisosUsados] =
    await cliente
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

  const diasVacaciones =
    Number(
      vacacionesUsadas?.dias ??
      0,
    );

  const diasPermisos =
    Number(
      permisosUsados?.dias ??
      0,
    );

  return {
    ...calcularSaldoAnualVacaciones(
      diasVacaciones,
      diasPermisos,
    ),
    diasVacaciones,
    diasPermisos,
    primeraVacacionAprobada:
      primeraVacacion?.fechaInicio ??
      null,
  };
}

function validarDiasSolicitados(
  fechaInicio: string,
  fechaFin: string,
) {
  const cantidadDias =
    calcularDiasHabiles(
      fechaInicio,
      fechaFin,
    );

  if (
    cantidadDias <= 0
  ) {
    return {
      valido: false,
      error: "fechas",
      cantidadDias: 0,
    } as const;
  }

  if (
    cantidadDias >
    DIAS_VACACIONES_ANUALES
  ) {
    return {
      valido: false,
      error: "maximo",
      cantidadDias,
    } as const;
  }

  return {
    valido: true,
    error: null,
    cantidadDias,
  } as const;
}

export async function crearVacacion(
  formData: FormData,
) {
  await requerirAdmin();

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const fechaInicio = String(
    formData.get("fechaInicio") ??
      "",
  ).trim();

  const fechaFin = String(
    formData.get("fechaFin") ??
      "",
  ).trim();

  const observacion =
    String(
      formData.get(
        "observacion",
      ) ?? "",
    ).trim() || null;

  if (
    !Number.isInteger(
      empleadoId,
    ) ||
    empleadoId <= 0 ||
    !fechaInicio ||
    !fechaFin
  ) {
    redirect(
      "/administracion/rh/vacaciones/nueva?error=datos",
    );
  }

  const validacion =
    validarDiasSolicitados(
      fechaInicio,
      fechaFin,
    );

  if (!validacion.valido) {
    redirect(
      `/administracion/rh/vacaciones/nueva?error=${validacion.error}`,
    );
  }

  const [empleado] =
    await db
      .select({
        id: empleados.id,
      })
      .from(empleados)
      .where(
        and(
          eq(
            empleados.id,
            empleadoId,
          ),
          eq(
            empleados.activo,
            true,
          ),
        ),
      )
      .limit(1);

  if (!empleado) {
    redirect(
      "/administracion/rh/vacaciones/nueva?error=empleado",
    );
  }

  const saldo =
    await obtenerSaldoVacaciones(
      db,
      empleadoId,
      fechaInicio,
    );

  if (
    saldo.disponibles <= 0
  ) {
    redirect(
      "/administracion/rh/vacaciones/nueva?error=agotadas&disponibles=0",
    );
  }

  if (
    validacion.cantidadDias >
    saldo.disponibles
  ) {
    redirect(
      `/administracion/rh/vacaciones/nueva?error=saldo&disponibles=${saldo.disponibles}`,
    );
  }

  await db
    .insert(vacaciones)
    .values({
      empleadoId,
      fechaInicio,
      fechaFin,
      cantidadDias:
        validacion.cantidadDias,
      estado: "PENDIENTE",
      observacion,
    });

  revalidatePath(
    "/administracion/rh/vacaciones",
  );

  redirect(
    "/administracion/rh/vacaciones?creada=true",
  );
}

export async function aprobarVacacion(
  vacacionId: number,
) {
  const sesion =
    await requerirAdmin();

  if (
    !Number.isInteger(
      vacacionId,
    ) ||
    vacacionId <= 0
  ) {
    redirect(
      "/administracion/rh/vacaciones",
    );
  }

  try {
    const resultado =
      await db.transaction(
        async (tx) => {
          const [vacacion] =
            await tx
              .select({
                id:
                  vacaciones.id,
                empleadoId:
                  vacaciones.empleadoId,
                fechaInicio:
                  vacaciones.fechaInicio,
                cantidadDias:
                  vacaciones.cantidadDias,
                estado:
                  vacaciones.estado,
              })
              .from(vacaciones)
              .where(
                and(
                  eq(
                    vacaciones.id,
                    vacacionId,
                  ),
                  eq(
                    vacaciones.estado,
                    "PENDIENTE",
                  ),
                ),
              )
              .limit(1);

          if (!vacacion) {
            throw new Error(
              "ESTADO_INVALIDO",
            );
          }

          /*
           * Recalculamos el saldo al aprobar para
           * impedir que dos solicitudes pendientes
           * puedan saltarse el límite.
           */
          const saldo =
            await obtenerSaldoVacaciones(
              tx,
              vacacion.empleadoId,
              vacacion.fechaInicio,
              vacacion.id,
            );

          if (
            saldo.disponibles <= 0
          ) {
            throw new Error(
              "VACACIONES_AGOTADAS",
            );
          }

          if (
            vacacion.cantidadDias >
            saldo.disponibles
          ) {
            const error =
              new Error(
                "SALDO_INSUFICIENTE",
              );

            (
              error as Error & {
                disponibles?: number;
              }
            ).disponibles =
              saldo.disponibles;

            throw error;
          }

          const [actualizada] =
            await tx
              .update(vacaciones)
              .set({
                estado:
                  "APROBADA",
                autorizadoPor:
                  sesion.usuarioId,
                actualizadoEn:
                  new Date()
                    .toISOString(),
              })
              .where(
                and(
                  eq(
                    vacaciones.id,
                    vacacionId,
                  ),
                  eq(
                    vacaciones.estado,
                    "PENDIENTE",
                  ),
                ),
              )
              .returning({
                id:
                  vacaciones.id,
              });

          if (!actualizada) {
            throw new Error(
              "ESTADO_INVALIDO",
            );
          }

          return {
            diasAntes:
              saldo.disponibles,
            diasAprobados:
              vacacion.cantidadDias,
            diasRestantes:
              Math.max(
                0,
                saldo.disponibles -
                  vacacion.cantidadDias,
              ),
          };
        },
      );

    revalidatePath(
      "/administracion/rh/vacaciones",
    );

    revalidatePath(
      `/administracion/rh/vacaciones/${vacacionId}`,
    );

    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?aprobada=true&diasRestantes=${resultado.diasRestantes}`,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "VACACIONES_AGOTADAS"
    ) {
      redirect(
        `/administracion/rh/vacaciones/${vacacionId}?error=agotadas`,
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "SALDO_INSUFICIENTE"
    ) {
      const disponibles =
        (
          error as Error & {
            disponibles?: number;
          }
        ).disponibles ?? 0;

      redirect(
        `/administracion/rh/vacaciones/${vacacionId}?error=saldo&disponibles=${disponibles}`,
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "ESTADO_INVALIDO"
    ) {
      redirect(
        `/administracion/rh/vacaciones/${vacacionId}?error=estado`,
      );
    }

    throw error;
  }
}

export async function rechazarVacacion(
  vacacionId: number,
) {
  const sesion =
    await requerirAdmin();

  if (
    !Number.isInteger(
      vacacionId,
    ) ||
    vacacionId <= 0
  ) {
    redirect(
      "/administracion/rh/vacaciones",
    );
  }

  const resultado =
    await db
      .update(vacaciones)
      .set({
        estado:
          "RECHAZADA",
        autorizadoPor:
          sesion.usuarioId,
        actualizadoEn:
          new Date()
            .toISOString(),
      })
      .where(
        and(
          eq(
            vacaciones.id,
            vacacionId,
          ),
          eq(
            vacaciones.estado,
            "PENDIENTE",
          ),
        ),
      )
      .returning({
        id:
          vacaciones.id,
      });

  if (!resultado[0]) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=estado`,
    );
  }

  revalidatePath(
    "/administracion/rh/vacaciones",
  );

  revalidatePath(
    `/administracion/rh/vacaciones/${vacacionId}`,
  );

  redirect(
    `/administracion/rh/vacaciones/${vacacionId}?rechazada=true`,
  );
}

export async function actualizarVacacion(
  vacacionId: number,
  formData: FormData,
) {
  await requerirAdmin();

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const fechaInicio = String(
    formData.get("fechaInicio") ??
      "",
  ).trim();

  const fechaFin = String(
    formData.get("fechaFin") ??
      "",
  ).trim();

  const observacion =
    String(
      formData.get(
        "observacion",
      ) ?? "",
    ).trim();

  if (
    !Number.isInteger(
      vacacionId,
    ) ||
    vacacionId <= 0
  ) {
    redirect(
      "/administracion/rh/vacaciones",
    );
  }

  const [actual] =
    await db
      .select({
        id:
          vacaciones.id,
        estado:
          vacaciones.estado,
        observacion:
          vacaciones.observacion,
      })
      .from(vacaciones)
      .where(
        eq(
          vacaciones.id,
          vacacionId,
        ),
      )
      .limit(1);

  if (!actual) {
    redirect(
      "/administracion/rh/vacaciones",
    );
  }

  if (
    esVacacionGeneradaPorPermiso(
      actual.observacion,
    )
  ) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=automatico`,
    );
  }

  if (
    actual.estado !==
    "PENDIENTE"
  ) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=estado`,
    );
  }

  if (
    !Number.isInteger(
      empleadoId,
    ) ||
    empleadoId <= 0 ||
    !fechaInicio ||
    !fechaFin
  ) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}/editar?error=campos`,
    );
  }

  const validacion =
    validarDiasSolicitados(
      fechaInicio,
      fechaFin,
    );

  if (!validacion.valido) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}/editar?error=${validacion.error}`,
    );
  }

  const saldo =
    await obtenerSaldoVacaciones(
      db,
      empleadoId,
      fechaInicio,
      vacacionId,
    );

  if (
    saldo.disponibles <= 0
  ) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}/editar?error=agotadas&disponibles=0`,
    );
  }

  if (
    validacion.cantidadDias >
    saldo.disponibles
  ) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}/editar?error=saldo&disponibles=${saldo.disponibles}`,
    );
  }

  const resultado =
    await db
      .update(vacaciones)
      .set({
        empleadoId,
        fechaInicio,
        fechaFin,
        cantidadDias:
          validacion.cantidadDias,
        observacion:
          observacion || null,
        actualizadoEn:
          new Date()
            .toISOString(),
      })
      .where(
        and(
          eq(
            vacaciones.id,
            vacacionId,
          ),
          eq(
            vacaciones.estado,
            "PENDIENTE",
          ),
        ),
      )
      .returning({
        id:
          vacaciones.id,
      });

  if (!resultado[0]) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=estado`,
    );
  }

  revalidatePath(
    "/administracion/rh/vacaciones",
  );

  revalidatePath(
    `/administracion/rh/vacaciones/${vacacionId}`,
  );

  redirect(
    `/administracion/rh/vacaciones/${vacacionId}?actualizada=true`,
  );
}

export async function eliminarVacacion(
  vacacionId: number,
) {
  await requerirAdmin();

  if (
    !Number.isInteger(
      vacacionId,
    ) ||
    vacacionId <= 0
  ) {
    redirect(
      "/administracion/rh/vacaciones",
    );
  }

  const resultado =
    await db
      .delete(vacaciones)
      .where(
        and(
          eq(
            vacaciones.id,
            vacacionId,
          ),
          eq(
            vacaciones.estado,
            "PENDIENTE",
          ),
        ),
      )
      .returning({
        id:
          vacaciones.id,
      });

  if (!resultado[0]) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=eliminar`,
    );
  }

  revalidatePath(
    "/administracion/rh/vacaciones",
  );

  redirect(
    "/administracion/rh/vacaciones?eliminada=true",
  );
}