"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { vehiculos } from "@/db/schema";

function obtenerTexto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);

  return typeof valor === "string" ? valor.trim() : "";
}

export async function crearVehiculo(
  formData: FormData,
): Promise<void> {
  const nombre = obtenerTexto(formData, "nombre");
  const placa = obtenerTexto(formData, "placa");
  const marca = obtenerTexto(formData, "marca");
  const modelo = obtenerTexto(formData, "modelo");
  const estado = obtenerTexto(formData, "estado");

  if (!nombre) {
    return;
  }

  await db.insert(vehiculos)
    .values({
      nombre,
      placa: placa || null,
      marca: marca || null,
      modelo: modelo || null,
      estado: estado || "Disponible",
      activo: true,
    })
;

  revalidatePath("/vehiculos");
  revalidatePath("/dashboard");
}

export async function actualizarVehiculo(
  formData: FormData,
): Promise<void> {
  const id = Number(formData.get("id"));

  const nombre = obtenerTexto(formData, "nombre");
  const placa = obtenerTexto(formData, "placa");
  const marca = obtenerTexto(formData, "marca");
  const modelo = obtenerTexto(formData, "modelo");
  const estado = obtenerTexto(formData, "estado");
  const activo = formData.get("activo") === "on";

  if (!Number.isInteger(id) || id <= 0 || !nombre) {
    return;
  }

  await db.update(vehiculos)
    .set({
      nombre,
      placa: placa || null,
      marca: marca || null,
      modelo: modelo || null,
      estado: estado || "Disponible",
      activo,
    })
    .where(eq(vehiculos.id, id))
;

  revalidatePath("/vehiculos");
  revalidatePath("/dashboard");
}

export async function eliminarVehiculo(
  formData: FormData,
): Promise<void> {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  await db.delete(vehiculos)
    .where(eq(vehiculos.id, id))
;

  revalidatePath("/vehiculos");
  revalidatePath("/dashboard");
}