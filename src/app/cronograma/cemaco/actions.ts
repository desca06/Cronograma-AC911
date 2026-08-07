"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  cronogramaNotasCemaco,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

const IMPORTANCIAS = [
  "CUMPLIDO",
  "EN_PROCESO",
  "PENDIENTE",
  "URGENTE",
] as const;

type Importancia =
  (typeof IMPORTANCIAS)[number];

function esImportanciaValida(
  valor: string,
): valor is Importancia {
  return IMPORTANCIAS.includes(
    valor as Importancia,
  );
}

function esFechaValida(fecha: string) {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(
    fecha,
  );
}

export async function guardarNotaCemaco(
  formData: FormData,
) {
  await requerirAdmin();

  const fecha = String(
    formData.get("fecha") ?? "",
  ).trim();

  const contenido = String(
    formData.get("contenido") ?? "",
  ).trim();

  const importancia = String(
    formData.get("importancia") ?? "",
  ).trim();

  if (!esFechaValida(fecha)) {
    return {
      ok: false,
      mensaje: "La fecha no es válida.",
    };
  }

  if (!esImportanciaValida(importancia)) {
    return {
      ok: false,
      mensaje:
        "La importancia seleccionada no es válida.",
    };
  }

  if (!contenido) {
    return {
      ok: false,
      mensaje:
        "Escribe al menos una actividad CEMACO.",
    };
  }

  if (contenido.length > 2000) {
    return {
      ok: false,
      mensaje:
        "El contenido supera el límite permitido.",
    };
  }

  const ahora = new Date().toISOString();

  await db
    .insert(cronogramaNotasCemaco)
    .values({
      fecha,
      contenido,
      importancia,
      actualizadoEn: ahora,
    })
    .onConflictDoUpdate({
      target:
        cronogramaNotasCemaco.fecha,
      set: {
        contenido,
        importancia,
        actualizadoEn: ahora,
      },
    });

  revalidatePath(
    "/cronograma/cemaco",
  );

  return {
    ok: true,
    mensaje:
      "La actividad CEMACO fue guardada correctamente.",
  };
}

export async function eliminarNotaCemaco(
  formData: FormData,
) {
  await requerirAdmin();

  const fecha = String(
    formData.get("fecha") ?? "",
  ).trim();

  if (!esFechaValida(fecha)) {
    return {
      ok: false,
      mensaje: "La fecha no es válida.",
    };
  }

  await db
    .delete(cronogramaNotasCemaco)
    .where(
      eq(
        cronogramaNotasCemaco.fecha,
        fecha,
      ),
    );

  revalidatePath(
    "/cronograma/cemaco",
  );

  return {
    ok: true,
    mensaje:
      "La actividad CEMACO fue eliminada correctamente.",
  };
}
