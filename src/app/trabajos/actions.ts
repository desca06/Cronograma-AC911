"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {redirect} from "next/navigation";

import { db } from "@/db";
import {
  trabajos,
  trabajoEmpleados,
} from "@/db/schema";

function obtenerTexto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

export async function crearTrabajo(
  formData: FormData,
): Promise<void> {
  const fecha = obtenerTexto(formData, "fecha");
  const clienteId = Number(formData.get("clienteId"));
  const vehiculoSeleccionado = Number(
    formData.get("vehiculoId"),
  );

  const tipo = obtenerTexto(formData, "tipo");
  const descripcion = obtenerTexto(formData, "descripcion");
  const direccion = obtenerTexto(formData, "direccion");
  const estado = obtenerTexto(formData, "estado");
  const horaInicio = obtenerTexto(formData, "horaInicio");
  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  const empleadoIds = [
    ...new Set(
      formData
        .getAll("empleadoIds")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  if (
    !fecha ||
    !Number.isInteger(clienteId) ||
    clienteId <= 0 ||
    !tipo ||
    !descripcion
  ) {
    return;
  }

  db.transaction((tx) => {
    const resultado = tx
      .insert(trabajos)
      .values({
        fecha,
        clienteId,
        vehiculoId:
          Number.isInteger(vehiculoSeleccionado) &&
          vehiculoSeleccionado > 0
            ? vehiculoSeleccionado
            : null,
        tipo,
        descripcion,
        direccion: direccion || null,
        estado: estado || "Pendiente",
        horaInicio: horaInicio || null,
        observaciones: observaciones || null,
      })
      .run();

    const trabajoId = Number(resultado.lastInsertRowid);

    if (empleadoIds.length > 0) {
      tx.insert(trabajoEmpleados)
        .values(
          empleadoIds.map((empleadoId) => ({
            trabajoId,
            empleadoId,
          })),
        )
        .run();
    }
  });

  revalidatePath("/trabajos");
  revalidatePath("/dashboard");
}

export async function actualizarEstadoTrabajo(
  formData: FormData,
): Promise<void> {
  const id = Number(formData.get("id"));
  const estado = obtenerTexto(formData, "estado");

  if (!Number.isInteger(id) || id <= 0 || !estado) {
    return;
  }

  db.update(trabajos)
    .set({
      estado,
    })
    .where(eq(trabajos.id, id))
    .run();

  revalidatePath("/trabajos");
  revalidatePath("/dashboard");
}

export async function eliminarTrabajo(
  formData: FormData,
): Promise<void> {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  db.transaction((tx) => {
    tx.delete(trabajoEmpleados)
      .where(eq(trabajoEmpleados.trabajoId, id))
      .run();

    tx.delete(trabajos)
      .where(eq(trabajos.id, id))
      .run();
  });

  revalidatePath("/trabajos");
  revalidatePath("/dashboard");
}

export async function actualizarTrabajoCompleto(
  formData: FormData,
): Promise<void> {
  const id = Number(formData.get("id"));
  const fecha = obtenerTexto(formData, "fecha");
  const clienteId = Number(formData.get("clienteId"));
  const vehiculoSeleccionado = Number(
    formData.get("vehiculoId"),
  );

  const tipo = obtenerTexto(formData, "tipo");
  const descripcion = obtenerTexto(formData, "descripcion");
  const direccion = obtenerTexto(formData, "direccion");
  const estado = obtenerTexto(formData, "estado");
  const horaInicio = obtenerTexto(formData, "horaInicio");
  const horaFin = obtenerTexto(formData, "horaFin");
  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  const empleadoIds = [
    ...new Set(
      formData
        .getAll("empleadoIds")
        .map(Number)
        .filter(
          (empleadoId) =>
            Number.isInteger(empleadoId) &&
            empleadoId > 0,
        ),
    ),
  ];

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !fecha ||
    !Number.isInteger(clienteId) ||
    clienteId <= 0 ||
    !tipo ||
    !descripcion
  ) {
    return;
  }

  db.transaction((tx) => {
    tx.update(trabajos)
      .set({
        fecha,
        clienteId,
        vehiculoId:
          Number.isInteger(vehiculoSeleccionado) &&
          vehiculoSeleccionado > 0
            ? vehiculoSeleccionado
            : null,
        tipo,
        descripcion,
        direccion: direccion || null,
        estado: estado || "Pendiente",
        horaInicio: horaInicio || null,
        horaFin: horaFin || null,
        observaciones: observaciones || null,
      })
      .where(eq(trabajos.id, id))
      .run();

    tx.delete(trabajoEmpleados)
      .where(eq(trabajoEmpleados.trabajoId, id))
      .run();

    if (empleadoIds.length > 0) {
      tx.insert(trabajoEmpleados)
        .values(
          empleadoIds.map((empleadoId) => ({
            trabajoId: id,
            empleadoId,
          })),
        )
        .run();
    }
  });

  revalidatePath("/trabajos");
  revalidatePath("/cronograma");
  revalidatePath("/dashboard");

  redirect("/trabajos");
}