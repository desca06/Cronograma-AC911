"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  cotizaciones,
  trabajos,
  trabajoEmpleados,
  usuarios,
} from "@/db/schema";
import {
  cotizacionTrabajos,
} from "@/db/schema-cotizacion-trabajo";
import { requerirSupervisor } from "@/lib/auth";
import {
  leerIdOpcional,
  validarUbicacionCliente,
} from "@/lib/ubicacion-cliente";
import {
  notificarEstadoTrabajo,
  notificarTrabajoActualizado,
  notificarTrabajoAsignado,
} from "@/lib/notificaciones";

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
  revalidatePath("/trabajos-asignados");
  revalidatePath("/cronograma");
  revalidatePath("/cronograma/cemaco");
  revalidatePath("/dashboard");
  revalidatePath("/mis-trabajos");
  revalidatePath("/notificaciones");
  revalidatePath(
    "/administracion/compras/cotizaciones",
  );
}

function rutaNuevoTrabajo(
  cotizacionId: number | null,
  error: string,
  detalle?: string,
) {
  const parametros = new URLSearchParams({
    error,
  });

  if (cotizacionId) {
    parametros.set("cotizacionId", String(cotizacionId));
  }

  if (detalle) {
    parametros.set("detalle", detalle.slice(0, 180));
  }

  return `/trabajos/nuevo?${parametros.toString()}`;
}

function mensajeErrorGuardar(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Error desconocido al guardar el trabajo.";
}

