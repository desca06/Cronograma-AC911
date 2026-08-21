"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  notificaciones,
  trabajos,
  trabajoEmpleados,
  trabajoObservacionesTecnico,
  usuarios,
} from "@/db/schema";
import { requerirSesion } from "@/lib/auth";
import {
  leerKm,
  registrarKilometrajeTrabajo,
} from "@/lib/kilometraje";

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
  revalidatePath("/historial");
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

  /*
   * Este campo representa UNA NUEVA observación.
   * Ya no contiene todo el historial ni reemplaza
   * la observación anterior.
   */
  const nuevaObservacion =
    obtenerTexto(
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
      agregarParametro(
        rutaRetorno,
        "error",
        "cuenta",
      ),
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
      agregarParametro(
        rutaRetorno,
        "error",
        "permiso",
      ),
    );
  }

  const [trabajoActual] = await db
    .select({
      id: trabajos.id,
      tipo: trabajos.tipo,
      fecha: trabajos.fecha,
      estado: trabajos.estado,
      vehiculoId: trabajos.vehiculoId,
      kmSalida: trabajos.kmSalida,
      kmLlegada: trabajos.kmLlegada,
      firmaClienteUrl: trabajos.firmaClienteUrl,
      firmaClienteNombre: trabajos.firmaClienteNombre,
    })
    .from(trabajos)
    .where(
      eq(
        trabajos.id,
        trabajoId,
      ),
    )
    .limit(1);

  if (!trabajoActual) {
    redirect(
      agregarParametro(
        rutaRetorno,
        "error",
        "no-encontrado",
      ),
    );
  }

  const firmaCliente = obtenerTexto(
    formData,
    "firmaCliente",
  );

  const firmaClienteNombre = obtenerTexto(
    formData,
    "firmaClienteNombre",
  );

  const firmaNueva =
    firmaCliente.startsWith("data:image/");

  if (estado === "Finalizado") {
    const yaTeníaFirma = Boolean(
      trabajoActual.firmaClienteUrl,
    );

    if (!yaTeníaFirma && !firmaNueva) {
      redirect(
        agregarParametro(
          rutaRetorno,
          "error",
          "firma",
        ),
      );
    }

    if (!yaTeníaFirma && !firmaClienteNombre) {
      redirect(
        agregarParametro(
          rutaRetorno,
          "error",
          "firma-nombre",
        ),
      );
    }
  }

  let kmSalida: number | null = trabajoActual.kmSalida;
  let kmLlegada: number | null = trabajoActual.kmLlegada;

  if (estado === "Finalizado" && trabajoActual.vehiculoId) {
    try {
      kmSalida = leerKm(formData.get("kmSalida"));
      kmLlegada = leerKm(formData.get("kmLlegada"));
    } catch {
      redirect(
        agregarParametro(rutaRetorno, "error", "km"),
      );
    }

    if (kmSalida === null || kmLlegada === null) {
      redirect(
        agregarParametro(rutaRetorno, "error", "km"),
      );
    }
  }

  const cambioEstado =
    trabajoActual.estado !== estado;

  /*
   * Cualquier texto no vacío es una nueva entrada
   * histórica, aunque sea parecido a una anterior.
   */
  const agregoObservacion =
    nuevaObservacion.length > 0;

  if (
    !cambioEstado &&
    !agregoObservacion
  ) {
    redirect(
      agregarParametro(
        rutaRetorno,
        "exito",
        "sin-cambios",
      ),
    );
  }

  const ahora = new Date();

  try {
  await db.transaction(async (tx) => {
    /*
     * Conservamos observacionesTecnico como "última
     * observación" por compatibilidad con pantallas
     * antiguas. El historial real vive en
     * trabajo_observaciones_tecnico.
     */
    await tx
      .update(trabajos)
      .set({
        estado,
        ...(agregoObservacion
          ? {
              observacionesTecnico:
                nuevaObservacion,
            }
          : {}),
        ...(estado === "Finalizado" && firmaNueva
          ? {
              firmaClienteUrl: firmaCliente,
              firmaClienteNombre:
                firmaClienteNombre ||
                trabajoActual.firmaClienteNombre,
              firmaClienteEn: ahora.toISOString(),
            }
          : {}),
        ...(estado === "Finalizado" &&
        trabajoActual.vehiculoId &&
        kmSalida !== null &&
        kmLlegada !== null
          ? {
              kmSalida,
              kmLlegada,
            }
          : {}),
      })
      .where(
        eq(
          trabajos.id,
          trabajoId,
        ),
      );

    if (
      estado === "Finalizado" &&
      trabajoActual.vehiculoId &&
      !trabajoActual.kmLlegada &&
      kmSalida !== null &&
      kmLlegada !== null
    ) {
      await registrarKilometrajeTrabajo(tx, {
        vehiculoId: trabajoActual.vehiculoId,
        trabajoId,
        usuarioId: sesion.usuarioId,
        kmSalida,
        kmLlegada,
      });
    }

    if (agregoObservacion) {
      await tx
        .insert(
          trabajoObservacionesTecnico,
        )
        .values({
          trabajoId,
          usuarioId:
            sesion.usuarioId,
          observacion:
            nuevaObservacion,
          estadoTrabajo:
            estado,
          creadoEn:
            ahora,
        });
    }

    const supervisores = await tx
      .select({
        usuarioId: usuarios.id,
      })
      .from(usuarios)
      .where(
        eq(
          usuarios.rol,
          "SUPERVISOR",
        ),
      );

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
      agregoObservacion
    ) {
      mensaje +=
        " El técnico también agregó una nueva observación.";
    } else if (
      !cambioEstado &&
      agregoObservacion
    ) {
      titulo =
        "Nueva observación del técnico";

      mensaje =
        `El técnico agregó una nueva observación ` +
        `en el trabajo "${trabajoActual.tipo}" ` +
        `del ${trabajoActual.fecha}.`;

      tipoNotificacion =
        "ACTUALIZACION";
    }

    await tx
      .insert(notificaciones)
      .values(
        supervisores.map(
          (supervisor) => ({
            usuarioId:
              supervisor.usuarioId,
            trabajoId,
            titulo,
            mensaje,
            tipo:
              tipoNotificacion,
            leida: false,
          }),
        ),
      );
  });
  } catch (error) {
    if (error instanceof Error && error.message === "KM_SALIDA_BAJO") {
      redirect(
        agregarParametro(rutaRetorno, "error", "km-salida"),
      );
    }

    if (error instanceof Error && error.message === "KM_LLEGADA_BAJO") {
      redirect(
        agregarParametro(rutaRetorno, "error", "km-llegada"),
      );
    }

    if (error instanceof Error && error.message === "KM_INVALIDO") {
      redirect(
        agregarParametro(rutaRetorno, "error", "km"),
      );
    }

    throw error;
  }

  revalidarPaginas(trabajoId);
  revalidatePath("/vehiculos");

  if (trabajoActual.vehiculoId) {
    revalidatePath(
      `/vehiculos/${trabajoActual.vehiculoId}/kilometraje`,
    );
  }

  redirect(
    agregarParametro(
      rutaRetorno,
      "exito",
      "actualizado",
    ),
  );
}