"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  vehiculoKilometraje,
  vehiculos,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";
import { leerKm } from "@/lib/kilometraje";

export async function ajustarKilometraje(formData: FormData) {
  const sesion = await requerirAdmin();

  const vehiculoId = Number(formData.get("vehiculoId"));

  if (!Number.isInteger(vehiculoId) || vehiculoId <= 0) {
    redirect("/vehiculos?error=vehiculo-invalido");
  }

  const ruta = `/vehiculos/${vehiculoId}/kilometraje`;

  let kmNuevo: number | null = null;

  try {
    kmNuevo = leerKm(formData.get("kmNuevo"));
  } catch {
    redirect(`${ruta}?error=km`);
  }

  if (kmNuevo === null) {
    redirect(`${ruta}?error=km`);
  }

  const nota = String(formData.get("nota") ?? "").trim();

  const [vehiculo] = await db
    .select({
      id: vehiculos.id,
      kmActual: vehiculos.kmActual,
    })
    .from(vehiculos)
    .where(eq(vehiculos.id, vehiculoId))
    .limit(1);

  if (!vehiculo) {
    redirect("/vehiculos?error=vehiculo-no-encontrado");
  }

  await db
    .update(vehiculos)
    .set({
      kmActual: kmNuevo,
    })
    .where(eq(vehiculos.id, vehiculoId));

  await db.insert(vehiculoKilometraje).values({
    vehiculoId,
    trabajoId: null,
    usuarioId: sesion.usuarioId,
    kmAnterior: vehiculo.kmActual,
    kmSalida: null,
    kmLlegada: kmNuevo,
    kmRecorridos: kmNuevo - vehiculo.kmActual,
    tipo: "AJUSTE",
    nota: nota || "Ajuste manual de kilometraje",
  });

  revalidatePath("/vehiculos");
  revalidatePath(ruta);
  redirect(`${ruta}?success=ajuste`);
}