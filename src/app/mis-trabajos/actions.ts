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
  revalidatePath("/historial");
  revalidatePath("/dashboard");
  revalidatePath("/cronograma");
  revalidatePath("/trabajos");
  revalidatePath(`/trabajos/${trabajoId}`);
  revalidatePath("/notificaciones");
  revalidatePath("/evidencias");
}

function esDataUrlValido(dataUrl: string): boolean {
  if (!dataUrl) return false;
  // Debe ser data:image/png o jpeg base64 y no excesivamente pequeña (vacía)
  if (!dataUrl.startsWith("data:image/")) return false;
  // Longitud mínima para una firma real (aprox > 1000 chars base64)
  // Permitimos algo pequeño pero no trivial
  if (dataUrl.length < 500) return false;
  if (!dataUrl.includes("base64,")) return false;
  return true;
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

  const nuevaObservacion =
    obtenerTexto(
      formData,
      "observacionesTecnico",
    );

  // Campos de firma del cliente
  const firmaClienteNombre = obtenerTexto(
    formData,
    "firmaClienteNombre",
  );

  const firmaClienteRaw = obtenerTexto(
    formData,
    "firmaCliente",
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
      firmaCliente: trabajos.firmaCliente,
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

  const cambioEstado =
    trabajoActual.estado !== estado;

  const agregoObservacion =
    nuevaObservacion.length > 0;

  const firmaValida = esDataUrlValido(firmaClienteRaw);
  const agregoFirma = firmaValida && firmaClienteNombre.length > 0;

  // Validación extra: si intenta finalizar sin firma y sin firma previa, exigir firma
  // Pero permitimos finalizar sin firma para no bloquear, solo si ya tiene firma previa o envía nueva
  if (estado === "Finalizado") {
    // Si no hay firma previa ni nueva, y está intentando finalizar, exigimos datos de firma
    // A menos que el trabajo ya estuviera finalizado (permitir agregar observación sin re-firmar)
    const yaFinalizado = trabajoActual.estado === "Finalizado";
    const tieneFirmaPrevia = Boolean(trabajoActual.firmaCliente);

    if (!yaFinalizado && !tieneFirmaPrevia && !agregoFirma) {
      // Si marca como finalizado por primera vez sin firma, redirigir con error específico
      redirect(
        agregarParametro(
          rutaRetorno,
          "error",
          "firma-requerida",
        ),
      );
    }

    // Si envía firma, nombre debe existir
    if (firmaClienteRaw && !firmaValida) {
      redirect(
        agregarParametro(
          rutaRetorno,
          "error",
          "firma-invalida",
        ),
      );
    }

    if (firmaValida && firmaClienteNombre.length < 3) {
      redirect(
        agregarParametro(
          rutaRetorno,
          "error",
          "firma-nombre",
        ),
      );
    }
  } else {
    // Si no es Finalizado, ignoramos campos de firma aunque vengan (no se deben guardar)
  }

  if (
    !cambioEstado &&
    !agregoObservacion &&
    !agregoFirma
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

  await db.transaction(async (tx) => {
    const datosActualizar: any = {
      estado,
    };

    if (agregoObservacion) {
      datosActualizar.observacionesTecnico = nuevaObservacion;
    }

    if (agregoFirma && estado === "Finalizado") {
      datosActualizar.firmaCliente = firmaClienteRaw;
      datosActualizar.firmaClienteNombre = firmaClienteNombre;
      datosActualizar.firmaClienteFecha = ahora;
    }

    await tx
      .update(trabajos)
      .set(datosActualizar)
      .where(
        eq(
          trabajos.id,
          trabajoId,
        ),
      );

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

    if (supervisores.length > 0) {
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
            ? "Trabajo finalizado con firma"
            : "Estado actualizado por técnico";

        mensaje =
          `El trabajo "${trabajoActual.tipo}" ` +
          `del ${trabajoActual.fecha} cambió ` +
          `de ${trabajoActual.estado} a ${estado}.`;

        if (agregoFirma) {
          mensaje += ` Cliente: ${firmaClienteNombre} firmó conformidad.`;
        }

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

      if (agregoFirma && !cambioEstado) {
        titulo = "Firma de cliente agregada";
        mensaje = `El cliente ${firmaClienteNombre} firmó conformidad del trabajo "${trabajoActual.tipo}" del ${trabajoActual.fecha}.`;
        tipoNotificacion = "ESTADO";
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
    }
  });

  revalidarPaginas(trabajoId);

  if (estado === "Finalizado" && agregoFirma) {
    redirect(
      agregarParametro(
        rutaRetorno,
        "exito",
        "finalizado-firma",
      ),
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

// Acción adicional para guardar solo firma (usada desde historial o admin si se necesita)
export async function guardarFirmaCliente(
  formData: FormData,
): Promise<void> {
  const sesion = await requerirSesion();

  const trabajoId = Number(formData.get("trabajoId"));
  if (!Number.isInteger(trabajoId) || trabajoId <= 0) {
    redirect("/mis-trabajos?error=datos");
  }

  const firmaClienteNombre = obtenerTexto(formData, "firmaClienteNombre");
  const firmaClienteRaw = obtenerTexto(formData, "firmaCliente");
  const rutaRetorno = obtenerRutaRetorno(formData, trabajoId);

  if (!esDataUrlValido(firmaClienteRaw) || firmaClienteNombre.length < 3) {
    redirect(agregarParametro(rutaRetorno, "error", "firma-invalida"));
  }

  // Verificar permiso: técnico asignado o supervisor
  if (sesion.rol === "TECNICO") {
    const [usuario] = await db
      .select({ empleadoId: usuarios.empleadoId })
      .from(usuarios)
      .where(eq(usuarios.id, sesion.usuarioId))
      .limit(1);

    if (!usuario?.empleadoId) {
      redirect(agregarParametro(rutaRetorno, "error", "cuenta"));
    }

    const [asignacion] = await db
      .select({ trabajoId: trabajoEmpleados.trabajoId })
      .from(trabajoEmpleados)
      .where(
        and(
          eq(trabajoEmpleados.trabajoId, trabajoId),
          eq(trabajoEmpleados.empleadoId, usuario.empleadoId),
        ),
      )
      .limit(1);

    if (!asignacion) {
      redirect(agregarParametro(rutaRetorno, "error", "permiso"));
    }
  }

  const ahora = new Date();

  await db
    .update(trabajos)
    .set({
      firmaCliente: firmaClienteRaw,
      firmaClienteNombre: firmaClienteNombre,
      firmaClienteFecha: ahora,
      // Si no estaba finalizado, lo finalizamos automáticamente al firmar
      estado: "Finalizado",
    })
    .where(eq(trabajos.id, trabajoId));

  revalidarPaginas(trabajoId);

  redirect(agregarParametro(rutaRetorno, "exito", "firma-guardada"));
}
