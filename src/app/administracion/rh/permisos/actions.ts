"use server";

import {
  and,
  desc,
  eq,
  gt,
  isNull,
  notLike,
  or,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  permisos,
  vacaciones,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

const TIPOS_PERMITIDOS = [
  "PERSONAL",
  "CITA_MEDICA",
  "ENFERMEDAD",
] as const;

type TipoPermiso =
  (typeof TIPOS_PERMITIDOS)[number];

function esTipoPermitido(
  tipo: string,
): tipo is TipoPermiso {
  return TIPOS_PERMITIDOS.includes(
    tipo as TipoPermiso,
  );
}

export async function crearPermiso(
  formData: FormData,
) {
  await requerirAdmin();

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const tipo = String(
    formData.get("tipo") ?? "",
  ).trim();

  const fecha = String(
    formData.get("fecha") ?? "",
  ).trim();

  const horaInicio = String(
    formData.get("horaInicio") ?? "",
  ).trim();

  const horaFin = String(
    formData.get("horaFin") ?? "",
  ).trim();

  const motivo = String(
    formData.get("motivo") ?? "",
  ).trim();

  const observacion = String(
    formData.get("observacion") ?? "",
  ).trim();

  if (
    !Number.isInteger(empleadoId) ||
    empleadoId <= 0 ||
    !tipo ||
    !fecha ||
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

  if (horaFin <= horaInicio) {
    redirect(
      "/administracion/rh/permisos/nuevo?error=horario",
    );
  }

  await db.insert(permisos).values({
    empleadoId,
    tipo,
    fecha,
    horaInicio,
    horaFin,
    motivo,
    observacion: observacion || null,
    estado: "PENDIENTE",
    actualizadoEn: new Date().toISOString(),
  });

  revalidatePath(
    "/administracion/rh/permisos",
  );

  redirect(
    "/administracion/rh/permisos?creado=true",
  );
}

export async function eliminarPermiso(
  permisoId: number,
) {
  await requerirAdmin();

  if (
    !Number.isInteger(permisoId) ||
    permisoId <= 0
  ) {
    redirect(
      "/administracion/rh/permisos",
    );
  }

  const resultado = await db
    .delete(permisos)
    .where(
      and(
        eq(permisos.id, permisoId),
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

  revalidatePath(
    "/administracion/rh/permisos",
  );

  redirect(
    "/administracion/rh/permisos?eliminado=true",
  );
}

export async function aprobarPermiso(
  permisoId: number,
) {
  const sesion = await requerirAdmin();

  if (
    !Number.isInteger(permisoId) ||
    permisoId <= 0
  ) {
    redirect(
      "/administracion/rh/permisos",
    );
  }

  let resultado:
    | {
        permisoId: number;
        vacacionId: number;
        diasRestantes: number;
      }
    | null = null;

  try {
    resultado = await db.transaction(
      async (tx) => {
        /*
         * Buscamos el permiso.
         * Solamente puede procesarse si está pendiente.
         */
        const permisosEncontrados = await tx
          .select({
            id: permisos.id,
            empleadoId: permisos.empleadoId,
          })
          .from(permisos)
          .where(
            and(
              eq(permisos.id, permisoId),
              eq(
                permisos.estado,
                "PENDIENTE",
              ),
            ),
          )
          .limit(1);

        const permiso =
          permisosEncontrados[0];

        if (!permiso) {
          return null;
        }

        /*
         * Buscamos el registro aprobado de vacaciones
         * del mismo empleado que todavía tenga días.
         *
         * Se ignoran las filas antiguas creadas por la
         * lógica anterior, cuya observación comenzaba
         * con [PERMISO:...].
         */
        const vacacionesEncontradas = await tx
          .select({
            id: vacaciones.id,
            cantidadDias:
              vacaciones.cantidadDias,
          })
          .from(vacaciones)
          .where(
            and(
              eq(
                vacaciones.empleadoId,
                permiso.empleadoId,
              ),
              eq(
                vacaciones.estado,
                "APROBADA",
              ),
              gt(
                vacaciones.cantidadDias,
                0,
              ),
              or(
                isNull(
                  vacaciones.observacion,
                ),
                notLike(
                  vacaciones.observacion,
                  "[PERMISO:%",
                ),
              ),
            ),
          )
          .orderBy(
            desc(vacaciones.creadoEn),
          )
          .limit(1);

        const vacacion =
          vacacionesEncontradas[0];

        if (!vacacion) {
          throw new Error(
            "SIN_DIAS_VACACIONES",
          );
        }

        /*
         * Restamos un día al registro existente.
         * Aquí ya no se inserta otra fila.
         */
        const vacacionesActualizadas =
          await tx
            .update(vacaciones)
            .set({
              cantidadDias: sql<number>`
                ${vacaciones.cantidadDias} - 1
              `,
              actualizadoEn:
                new Date().toISOString(),
            })
            .where(
              and(
                eq(
                  vacaciones.id,
                  vacacion.id,
                ),
                gt(
                  vacaciones.cantidadDias,
                  0,
                ),
              ),
            )
            .returning({
              id: vacaciones.id,
              cantidadDias:
                vacaciones.cantidadDias,
            });

        const vacacionActualizada =
          vacacionesActualizadas[0];

        if (!vacacionActualizada) {
          throw new Error(
            "SIN_DIAS_VACACIONES",
          );
        }

        /*
         * El permiso se aprueba solamente después
         * de descontar correctamente el día.
         */
        const permisosActualizados =
          await tx
            .update(permisos)
            .set({
              estado: "APROBADO",
              autorizadoPor:
                sesion.usuarioId,
              actualizadoEn:
                new Date().toISOString(),
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

        const permisoActualizado =
          permisosActualizados[0];

        if (!permisoActualizado) {
          throw new Error(
            "PERMISO_YA_PROCESADO",
          );
        }

        return {
          permisoId:
            permisoActualizado.id,
          vacacionId:
            vacacionActualizada.id,
          diasRestantes:
            vacacionActualizada.cantidadDias,
        };
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "SIN_DIAS_VACACIONES"
    ) {
      redirect(
        `/administracion/rh/permisos/${permisoId}?error=sin-vacaciones`,
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

  if (!resultado) {
    redirect(
      `/administracion/rh/permisos/${permisoId}?error=estado`,
    );
  }

  revalidatePath(
    "/administracion/rh/permisos",
  );

  revalidatePath(
    `/administracion/rh/permisos/${permisoId}`,
  );

  revalidatePath(
    "/administracion/rh/vacaciones",
  );

  revalidatePath(
    `/administracion/rh/vacaciones/${resultado.vacacionId}`,
  );

  redirect(
    `/administracion/rh/permisos/${permisoId}?aprobado=true&diasRestantes=${resultado.diasRestantes}`,
  );
}

export async function rechazarPermiso(
  permisoId: number,
) {
  const sesion = await requerirAdmin();

  if (
    !Number.isInteger(permisoId) ||
    permisoId <= 0
  ) {
    redirect(
      "/administracion/rh/permisos",
    );
  }

  const resultado = await db
    .update(permisos)
    .set({
      estado: "RECHAZADO",
      autorizadoPor:
        sesion.usuarioId,
      actualizadoEn:
        new Date().toISOString(),
    })
    .where(
      and(
        eq(permisos.id, permisoId),
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

  revalidatePath(
    "/administracion/rh/permisos",
  );

  revalidatePath(
    `/administracion/rh/permisos/${permisoId}`,
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

  const tipo = String(
    formData.get("tipo") ?? "",
  ).trim();

  const fecha = String(
    formData.get("fecha") ?? "",
  ).trim();

  const horaInicio = String(
    formData.get("horaInicio") ?? "",
  ).trim();

  const horaFin = String(
    formData.get("horaFin") ?? "",
  ).trim();

  const motivo = String(
    formData.get("motivo") ?? "",
  ).trim();

  const observacion = String(
    formData.get("observacion") ?? "",
  ).trim();

  if (
    !Number.isInteger(permisoId) ||
    permisoId <= 0
  ) {
    redirect(
      "/administracion/rh/permisos",
    );
  }

  if (
    !Number.isInteger(empleadoId) ||
    empleadoId <= 0 ||
    !tipo ||
    !fecha ||
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

  if (horaFin <= horaInicio) {
    redirect(
      `/administracion/rh/permisos/${permisoId}/editar?error=horario`,
    );
  }

  const resultado = await db
    .update(permisos)
    .set({
      empleadoId,
      tipo,
      fecha,
      horaInicio,
      horaFin,
      motivo,
      observacion:
        observacion || null,
      actualizadoEn:
        new Date().toISOString(),
    })
    .where(
      and(
        eq(permisos.id, permisoId),
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

  revalidatePath(
    "/administracion/rh/permisos",
  );

  revalidatePath(
    `/administracion/rh/permisos/${permisoId}`,
  );

  redirect(
    `/administracion/rh/permisos/${permisoId}?actualizado=true`,
  );
}