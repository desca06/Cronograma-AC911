"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clientes, trabajos } from "@/db/schema";
import { requerirSupervisor } from "@/lib/auth";

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  const valor = formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function regresarConError(error: string): never {
  redirect(`/clientes?error=${error}`);
}

export async function crearCliente(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const nombre = obtenerTexto(
    formData,
    "nombre",
  );

  const telefono = obtenerTexto(
    formData,
    "telefono",
  );

  const direccion = obtenerTexto(
    formData,
    "direccion",
  );

  if (!nombre) {
    regresarConError("nombre");
  }

  await db.insert(clientes)
    .values({
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
    })
;

  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  redirect("/clientes?exito=creado");
}

export async function actualizarCliente(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const clienteId = Number(
    formData.get("clienteId"),
  );

  const nombre = obtenerTexto(
    formData,
    "nombre",
  );

  const telefono = obtenerTexto(
    formData,
    "telefono",
  );

  const direccion = obtenerTexto(
    formData,
    "direccion",
  );

  if (
    !Number.isInteger(clienteId) ||
    clienteId <= 0 ||
    !nombre
  ) {
    regresarConError("datos");
  }

  const [clienteExiste] = await db
    .select({
      id: clientes.id,
    })
    .from(clientes)
    .where(eq(clientes.id, clienteId))
    .limit(1);

  if (!clienteExiste) {
    regresarConError("no-encontrado");
  }

  await db.update(clientes)
    .set({
      nombre,
      telefono: telefono || null,
      direccion: direccion || null,
    })
    .where(eq(clientes.id, clienteId))
;

  revalidatePath("/clientes");
  revalidatePath(
    `/clientes/${clienteId}/historial`,
  );
  revalidatePath("/trabajos");
  revalidatePath("/dashboard");

  redirect("/clientes?exito=actualizado");
}

export async function eliminarCliente(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const clienteId = Number(
    formData.get("clienteId"),
  );

  if (
    !Number.isInteger(clienteId) ||
    clienteId <= 0
  ) {
    regresarConError("datos");
  }

  const [cantidadTrabajos] = await db
    .select({
      total: sql<number>`count(*)`,
    })
    .from(trabajos)
    .where(
      eq(trabajos.clienteId, clienteId),
    )
    .limit(1);

  if (
    Number(cantidadTrabajos?.total ?? 0) > 0
  ) {
    regresarConError("trabajos");
  }

  await db.delete(clientes)
    .where(eq(clientes.id, clienteId))
;

  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  redirect("/clientes?exito=eliminado");
}