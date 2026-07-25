"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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