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
import { enviarPushAUsuarios } from "@/lib/push";

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  const valor = formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function obtenerRutaRetorno(
  formData: FormData,
  trabajoId: number,
): string {
  const ruta = obtenerTexto(
    formData,
    "rutaRetorno",
  );

  const rutaDetalle =
    `/mis-trabajos/${trabajoId}`;

  return ruta === rutaDetalle
    ? rutaDetalle
    : "/mis-trabajos";
}

function agregarParametro(
  ruta: string,
  nombre: "error" | "exito",
  valor: string,
): string {
  return `${ruta}?${nombre}=${encodeURIComponent(valor)}`;
}

function revalidarPaginas(
  trabajoId: number,
): void {
  revalidatePath("/mis-trabajos");
  revalidatePath(
    `/mis-trabajos/${trabajoId}`,
  );
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

  if (
    !Number.isInteger(trabajoId) ||
    trabajoId <= 0
  ) {
    redirect(
      "/mis-trabajos?error=datos",
    );
  }

  const rutaRetorno =
    obtenerRutaRetorno(
      formData,
      trabajoId,
    );

  const estado = obtenerTexto(
    formData,
    "estado",
  );

  const observacionesTecnico = obtenerTexto(
    formData,
    "observacionesTecnico",
  );

  const estadosPermitidos = [
    "Pendiente",
    "En camino",
    "En proceso",
    "Finalizado",
  ];

  if (!estadosPermitidos.includes(estado)) {
    redirect(
      agregarParametro(
        rutaRetorno,
        "error",
        "datos",
      ),
    );
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
    redirect(
      agregarParametro(
        rutaRetorno,
        "error",
        "cuenta",
      ),
    );
  }

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
      agregarParametro(
        rutaRetorno,
        "error",
        "permiso",
      ),
    );
  }

  const trabajoActual = db
    .select({
      id: trabajos.id,
      tipo: trabajos.tipo,
      fecha: trabajos.fecha,
      estado: trabajos.estado,
      observacionesTecnico:
        trabajos.observacionesTecnico,
    })
    .from(trabajos)
    .where(
      eq(
        trabajos.id,
        trabajoId,
      ),
    )
    .get();

  if (!trabajoActual) {
    redirect(
      agregarParametro(
        rutaRetorno,
        "error",
        "no-encontrado",
      ),
    );
  }

  const observacionesTecnicoAnteriores =
    trabajoActual.observacionesTecnico
      ?.trim() ?? "";

  const cambioEstado =
    trabajoActual.estado !== estado;

  const cambioObservacionesTecnico =
    observacionesTecnicoAnteriores !==
    observacionesTecnico;

  if (
    !cambioEstado &&
    !cambioObservacionesTecnico
  ) {
    redirect(
      agregarParametro(
        rutaRetorno,
        "exito",
        "sin-cambios",
      ),
    );
  }

  db.transaction((tx) => {
    tx.update(trabajos)
      .set({
        estado,
        observacionesTecnico:
          observacionesTecnico || null,
      })
      .where(
        eq(
          trabajos.id,
          trabajoId,
        ),
      )
      .run();

    const supervisores = tx
      .select({
        usuarioId: usuarios.id,
      })
      .from(usuarios)
      .where(
        eq(
          usuarios.rol,
          "SUPERVISOR",
        ),
      )
      .all();

    if (supervisores.length === 0) {
      return;
    }

    supervisorIds = supervisores.map(
      (supervisor) =>
        supervisor.usuarioId,
    );

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
      cambioObservacionesTecnico
    ) {
      mensaje +=
        " El técnico también agregó o actualizó sus observaciones.";
    } else if (
      !cambioEstado &&
      cambioObservacionesTecnico
    ) {
      titulo =
        "Observaciones del técnico actualizadas";

      mensaje =
        `El técnico agregó o actualizó sus ` +
        `observaciones en el trabajo ` +
        `"${trabajoActual.tipo}" del ` +
        `${trabajoActual.fecha}.`;
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

  revalidarPaginas(trabajoId);

  redirect(
    agregarParametro(
      rutaRetorno,
      "exito",
      "actualizado",
    ),
  );
}