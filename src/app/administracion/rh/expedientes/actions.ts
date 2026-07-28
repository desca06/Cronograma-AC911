"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  empleados,
  expedientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

const ESTADOS_VALIDOS = [
  "ACTIVO",
  "INACTIVO",
] as const;

function obtenerTexto(
  formData: FormData,
  campo: string,
) {
  return String(formData.get(campo) ?? "").trim();
}

function generarCodigo(expedienteId: number) {
  return `EXP-${String(expedienteId).padStart(
    5,
    "0",
  )}`;
}

export async function crearExpediente(
  formData: FormData,
) {
  await requerirAdmin();

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const dpi = obtenerTexto(formData, "dpi");
  const nit = obtenerTexto(formData, "nit");
  const igss = obtenerTexto(formData, "igss");

  const fechaIngreso = obtenerTexto(
    formData,
    "fechaIngreso",
  );

  const contactoEmergencia = obtenerTexto(
    formData,
    "contactoEmergencia",
  );

  const telefonoEmergencia = obtenerTexto(
    formData,
    "telefonoEmergencia",
  );

  const direccion = obtenerTexto(
    formData,
    "direccion",
  );

  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  if (
    !Number.isInteger(empleadoId) ||
    empleadoId <= 0 ||
    !dpi ||
    !fechaIngreso ||
    !contactoEmergencia ||
    !telefonoEmergencia ||
    !direccion
  ) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=campos",
    );
  }

  const empleadoEncontrado = await db
    .select({
      id: empleados.id,
    })
    .from(empleados)
    .where(eq(empleados.id, empleadoId))
    .limit(1);

  if (!empleadoEncontrado[0]) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=empleado",
    );
  }

  const expedienteExistente = await db
    .select({
      id: expedientes.id,
    })
    .from(expedientes)
    .where(eq(expedientes.empleadoId, empleadoId))
    .limit(1);

  if (expedienteExistente[0]) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=duplicado",
    );
  }

  const dpiExistente = await db
    .select({
      id: expedientes.id,
    })
    .from(expedientes)
    .where(eq(expedientes.dpi, dpi))
    .limit(1);

  if (dpiExistente[0]) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=dpi",
    );
  }

  const resultado = await db
    .insert(expedientes)
    .values({
      empleadoId,
      codigo: null,
      dpi,
      nit: nit || null,
      igss: igss || null,
      fechaIngreso,
      contactoEmergencia,
      telefonoEmergencia,
      direccion,
      observaciones: observaciones || null,
      estado: "ACTIVO",
    })
    .returning({
      id: expedientes.id,
    });

  const expedienteCreado = resultado[0];

  if (!expedienteCreado) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=crear",
    );
  }

  const codigo = generarCodigo(
    expedienteCreado.id,
  );

  await db
    .update(expedientes)
    .set({
      codigo,
      actualizadoEn: new Date().toISOString(),
    })
    .where(eq(expedientes.id, expedienteCreado.id));

  revalidatePath(
    "/administracion/rh/expedientes",
  );

  redirect(
    `/administracion/rh/expedientes/${expedienteCreado.id}?success=creado`,
  );
}

export async function actualizarExpediente(
  expedienteId: number,
  formData: FormData,
) {
  await requerirAdmin();

  if (
    !Number.isInteger(expedienteId) ||
    expedienteId <= 0
  ) {
    redirect(
      "/administracion/rh/expedientes?error=expediente",
    );
  }

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const dpi = obtenerTexto(formData, "dpi");
  const nit = obtenerTexto(formData, "nit");
  const igss = obtenerTexto(formData, "igss");

  const fechaIngreso = obtenerTexto(
    formData,
    "fechaIngreso",
  );

  const contactoEmergencia = obtenerTexto(
    formData,
    "contactoEmergencia",
  );

  const telefonoEmergencia = obtenerTexto(
    formData,
    "telefonoEmergencia",
  );

  const direccion = obtenerTexto(
    formData,
    "direccion",
  );

  const observaciones = obtenerTexto(
    formData,
    "observaciones",
  );

  const estado = obtenerTexto(
    formData,
    "estado",
  );

  if (
    !Number.isInteger(empleadoId) ||
    empleadoId <= 0 ||
    !dpi ||
    !fechaIngreso ||
    !contactoEmergencia ||
    !telefonoEmergencia ||
    !direccion
  ) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=campos`,
    );
  }

  if (
    !ESTADOS_VALIDOS.includes(
      estado as (typeof ESTADOS_VALIDOS)[number],
    )
  ) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=estado`,
    );
  }

  const expedienteEncontrado = await db
    .select({
      id: expedientes.id,
    })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId))
    .limit(1);

  if (!expedienteEncontrado[0]) {
    redirect(
      "/administracion/rh/expedientes?error=no-encontrado",
    );
  }

  const empleadoEncontrado = await db
    .select({
      id: empleados.id,
    })
    .from(empleados)
    .where(eq(empleados.id, empleadoId))
    .limit(1);

  if (!empleadoEncontrado[0]) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=empleado`,
    );
  }

  const empleadoDuplicado = await db
    .select({
      id: expedientes.id,
    })
    .from(expedientes)
    .where(
      and(
        eq(expedientes.empleadoId, empleadoId),
        ne(expedientes.id, expedienteId),
      ),
    )
    .limit(1);

  if (empleadoDuplicado[0]) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=duplicado`,
    );
  }

  const dpiDuplicado = await db
    .select({
      id: expedientes.id,
    })
    .from(expedientes)
    .where(
      and(
        eq(expedientes.dpi, dpi),
        ne(expedientes.id, expedienteId),
      ),
    )
    .limit(1);

  if (dpiDuplicado[0]) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=dpi`,
    );
  }

  await db
    .update(expedientes)
    .set({
      empleadoId,
      dpi,
      nit: nit || null,
      igss: igss || null,
      fechaIngreso,
      contactoEmergencia,
      telefonoEmergencia,
      direccion,
      observaciones: observaciones || null,
      estado,
      actualizadoEn: new Date().toISOString(),
    })
    .where(eq(expedientes.id, expedienteId));

  revalidatePath(
    "/administracion/rh/expedientes",
  );

  revalidatePath(
    `/administracion/rh/expedientes/${expedienteId}`,
  );

  redirect(
    `/administracion/rh/expedientes/${expedienteId}?success=actualizado`,
  );
}

export async function eliminarExpediente(
  expedienteId: number,
) {
  await requerirAdmin();

  if (
    !Number.isInteger(expedienteId) ||
    expedienteId <= 0
  ) {
    redirect(
      "/administracion/rh/expedientes?error=expediente",
    );
  }

  const expedienteEncontrado = await db
    .select({
      id: expedientes.id,
    })
    .from(expedientes)
    .where(eq(expedientes.id, expedienteId))
    .limit(1);

  if (!expedienteEncontrado[0]) {
    redirect(
      "/administracion/rh/expedientes?error=no-encontrado",
    );
  }

  await db
    .delete(expedientes)
    .where(eq(expedientes.id, expedienteId));

  revalidatePath(
    "/administracion/rh/expedientes",
  );

  redirect(
    "/administracion/rh/expedientes?success=eliminado",
  );
}