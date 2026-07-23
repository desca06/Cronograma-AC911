"use server";
import { db } from "@/db";
import { trabajos, vehiculos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

export async function eliminarVehiculo(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    redirect("/vehiculos?error=vehiculo-invalido");
  }

  // Revisar si existe al menos un trabajo asociado al vehículo
  const trabajoAsociado = await db
    .select({
      id: trabajos.id,
    })
    .from(trabajos)
    .where(eq(trabajos.vehiculoId, id))
    .limit(1);

  if (trabajoAsociado.length > 0) {
    redirect("/vehiculos?error=vehiculo-con-trabajos");
  }

  await db
    .delete(vehiculos)
    .where(eq(vehiculos.id, id));

  revalidatePath("/vehiculos");
  redirect("/vehiculos?success=vehiculo-eliminado");
}