function esRedirectNext(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith(
      "NEXT_REDIRECT",
    )
  );
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

  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  const empleadoIds =
    obtenerEmpleadoIds(formData);

  const subtiendaId = leerIdOpcional(
    formData.get("subtiendaId"),
  );

  const areaId = leerIdOpcional(
    formData.get("areaId"),
  );

  const cotizacionSeleccionada =
    Number(
      formData.get(
        "cotizacionId",
      ),
    );

  const cotizacionId =
    Number.isInteger(
      cotizacionSeleccionada,
    ) &&
      cotizacionSeleccionada > 0
      ? cotizacionSeleccionada
      : null;

  if (
    !fecha ||
    (
      !cotizacionId &&
      (
        !Number.isInteger(
          clienteId,
        ) ||
        clienteId <= 0
      )
    ) ||
    !tipo ||
    !descripcion
  ) {
    redirect(
      rutaNuevoTrabajo(cotizacionId, "datos"),
    );
  }

  let clienteIdFinal =
    clienteId;

  let trabajoCreadoId = 0;
  let usuarioIdsNotificar: number[] = [];

  try {
    await db.transaction(async (tx) => {
      if (cotizacionId) {
        const [cotizacionOrigen] =
          await tx
            .select({
              id:
                cotizaciones.id,
              clienteId:
                cotizaciones.clienteId,
              estado:
                cotizaciones.estado,
            })
            .from(cotizaciones)
            .where(
              eq(
                cotizaciones.id,
                cotizacionId,
              ),
            )
            .limit(1);

        if (!cotizacionOrigen) {
          throw new Error(
            "COTIZACION_NO_EXISTE",
          );
        }

        if (
          cotizacionOrigen.estado !==
          "APROBADA"
        ) {
          throw new Error(
            "COTIZACION_NO_APROBADA",
          );
        }

        /*
         * Si el supervisor seleccionó una cotización,
         * el cliente verdadero siempre será el cliente
         * de esa cotización. Así no pueden quedar
         * asociados datos inconsistentes.
         */
        clienteIdFinal =
          cotizacionOrigen.clienteId;

        const [yaVinculada] =
          await tx
            .select({
              trabajoId:
                cotizacionTrabajos.trabajoId,
            })
            .from(
              cotizacionTrabajos,
            )
            .where(
              eq(
                cotizacionTrabajos.cotizacionId,
                cotizacionId,
              ),
            )
            .limit(1);

        if (yaVinculada) {
          throw new Error(
            "COTIZACION_YA_TIENE_TRABAJO",
          );
        }
      }

      const ubicacion =
        await validarUbicacionCliente(tx, {
          clienteId: clienteIdFinal,
          subtiendaId,
          areaId,
        });

      const [nuevoTrabajo] = await tx
        .insert(trabajos)
        .values({
          fecha,
          clienteId:
            clienteIdFinal,
          subtiendaId: ubicacion.subtiendaId,
          areaId: ubicacion.areaId,

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
          horaInicio: null,
          observaciones:
            observaciones || null,
        })
        .returning({ id: trabajos.id });

      if (!nuevoTrabajo) {
        throw new Error("No se pudo crear el trabajo.");
      }

      const trabajoId =
        nuevoTrabajo.id;

      trabajoCreadoId =
        trabajoId;

      if (cotizacionId) {
        await tx
          .insert(
            cotizacionTrabajos,
          )
          .values({
            cotizacionId,
            trabajoId,
          });
      }

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

      usuarioIdsNotificar =
        usuarioIds;
    });
  }catch (error) {
    if (esRedirectNext(error)) {
      throw error;
    }

    if (
      error instanceof Error &&
      error.message === "UBICACION_INVALIDA"
    ) {
      redirect(rutaNuevoTrabajo(cotizacionId, "ubicacion"));
    }

    if (
      cotizacionId &&
      error instanceof Error
    ) {
      if (error.message === "COTIZACION_NO_EXISTE") {
        redirect(rutaNuevoTrabajo(cotizacionId, "datos"));
      }

      if (error.message === "COTIZACION_NO_APROBADA") {
        redirect(
          `/administracion/compras/cotizaciones/${cotizacionId}?error=no-aprobada`,
        );
      }

      if (error.message === "COTIZACION_YA_TIENE_TRABAJO") {
        redirect(
          `/administracion/compras/cotizaciones/${cotizacionId}?error=trabajo-duplicado`,
        );
      }
    }

    console.error("[AC911] No se pudo crear el trabajo:", error);
    redirect(
      rutaNuevoTrabajo(
        cotizacionId,
        "guardar",
        mensajeErrorGuardar(error),
      ),
    );
  }

  if (
    trabajoCreadoId > 0 &&
    usuarioIdsNotificar.length > 0
  ) {
    await notificarTrabajoAsignado({
      usuarioIds:
        usuarioIdsNotificar,
      trabajoId:
        trabajoCreadoId,
      tipoTrabajo:
        tipo,
      fecha,
    });
  }

  revalidarPaginas();

  if (cotizacionId) {
    revalidatePath(
      `/administracion/compras/cotizaciones/${cotizacionId}`,
    );

    redirect(
      `/administracion/compras/cotizaciones/${cotizacionId}?trabajo=creado`,
    );
  }

  redirect(
    "/trabajos?exito=creado",
  );
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

  let usuarioIdsNotificar: number[] = [];

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

    usuarioIdsNotificar =
      usuarioIds;
  });

  if (
    usuarioIdsNotificar.length > 0
  ) {
    await notificarEstadoTrabajo({
      usuarioIds:
        usuarioIdsNotificar,
      trabajoId: id,
      tipoTrabajo:
        trabajoActual.tipo,
      fecha:
        trabajoActual.fecha,
      estado,
    });
  }

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

  const subtiendaId = leerIdOpcional(
    formData.get("subtiendaId"),
  );

  const areaId = leerIdOpcional(
    formData.get("areaId"),
  );

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

  let usuarioIdsNotificar: number[] = [];

  try {
    await db.transaction(async (tx) => {
      const ubicacion =
        await validarUbicacionCliente(tx, {
          clienteId,
          subtiendaId,
          areaId,
        });

      await tx.update(trabajos)
        .set({
          fecha,
          clienteId,
          subtiendaId: ubicacion.subtiendaId,
          areaId: ubicacion.areaId,

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

      usuarioIdsNotificar =
        usuarioIds;
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UBICACION_INVALIDA"
    ) {
      redirect(`/trabajos/${id}/editar?error=ubicacion`);
    }

    throw error;
  }

  if (
    usuarioIdsNotificar.length > 0
  ) {
    await notificarTrabajoActualizado({
      usuarioIds:
        usuarioIdsNotificar,
      trabajoId: id,
      tipoTrabajo:
        tipo,
      fecha,
      horaInicio:
        horaInicio || null,
    });
  }

  revalidarPaginas();

  redirect(
    `/trabajos?exito=actualizado`,
  );
}