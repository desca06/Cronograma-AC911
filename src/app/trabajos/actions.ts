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

function obtenerEmpleadoIds(
  formData: FormData,
): number[] {
  return [
    ...new Set(
      formData
        .getAll("empleadoIds")
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        ),
    ),
  ];
}

function revalidarPaginas(): void {
  revalidatePath("/trabajos");
  revalidatePath("/cronograma");
  revalidatePath("/dashboard");
  revalidatePath("/mis-trabajos");
  revalidatePath("/notificaciones");
}

export async function crearTrabajo(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const fecha = obtenerTexto(
    formData,
    "fecha",
  );

  const clienteId = Number(
    formData.get("clienteId"),
  );

  const vehiculoSeleccionado = Number(
    formData.get("vehiculoId"),
  );

  const tipo = obtenerTexto(
    formData,
    "tipo",
  );

  const descripcion = obtenerTexto(
    formData,
    "descripcion",
  );

  const direccion = obtenerTexto(
    formData,
    "direccion",
  );

  const estado = obtenerTexto(
    formData,
    "estado",
  );

  const horaInicio = obtenerTexto(
    formData,
    "horaInicio",
  );

  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  const empleadoIds =
    obtenerEmpleadoIds(formData);

  if (
    !fecha ||
    !Number.isInteger(clienteId) ||
    clienteId <= 0 ||
    !tipo ||
    !descripcion
  ) {
    redirect("/trabajos?error=datos");
  }

  await db.transaction(async (tx) => {
    const [nuevoTrabajo] = await tx
      .insert(trabajos)
      .values({
        fecha,
        clienteId,

        vehiculoId:
          Number.isInteger(
            vehiculoSeleccionado,
          ) &&
          vehiculoSeleccionado > 0
            ? vehiculoSeleccionado
            : null,

        tipo,
        descripcion,
        direccion: direccion || null,
        estado: estado || "Pendiente",
        horaInicio: horaInicio || null,
        observaciones:
          observaciones || null,
      })
      .returning({ id: trabajos.id });

    const trabajoId = nuevoTrabajo.id;

    if (empleadoIds.length === 0) {
      return;
    }

    await tx.insert(trabajoEmpleados)
      .values(
        empleadoIds.map(
          (empleadoId) => ({
            trabajoId,
            empleadoId,
          }),
        ),
      )
;

    /*
     * Busca las cuentas técnicas vinculadas
     * con los empleados asignados.
     */
    const destinatarios = await tx
      .select({
        usuarioId: usuarios.id,
      })
      .from(trabajoEmpleados)
      .innerJoin(
        usuarios,
        eq(
          trabajoEmpleados.empleadoId,
          usuarios.empleadoId,
        ),
      )
      .where(
        and(
          eq(
            trabajoEmpleados.trabajoId,
            trabajoId,
          ),
          eq(usuarios.rol, "TECNICO"),
        ),
      )
;

    const usuarioIds = [
      ...new Set(
        destinatarios.map(
          (destinatario) =>
            destinatario.usuarioId,
        ),
      ),
    ];

    if (usuarioIds.length > 0) {
      const detalleHora = horaInicio
        ? ` a las ${horaInicio}`
        : "";

      await tx.insert(notificaciones)
        .values(
          usuarioIds.map((usuarioId) => ({
            usuarioId,
            trabajoId,
            titulo:
              "Nuevo trabajo asignado",
            mensaje:
              `${tipo} programado para el ` +
              `${fecha}${detalleHora}.`,
            tipo: "ASIGNACION",
            leida: false,
          })),
        )
;
    }
  });

  revalidarPaginas();

  redirect("/trabajos?exito=creado");
}

export async function actualizarEstadoTrabajo(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const id = Number(
    formData.get("id"),
  );

  const estado = obtenerTexto(
    formData,
    "estado",
  );

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !estado
  ) {
    redirect("/trabajos?error=datos");
  }

  const [trabajoActual] = await db
    .select({
      id: trabajos.id,
      tipo: trabajos.tipo,
      fecha: trabajos.fecha,
      estado: trabajos.estado,
    })
    .from(trabajos)
    .where(eq(trabajos.id, id))
    .limit(1);

  if (!trabajoActual) {
    redirect(
      "/trabajos?error=no-encontrado",
    );
  }

  /*
   * No genera otra notificación cuando
   * realmente no cambió el estado.
   */
  if (trabajoActual.estado === estado) {
    redirect("/trabajos");
  }

  await db.transaction(async (tx) => {
    await tx.update(trabajos)
      .set({
        estado,
      })
      .where(eq(trabajos.id, id))
;

    const destinatarios = await tx
      .select({
        usuarioId: usuarios.id,
      })
      .from(trabajoEmpleados)
      .innerJoin(
        usuarios,
        eq(
          trabajoEmpleados.empleadoId,
          usuarios.empleadoId,
        ),
      )
      .where(
        and(
          eq(
            trabajoEmpleados.trabajoId,
            id,
          ),
          eq(usuarios.rol, "TECNICO"),
        ),
      )
;

    const usuarioIds = [
      ...new Set(
        destinatarios.map(
          (destinatario) =>
            destinatario.usuarioId,
        ),
      ),
    ];

    if (usuarioIds.length > 0) {
      await tx.insert(notificaciones)
        .values(
          usuarioIds.map((usuarioId) => ({
            usuarioId,
            trabajoId: id,

            titulo:
              estado === "Cancelado"
                ? "Trabajo cancelado"
                : "Estado actualizado",

            mensaje:
              `El trabajo "${trabajoActual.tipo}" ` +
              `del ${trabajoActual.fecha} ` +
              `cambió a ${estado}.`,

            tipo:
              estado === "Cancelado"
                ? "CANCELACION"
                : "ESTADO",

            leida: false,
          })),
        )
;
    }
  });

  revalidarPaginas();

  redirect("/trabajos");
}

