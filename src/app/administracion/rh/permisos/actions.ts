"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { permisos } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

const TIPOS_PERMITIDOS = [
  "PERSONAL",
  "CITA_MEDICA",
  "ENFERMEDAD",
] as const;

type TipoPermiso = (typeof TIPOS_PERMITIDOS)[number];

function esTipoPermitido(tipo: string): tipo is TipoPermiso {
  return TIPOS_PERMITIDOS.includes(tipo as TipoPermiso);
}

export async function crearPermiso(formData: FormData) {
  await requerirAdmin();

  const empleadoId = Number(formData.get("empleadoId"));

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

  revalidatePath("/administracion/rh/permisos");

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
    redirect("/administracion/rh/permisos");
  }

  const resultado = await db
    .delete(permisos)
    .where(eq(permisos.id, permisoId))
    .returning({
      id: permisos.id,
    });

  if (!resultado[0]) {
    redirect(
      "/administracion/rh/permisos?error=eliminar",
    );
  }

  revalidatePath("/administracion/rh/permisos");

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
    redirect("/administracion/rh/permisos");
  }

  const resultado = await db
    .update(permisos)
    .set({
      estado: "APROBADO",
      autorizadoPor: sesion.usuarioId,
      actualizadoEn: new Date().toISOString(),
    })
    .where(
      and(
        eq(permisos.id, permisoId),
        eq(permisos.estado, "PENDIENTE"),
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

  revalidatePath("/administracion/rh/permisos");
  revalidatePath(
    `/administracion/rh/permisos/${permisoId}`,
  );

  redirect(
    `/administracion/rh/permisos/${permisoId}?aprobado=true`,
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
    redirect("/administracion/rh/permisos");
  }

  const resultado = await db
    .update(permisos)
    .set({
      estado: "RECHAZADO",
      autorizadoPor: sesion.usuarioId,
      actualizadoEn: new Date().toISOString(),
    })
    .where(
      and(
        eq(permisos.id, permisoId),
        eq(permisos.estado, "PENDIENTE"),
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

  revalidatePath("/administracion/rh/permisos");
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

  const empleadoId = Number(formData.get("empleadoId"));
  const tipo = String(formData.get("tipo") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const horaInicio = String(
    formData.get("horaInicio") ?? "",
  ).trim();
  const horaFin = String(
    formData.get("horaFin") ?? "",
  ).trim();
  const motivo = String(formData.get("motivo") ?? "").trim();
  const observacion = String(
    formData.get("observacion") ?? "",
  ).trim();

  if (
    !Number.isInteger(permisoId) ||
    permisoId <= 0
  ) {
    redirect("/administracion/rh/permisos");
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
      observacion: observacion || null,
      actualizadoEn: new Date().toISOString(),
    })
    .where(
      and(
        eq(permisos.id, permisoId),
        eq(permisos.estado, "PENDIENTE"),
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

  revalidatePath("/administracion/rh/permisos");
  revalidatePath(
    `/administracion/rh/permisos/${permisoId}`,
  );

  redirect(
    `/administracion/rh/permisos/${permisoId}?actualizado=true`,
  );
}