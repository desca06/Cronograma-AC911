"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { notificaciones } from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

export async function marcarNotificacionLeida(
  formData: FormData,
): Promise<void> {
  const sesion = await requerirSesion();

  const notificacionId = Number(
    formData.get("notificacionId"),
  );

  if (
    !Number.isInteger(notificacionId) ||
    notificacionId <= 0
  ) {
    redirect("/notificaciones?error=datos");
  }

  db.update(notificaciones)
    .set({
      leida: true,
    })
    .where(
      and(
        eq(notificaciones.id, notificacionId),
        eq(
          notificaciones.usuarioId,
          sesion.usuarioId,
        ),
      ),
    )
    .run();

  revalidatePath("/notificaciones");
  revalidatePath("/mis-trabajos");

  redirect("/notificaciones");
}

export async function marcarTodasLeidas(): Promise<void> {
  const sesion = await requerirSesion();

  db.update(notificaciones)
    .set({
      leida: true,
    })
    .where(
      and(
        eq(
          notificaciones.usuarioId,
          sesion.usuarioId,
        ),
        eq(notificaciones.leida, false),
      ),
    )
    .run();

  revalidatePath("/notificaciones");
  revalidatePath("/mis-trabajos");

  redirect("/notificaciones");
}