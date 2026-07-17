"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clientes } from "@/db/schema";

function obtenerTexto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);

  return typeof valor === "string" ? valor.trim() : "";
}

export async function crearCliente(formData: FormData): Promise<void> {
  const nombre = obtenerTexto(formData, "nombre");
  const telefono = obtenerTexto(formData, "telefono");
  const direccion = obtenerTexto(formData, "direccion");
  const notas = obtenerTexto(formData, "notas");

  if (!nombre) {
    return;
  }

  db.insert(clientes)
    .values({
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
      notas: notas || null,
      activo: true,
    })
    .run();

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

export async function actualizarCliente(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const nombre = obtenerTexto(formData, "nombre");
  const telefono = obtenerTexto(formData, "telefono");
  const direccion = obtenerTexto(formData, "direccion");
  const notas = obtenerTexto(formData, "notas");
  const activo = formData.get("activo") === "on";

  if (!Number.isInteger(id) || id <= 0 || !nombre) {
    return;
  }

  db.update(clientes)
    .set({
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
      notas: notas || null,
      activo,
    })
    .where(eq(clientes.id, id))
    .run();

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

export async function eliminarCliente(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  db.delete(clientes).where(eq(clientes.id, id)).run();

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}