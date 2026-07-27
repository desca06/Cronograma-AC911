"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {eq} from 'drizzle-orm'
import { db } from "@/db";
import { asistencias } from "@/db/schema";

export async function registrarAsistencia(formData: FormData) {
  const empleadoId = Number(formData.get("empleadoId"));
  const fecha = String(formData.get("fecha") ?? "");
  const horaEntrada = String(formData.get("horaEntrada") ?? "");
  const horaSalida = String(formData.get("horaSalida") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const observacion = String(formData.get("observacion") ?? "").trim();

  if (!empleadoId || !fecha || !estado) {
    redirect(
      "/administracion/rh/asistencias/nueva?error=campos-requeridos",
    );
  }

  try {
    await db.insert(asistencias).values({
      empleadoId,
      fecha,
      horaEntrada: horaEntrada || null,
      horaSalida: horaSalida || null,
      estado,
      observacion: observacion || null,
    });
  } catch (error) {
    console.error("Error al registrar asistencia:", error);

    redirect(
      "/administracion/rh/asistencias/nueva?error=registro-duplicado",
    );
  }

  revalidatePath("/administracion/rh/asistencias");
  redirect("/administracion/rh/asistencias");
}

export async function editarAsistencia(
  asistenciaId: number,
  formData: FormData,
) {
  const empleadoId = Number(formData.get("empleadoId"));
  const fecha = String(formData.get("fecha") ?? "");
  const horaEntrada = String(formData.get("horaEntrada") ?? "");
  const horaSalida = String(formData.get("horaSalida") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const observacion = String(
    formData.get("observacion") ?? "",
  ).trim();

  if (
    !Number.isInteger(asistenciaId) ||
    asistenciaId <= 0 ||
    !empleadoId ||
    !fecha ||
    !estado
  ) {
    redirect(
      `/administracion/rh/asistencias/${asistenciaId}/editar?error=campos-requeridos`,
    );
  }

  try {
    const resultado = await db
      .update(asistencias)
      .set({
        empleadoId,
        fecha,
        horaEntrada: horaEntrada || null,
        horaSalida: horaSalida || null,
        estado,
        observacion: observacion || null,
      })
      .where(eq(asistencias.id, asistenciaId))
      .returning({
        id: asistencias.id,
      });

    if (resultado.length === 0) {
      redirect("/administracion/rh/asistencias");
    }
  } catch (error) {
    console.error("Error al editar asistencia:", error);

    redirect(
      `/administracion/rh/asistencias/${asistenciaId}/editar?error=registro-duplicado`,
    );
  }

  revalidatePath("/administracion/rh/asistencias");
  revalidatePath(
    `/administracion/rh/asistencias/${asistenciaId}`,
  );

  redirect(
    `/administracion/rh/asistencias/${asistenciaId}?actualizada=true`,
  );
}

export async function eliminarAsistencia(asistenciaId: number) {
  if (
    !Number.isInteger(asistenciaId) ||
    asistenciaId <= 0
  ) {
    redirect("/administracion/rh/asistencias");
  }

  try {
    const resultado = await db
      .delete(asistencias)
      .where(eq(asistencias.id, asistenciaId))
      .returning({
        id: asistencias.id,
      });

    if (resultado.length === 0) {
      redirect("/administracion/rh/asistencias");
    }
  } catch (error) {
    console.error("Error al eliminar asistencia:", error);

    redirect(
      `/administracion/rh/asistencias/${asistenciaId}?error=no-se-pudo-eliminar`,
    );
  }

  revalidatePath("/administracion/rh/asistencias");

  redirect(
    "/administracion/rh/asistencias?eliminada=true",
  );
}