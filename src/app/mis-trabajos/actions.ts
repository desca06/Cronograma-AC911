"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  trabajos,
  trabajoEmpleados,
  usuarios,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  const valor = formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}

export async function actualizarMiTrabajo(
  formData: FormData,
): Promise<void> {
  const sesion = await requerirSesion();

  if (sesion.rol !== "TECNICO") {
    redirect("/dashboard");
  }

  const trabajoId = Number(
    formData.get("trabajoId"),
  );

  const estado = obtenerTexto(
    formData,
    "estado",
  );

  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  const estadosPermitidos = [
    "Pendiente",
    "En camino",
    "En proceso",
    "Finalizado",
  ];

  if (
    !Number.isInteger(trabajoId) ||
    trabajoId <= 0 ||
    !estadosPermitidos.includes(estado)
  ) {
    redirect("/mis-trabajos?error=datos");
  }

  const usuario = db
    .select({
      empleadoId: usuarios.empleadoId,
    })
    .from(usuarios)
    .where(eq(usuarios.id, sesion.usuarioId))
    .get();

  if (!usuario?.empleadoId) {
    redirect("/mis-trabajos?error=cuenta");
  }

  /*
   * Verifica que el técnico realmente esté
   * asignado al trabajo antes de modificarlo.
   */
  const asignacion = db
    .select({
      trabajoId: trabajoEmpleados.trabajoId,
    })
    .from(trabajoEmpleados)
    .where(
      and(
        eq(
          trabajoEmpleados.trabajoId,
          trabajoId,
        ),
        eq(
          trabajoEmpleados.empleadoId,
          usuario.empleadoId,
        ),
      ),
    )
    .get();

  if (!asignacion) {
    redirect("/mis-trabajos?error=permiso");
  }

  db.update(trabajos)
    .set({
      estado,
      observaciones:
        observaciones || null,
    })
    .where(eq(trabajos.id, trabajoId))
    .run();

  revalidatePath("/mis-trabajos");
  revalidatePath("/dashboard");
  revalidatePath("/cronograma");
  revalidatePath("/trabajos");

  redirect("/mis-trabajos?exito=actualizado");
}