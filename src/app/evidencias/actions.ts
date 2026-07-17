"use server";

import { randomUUID } from "node:crypto";
import {
  mkdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  evidencias,
  trabajos,
  trabajoEmpleados,
  usuarios,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

const TAMANO_MAXIMO = 5 * 1024 * 1024;

const formatosPermitidos: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  const valor = formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}

async function verificarAccesoAlTrabajo(
  trabajoId: number,
) {
  const sesion = await requerirSesion();

  const trabajoExiste = db
    .select({
      id: trabajos.id,
    })
    .from(trabajos)
    .where(eq(trabajos.id, trabajoId))
    .get();

  if (!trabajoExiste) {
    redirect(
      sesion.rol === "SUPERVISOR"
        ? "/trabajos?error=no-encontrado"
        : "/mis-trabajos?error=no-encontrado",
    );
  }

  if (sesion.rol === "SUPERVISOR") {
    return sesion;
  }

  const usuario = db
    .select({
      empleadoId: usuarios.empleadoId,
    })
    .from(usuarios)
    .where(eq(usuarios.id, sesion.usuarioId))
    .get();

  if (!usuario?.empleadoId) {
    redirect("/mis-trabajos?error=cuenta");
  }

  const asignacion = db
    .select({
      trabajoId: trabajoEmpleados.trabajoId,
    })
    .from(trabajoEmpleados)
    .where(
      and(
        eq(
          trabajoEmpleados.trabajoId,
          trabajoId,
        ),
        eq(
          trabajoEmpleados.empleadoId,
          usuario.empleadoId,
        ),
      ),
    )
    .get();

  if (!asignacion) {
    redirect("/mis-trabajos?error=permiso");
  }

  return sesion;
}

export async function subirEvidencia(
  formData: FormData,
): Promise<void> {
  const trabajoId = Number(
    formData.get("trabajoId"),
  );

  if (
    !Number.isInteger(trabajoId) ||
    trabajoId <= 0
  ) {
    redirect("/mis-trabajos?error=datos");
  }

  const sesion =
    await verificarAccesoAlTrabajo(trabajoId);

  const archivo = formData.get("foto");

  const descripcion = obtenerTexto(
    formData,
    "descripcion",
  );

  if (
    !(archivo instanceof File) ||
    archivo.size === 0
  ) {
    redirect(
      `/evidencias/${trabajoId}?error=archivo`,
    );
  }

  const extension =
    formatosPermitidos[archivo.type];

  if (!extension) {
    redirect(
      `/evidencias/${trabajoId}?error=formato`,
    );
  }

  if (archivo.size > TAMANO_MAXIMO) {
    redirect(
      `/evidencias/${trabajoId}?error=tamano`,
    );
  }

  const nombreArchivo =
    `${randomUUID()}.${extension}`;

  const carpetaDestino = path.join(
    process.cwd(),
    "public",
    "uploads",
    "evidencias",
  );

  await mkdir(carpetaDestino, {
    recursive: true,
  });

  const rutaFisica = path.join(
    carpetaDestino,
    nombreArchivo,
  );

  const contenido = Buffer.from(
    await archivo.arrayBuffer(),
  );

  await writeFile(
    rutaFisica,
    contenido,
  );

  try {
    db.insert(evidencias)
      .values({
        trabajoId,
        usuarioId: sesion.usuarioId,
        archivoUrl:
          `/uploads/evidencias/${nombreArchivo}`,
        nombreOriginal:
          archivo.name || nombreArchivo,
        descripcion:
          descripcion || null,
      })
      .run();
  } catch (error) {
    await unlink(rutaFisica).catch(() => {
      // Evita dejar fotografías sin registro.
    });

    throw error;
  }

  revalidatePath(
    `/evidencias/${trabajoId}`,
  );

  revalidatePath("/mis-trabajos");
  revalidatePath("/trabajos");
  revalidatePath("/dashboard");

  redirect(
    `/evidencias/${trabajoId}?exito=subida`,
  );
}