"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { empleados } from "@/db/schema";

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  const valor = formData.get(campo);

  if (typeof valor !== "string") {
    return "";
  }

  return valor.trim();
}

export async function crearEmpleado(
  formData: FormData,
): Promise<void> {
  const nombre = obtenerTexto(formData, "nombre");
  const telefono = obtenerTexto(formData, "telefono");
  const puesto = obtenerTexto(formData, "puesto");

  if (!nombre) {
    return;
  }

  db.insert(empleados)
    .values({
      nombre,
      telefono: telefono || null,
      puesto: puesto || "Técnico",
      activo: true,
    })
    .run();

  revalidatePath("/empleados");
  revalidatePath("/dashboard");
}

export async function actualizarEmpleado(
  formData: FormData,
): Promise<void> {
  const id = Number(formData.get("id"));
  const nombre = obtenerTexto(formData, "nombre");
  const telefono = obtenerTexto(formData, "telefono");
  const puesto = obtenerTexto(formData, "puesto");
  const activo = formData.get("activo") === "on";

  if (!Number.isInteger(id) || id <= 0 || !nombre) {
    return;
  }

  db.update(empleados)
    .set({
      nombre,
      telefono: telefono || null,
      puesto: puesto || "Técnico",
      activo,
    })
    .where(eq(empleados.id, id))
    .run();

  revalidatePath("/empleados");
  revalidatePath("/dashboard");
}

export async function eliminarEmpleado(
  formData: FormData,
): Promise<void> {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  db.delete(empleados)
    .where(eq(empleados.id, id))
    .run();

  revalidatePath("/empleados");
  revalidatePath("/dashboard");
}