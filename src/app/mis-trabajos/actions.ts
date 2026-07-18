"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  notificaciones,
  trabajos,
  trabajoEmpleados,
  usuarios,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  const valor = formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function revalidarPaginas(): void {
  revalidatePath("/mis-trabajos");
  revalidatePath("/dashboard");
  revalidatePath("/cronograma");
  revalidatePath("/trabajos");
  revalidatePath("/notificaciones");
}

export async function actualizarMiTrabajo(
  formData: FormData,
): Promise<void> {
  const sesion = await requerirSesion();

  if (sesion.rol !== "TECNICO") {
    redirect("/dashboard");
  }

  const trabajoId = Number(
    formData.get("trabajoId"),
  );

  const estado = obtenerTexto(
    formData,
    "estado",
  );

  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  const estadosPermitidos = [
    "Pendiente",
    "En camino",
    "En proceso",
    "Finalizado",
  ];

  if (
    !Number.isInteger(trabajoId) ||
    trabajoId <= 0 ||
    !estadosPermitidos.includes(estado)
  ) {
    redirect("/mis-trabajos?error=datos");
  }

  const usuario = db
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
    .get();

  if (!usuario?.empleadoId) {
    redirect("/mis-trabajos?error=cuenta");
  }

  /*
   * Verifica que el técnico esté realmente
   * asignado al trabajo antes de modificarlo.
   */
  const asignacion = db
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
    .get();

  if (!asignacion) {
    redirect(
      "/mis-trabajos?error=permiso",
    );
  }

  const trabajoActual = db
    .select({
      id: trabajos.id,
      tipo: trabajos.tipo,
      fecha: trabajos.fecha,
      estado: trabajos.estado,
      observaciones:
        trabajos.observaciones,
    })
    .from(trabajos)
    .where(
      eq(trabajos.id, trabajoId),
    )
    .get();

  if (!trabajoActual) {
    redirect(
      "/mis-trabajos?error=no-encontrado",
    );
  }

  const observacionesAnteriores =
    trabajoActual.observaciones?.trim() ?? "";

  const cambioEstado =
    trabajoActual.estado !== estado;

  const cambioObservaciones =
    observacionesAnteriores !== observaciones;

  /*
   * Si el técnico envía exactamente los mismos
   * datos, no actualiza ni crea otra notificación.
   */
  if (
    !cambioEstado &&
    !cambioObservaciones
  ) {
    redirect(
      "/mis-trabajos?exito=sin-cambios",
    );
  }

  db.transaction((tx) => {
    tx.update(trabajos)
      .set({
        estado,
        observaciones:
          observaciones || null,
      })
      .where(
        eq(trabajos.id, trabajoId),
      )
      .run();

    /*
     * Obtiene todos los supervisores para
     * notificarles el cambio realizado.
     */
    const supervisores = tx
      .select({
        usuarioId: usuarios.id,
      })
      .from(usuarios)
      .where(
        eq(usuarios.rol, "SUPERVISOR"),
      )
      .all();

    if (supervisores.length === 0) {
      return;
    }

    let titulo =
      "Trabajo actualizado por técnico";

    let mensaje =
      `El trabajo "${trabajoActual.tipo}" ` +
      `del ${trabajoActual.fecha} fue actualizado.`;

    let tipoNotificacion =
      "ACTUALIZACION";

    if (cambioEstado) {
      titulo =
        estado === "Finalizado"
          ? "Trabajo finalizado"
          : "Estado actualizado por técnico";

      mensaje =
        `El trabajo "${trabajoActual.tipo}" ` +
        `del ${trabajoActual.fecha} cambió ` +
        `de ${trabajoActual.estado} a ${estado}.`;

      tipoNotificacion = "ESTADO";
    }

    if (
      cambioEstado &&
      cambioObservaciones
    ) {
      mensaje +=
        " También se actualizaron las observaciones.";
    } else if (
      !cambioEstado &&
      cambioObservaciones
    ) {
      titulo =
        "Observaciones actualizadas";

      mensaje =
        `El técnico actualizó las observaciones ` +
        `del trabajo "${trabajoActual.tipo}" ` +
        `programado para el ${trabajoActual.fecha}.`;
    }

    tx.insert(notificaciones)
      .values(
        supervisores.map(
          (supervisor) => ({
            usuarioId:
              supervisor.usuarioId,
            trabajoId,
            titulo,
            mensaje,
            tipo: tipoNotificacion,
            leida: false,
          }),
        ),
      )
      .run();
  });

  revalidarPaginas();

  redirect(
    "/mis-trabajos?exito=actualizado",
  );
}