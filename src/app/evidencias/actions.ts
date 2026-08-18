"use server";

import { randomUUID } from "node:crypto";

import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  evidencias,
  notificaciones,
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

function revalidarPaginas(
  trabajoId: number,
): void {
  revalidatePath(
    `/evidencias/${trabajoId}`,
  );

  revalidatePath("/mis-trabajos");
  revalidatePath("/trabajos");
  revalidatePath("/dashboard");
  revalidatePath("/notificaciones");
}

async function verificarAccesoAlTrabajo(
  trabajoId: number,
) {
  const sesion = await requerirSesion();

  const [trabajoExiste] = await db
    .select({
      id: trabajos.id,
    })
    .from(trabajos)
    .where(
      eq(
        trabajos.id,
        trabajoId,
      ),
    )
    .limit(1);

  if (!trabajoExiste) {
    redirect(
      sesion.rol === "SUPERVISOR"
        ? "/trabajos?error=no-encontrado"
        : "/mis-trabajos?error=no-encontrado",
    );
  }

  /*
   * Supervisores y administradores pueden
   * consultar y subir evidencias de cualquier trabajo.
   */
  if (
    sesion.rol === "SUPERVISOR" ||
    sesion.rol === "ADMIN"
  ) {
    return sesion;
  }

  /*
   * Los demás usuarios deben estar vinculados
   * a un empleado y tener el trabajo asignado.
   */
  const [usuario] = await db
    .select({
      empleadoId: usuarios.empleadoId,
    })
    .from(usuarios)
    .where(
      eq(
        usuarios.id,
        sesion.usuarioId,
      ),
    )
    .limit(1);

  if (!usuario?.empleadoId) {
    redirect(
      "/mis-trabajos?error=cuenta",
    );
  }

  const [asignacion] = await db
    .select({
      trabajoId:
        trabajoEmpleados.trabajoId,
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
    .limit(1);

  if (!asignacion) {
    redirect(
      "/mis-trabajos?error=permiso",
    );
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
    redirect(
      "/mis-trabajos?error=datos",
    );
  }

  const sesion =
    await verificarAccesoAlTrabajo(
      trabajoId,
    );

  const archivo =
    formData.get("foto");

  const descripcion =
    obtenerTexto(
      formData,
      "descripcion",
    );

  /*
   * Validar que realmente recibimos
   * un archivo.
   */
  if (
    !(archivo instanceof File) ||
    archivo.size === 0
  ) {
    redirect(
      `/evidencias/${trabajoId}?error=archivo`,
    );
  }

  /*
   * Validar formato.
   */
  const extension =
    formatosPermitidos[
      archivo.type
    ];

  if (!extension) {
    redirect(
      `/evidencias/${trabajoId}?error=formato`,
    );
  }

  /*
   * Validar tamaño máximo.
   */
  if (
    archivo.size >
    TAMANO_MAXIMO
  ) {
    redirect(
      `/evidencias/${trabajoId}?error=tamano`,
    );
  }

  /*
   * Confirmar que el trabajo todavía existe.
   */
  const [trabajo] =
    await db
      .select({
        id: trabajos.id,
        tipo: trabajos.tipo,
        fecha: trabajos.fecha,
      })
      .from(trabajos)
      .where(
        eq(
          trabajos.id,
          trabajoId,
        ),
      )
      .limit(1);

  if (!trabajo) {
    redirect(
      sesion.rol === "SUPERVISOR"
        ? "/trabajos?error=no-encontrado"
        : "/mis-trabajos?error=no-encontrado",
    );
  }

  /*
   * Nombre único para la fotografía.
   */
  const nombreArchivo =
    `${randomUUID()}.${extension}`;

  /*
   * Carpeta lógica dentro de Vercel Blob.
   */
  const rutaBlob =
    `evidencias/trabajo-${trabajoId}/${nombreArchivo}`;

  let urlArchivo: string;

  try {
    /*
     * Subir directamente desde el servidor
     * a Vercel Blob.
     *
     * El token BLOB_READ_WRITE_TOKEN
     * permanece únicamente en el servidor.
     */
    const blob = await put(
      rutaBlob,
      archivo,
      {
        access: "public",
        contentType:
          archivo.type,
      },
    );

    urlArchivo = blob.url;
  } catch (error) {
    console.error(
      "Error subiendo evidencia a Vercel Blob:",
      error,
    );

    redirect(
      `/evidencias/${trabajoId}?error=almacenamiento`,
    );
  }

  /*
   * Guardar la URL permanente de Blob
   * en PostgreSQL.
   */
  try {
    await db.transaction(
      async (tx) => {
        await tx
          .insert(evidencias)
          .values({
            trabajoId,
            usuarioId:
              sesion.usuarioId,
            archivoUrl:
              urlArchivo,
            nombreOriginal:
              archivo.name ||
              nombreArchivo,
            descripcion:
              descripcion ||
              null,
          });

        /*
         * Cuando un técnico sube evidencia,
         * avisamos a todos los supervisores.
         */
        if (
          sesion.rol !==
          "TECNICO"
        ) {
          return;
        }

        const supervisores =
          await tx
            .select({
              usuarioId:
                usuarios.id,
            })
            .from(usuarios)
            .where(
              eq(
                usuarios.rol,
                "SUPERVISOR",
              ),
            );

        if (
          supervisores.length ===
          0
        ) {
          return;
        }

        const detalleDescripcion =
          descripcion
            ? " Incluyó una descripción."
            : "";

        await tx
          .insert(notificaciones)
          .values(
            supervisores.map(
              (
                supervisor,
              ) => ({
                usuarioId:
                  supervisor.usuarioId,

                trabajoId,

                titulo:
                  "Nueva evidencia subida",

                mensaje:
                  `Se agregó una evidencia al trabajo ` +
                  `"${trabajo.tipo}" del ${trabajo.fecha}.` +
                  detalleDescripcion,

                tipo:
                  "EVIDENCIA",

                leida: false,
              }),
            ),
          );
      },
    );
  } catch (error) {
    console.error(
      "Error guardando evidencia en PostgreSQL:",
      error,
    );

    redirect(
      `/evidencias/${trabajoId}?error=base-datos`,
    );
  }

  revalidarPaginas(
    trabajoId,
  );

  redirect(
    `/evidencias/${trabajoId}?exito=subida`,
  );
}