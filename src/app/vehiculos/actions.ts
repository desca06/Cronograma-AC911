"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  trabajos,
  vehiculoKilometraje,
  vehiculos,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

function obtenerTexto(formData: FormData, campo: string) {
  const valor = formData.get(campo);

  return typeof valor === "string" ? valor.trim() : "";
}

function leerKmOpcional(formData: FormData, campo: string) {
  const texto = obtenerTexto(formData, campo);

  if (!texto) {
    return 0;
  }

  const numero = Number(texto);

  if (!Number.isInteger(numero) || numero < 0) {
    return null;
  }

  return numero;
}

export async function crearVehiculo(formData: FormData) {
  await requerirAdmin();

  const nombre = obtenerTexto(formData, "nombre");
  const placa = obtenerTexto(formData, "placa");
  const marca = obtenerTexto(formData, "marca");
  const modelo = obtenerTexto(formData, "modelo");
  const estado = obtenerTexto(formData, "estado");
  const kmActual = leerKmOpcional(formData, "kmActual");

  if (!nombre || kmActual === null) {
    redirect("/vehiculos?error=datos");
  }

  await db.insert(vehiculos).values({
    nombre,
    placa: placa || null,
    marca: marca || null,
    modelo: modelo || null,
    estado: estado || "Disponible",
    kmActual,
    activo: true,
  });

  revalidatePath("/vehiculos");
  revalidatePath("/dashboard");
  redirect("/vehiculos?success=creado");
}

export async function actualizarVehiculo(formData: FormData) {
  const sesion = await requerirAdmin();

  const id = Number(formData.get("id"));
  const nombre = obtenerTexto(formData, "nombre");
  const placa = obtenerTexto(formData, "placa");
  const marca = obtenerTexto(formData, "marca");
  const modelo = obtenerTexto(formData, "modelo");
  const estado = obtenerTexto(formData, "estado");
  const activo = formData.get("activo") === "on";
  const kmActual = leerKmOpcional(formData, "kmActual");

  if (!Number.isInteger(id) || id <= 0 || !nombre || kmActual === null) {
    redirect("/vehiculos?error=datos");
  }

  const [actual] = await db
    .select({
      kmActual: vehiculos.kmActual,
    })
    .from(vehiculos)
    .where(eq(vehiculos.id, id))
    .limit(1);

  if (!actual) {
    redirect("/vehiculos?error=vehiculo-no-encontrado");
  }

  await db
    .update(vehiculos)
    .set({
      nombre,
      placa: placa || null,
      marca: marca || null,
      modelo: modelo || null,
      estado: estado || "Disponible",
      kmActual,
      activo,
    })
    .where(eq(vehiculos.id, id));

  if (kmActual !== actual.kmActual) {
    await db.insert(vehiculoKilometraje).values({
      vehiculoId: id,
      trabajoId: null,
      usuarioId: sesion.usuarioId,
      kmAnterior: actual.kmActual,
      kmSalida: null,
      kmLlegada: kmActual,
      kmRecorridos: kmActual - actual.kmActual,
      tipo: "AJUSTE",
      nota: "Ajuste desde el listado de vehículos",
    });
  }

  revalidatePath("/vehiculos");
  revalidatePath(`/vehiculos/${id}/kilometraje`);
  revalidatePath("/dashboard");
  redirect("/vehiculos?success=actualizado");
}

export async function eliminarVehiculo(formData: FormData) {
  await requerirAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    redirect("/vehiculos?error=vehiculo-invalido");
  }

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

  await db.delete(vehiculos).where(eq(vehiculos.id, id));

  revalidatePath("/vehiculos");
  redirect("/vehiculos?success=vehiculo-eliminado");
}