export async function eliminarTrabajo(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const id = Number(
    formData.get("id"),
  );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    redirect("/trabajos?error=datos");
  }

  await db.transaction(async (tx) => {
    await tx.delete(trabajoEmpleados)
      .where(
        eq(
          trabajoEmpleados.trabajoId,
          id,
        ),
      )
;

    await tx.delete(trabajos)
      .where(eq(trabajos.id, id))
;
  });

  revalidarPaginas();

  redirect("/trabajos?exito=eliminado");
}

export async function actualizarTrabajoCompleto(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const id = Number(
    formData.get("id"),
  );

  const fecha = obtenerTexto(
    formData,
    "fecha",
  );

  const clienteId = Number(
    formData.get("clienteId"),
  );

  const vehiculoSeleccionado = Number(
    formData.get("vehiculoId"),
  );

  const tipo = obtenerTexto(
    formData,
    "tipo",
  );

  const descripcion = obtenerTexto(
    formData,
    "descripcion",
  );

  const direccion = obtenerTexto(
    formData,
    "direccion",
  );

  const estado = obtenerTexto(
    formData,
    "estado",
  );

  const horaInicio = obtenerTexto(
    formData,
    "horaInicio",
  );

  const horaFin = obtenerTexto(
    formData,
    "horaFin",
  );

  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  const empleadoIds =
    obtenerEmpleadoIds(formData);

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !fecha ||
    !Number.isInteger(clienteId) ||
    clienteId <= 0 ||
    !tipo ||
    !descripcion
  ) {
    redirect("/trabajos?error=datos");
  }

  const [trabajoExiste] = await db
    .select({
      id: trabajos.id,
    })
    .from(trabajos)
    .where(eq(trabajos.id, id))
    .limit(1);

  if (!trabajoExiste) {
    redirect(
      "/trabajos?error=no-encontrado",
    );
  }

  await db.transaction(async (tx) => {
    await tx.update(trabajos)
      .set({
        fecha,
        clienteId,

        vehiculoId:
          Number.isInteger(
            vehiculoSeleccionado,
          ) &&
          vehiculoSeleccionado > 0
            ? vehiculoSeleccionado
            : null,

        tipo,
        descripcion,
        direccion: direccion || null,
        estado: estado || "Pendiente",
        horaInicio: horaInicio || null,
        horaFin: horaFin || null,
        observaciones:
          observaciones || null,
      })
      .where(eq(trabajos.id, id))
;

    await tx.delete(trabajoEmpleados)
      .where(
        eq(
          trabajoEmpleados.trabajoId,
          id,
        ),
      )
;

    if (empleadoIds.length === 0) {
      return;
    }

    await tx.insert(trabajoEmpleados)
      .values(
        empleadoIds.map(
          (empleadoId) => ({
            trabajoId: id,
            empleadoId,
          }),
        ),
      )
;

    const destinatarios = await tx
      .select({
        usuarioId: usuarios.id,
      })
      .from(trabajoEmpleados)
      .innerJoin(
        usuarios,
        eq(
          trabajoEmpleados.empleadoId,
          usuarios.empleadoId,
        ),
      )
      .where(
        and(
          eq(
            trabajoEmpleados.trabajoId,
            id,
          ),
          eq(usuarios.rol, "TECNICO"),
        ),
      )
;

    const usuarioIds = [
      ...new Set(
        destinatarios.map(
          (destinatario) =>
            destinatario.usuarioId,
        ),
      ),
    ];

    if (usuarioIds.length > 0) {
      const detalleHora = horaInicio
        ? ` a las ${horaInicio}`
        : "";

      await tx.insert(notificaciones)
        .values(
          usuarioIds.map((usuarioId) => ({
            usuarioId,
            trabajoId: id,
            titulo: "Trabajo actualizado",

            mensaje:
              `${tipo} fue actualizado para ` +
              `${fecha}${detalleHora}.`,

            tipo: "ACTUALIZACION",
            leida: false,
          })),
        )
;
    }
  });

  revalidarPaginas();

  redirect(
    `/trabajos?exito=actualizado`,
  );
}