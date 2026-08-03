"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { empleados, vacaciones } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";
import { esVacacionGeneradaPorPermiso } from "@/lib/vacaciones";

function calcularCantidadDias(
  fechaInicio: string,
  fechaFin: string,
) {
  const inicio = new Date(`${fechaInicio}T00:00:00Z`);
  const fin = new Date(`${fechaFin}T00:00:00Z`);

  const diferencia = fin.getTime() - inicio.getTime();

  return Math.floor(diferencia / 86_400_000) + 1;
}

export async function crearVacacion(formData: FormData) {
  await requerirAdmin();

  const empleadoId = Number(formData.get("empleadoId"));
  const fechaInicio = String(formData.get("fechaInicio") ?? "");
  const fechaFin = String(formData.get("fechaFin") ?? "");
  const observacion =
    String(formData.get("observacion") ?? "").trim() || null;

  if (
    !Number.isInteger(empleadoId) ||
    empleadoId <= 0 ||
    !fechaInicio ||
    !fechaFin
  ) {
    redirect(
      "/administracion/rh/vacaciones/nueva?error=datos",
    );
  }

  const cantidadDias = calcularCantidadDias(
    fechaInicio,
    fechaFin,
  );

  if (cantidadDias <= 0) {
    redirect(
      "/administracion/rh/vacaciones/nueva?error=fechas",
    );
  }

  const empleado = await db
    .select({ id: empleados.id })
    .from(empleados)
    .where(
      and(
        eq(empleados.id, empleadoId),
        eq(empleados.activo, true),
      ),
    )
    .limit(1);

  if (!empleado[0]) {
    redirect(
      "/administracion/rh/vacaciones/nueva?error=empleado",
    );
  }

  await db.insert(vacaciones).values({
    empleadoId,
    fechaInicio,
    fechaFin,
    cantidadDias,
    estado: "PENDIENTE",
    observacion,
  });

  revalidatePath("/administracion/rh/vacaciones");

  redirect("/administracion/rh/vacaciones?creada=true");
}

export async function aprobarVacacion(vacacionId: number) {
  const sesion = await requerirAdmin();

  if (!Number.isInteger(vacacionId) || vacacionId <= 0) {
    redirect("/administracion/rh/vacaciones");
  }

  const resultado = await db
    .update(vacaciones)
    .set({
      estado: "APROBADA",
      autorizadoPor: sesion.usuarioId,
      actualizadoEn: new Date().toISOString(),
    })
    .where(
      and(
        eq(vacaciones.id, vacacionId),
        eq(vacaciones.estado, "PENDIENTE"),
      ),
    )
    .returning({
      id: vacaciones.id,
    });

  if (!resultado[0]) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=estado`,
    );
  }

  revalidatePath("/administracion/rh/vacaciones");
  revalidatePath(
    `/administracion/rh/vacaciones/${vacacionId}`,
  );

  redirect(
    `/administracion/rh/vacaciones/${vacacionId}?aprobada=true`,
  );
}

export async function rechazarVacacion(vacacionId: number) {
  const sesion = await requerirAdmin();

  if (!Number.isInteger(vacacionId) || vacacionId <= 0) {
    redirect("/administracion/rh/vacaciones");
  }

  const resultado = await db
    .update(vacaciones)
    .set({
      estado: "RECHAZADA",
      autorizadoPor: sesion.usuarioId,
      actualizadoEn: new Date().toISOString(),
    })
    .where(
      and(
        eq(vacaciones.id, vacacionId),
        eq(vacaciones.estado, "PENDIENTE"),
      ),
    )
    .returning({
      id: vacaciones.id,
    });

  if (!resultado[0]) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=estado`,
    );
  }

  revalidatePath("/administracion/rh/vacaciones");
  revalidatePath(
    `/administracion/rh/vacaciones/${vacacionId}`,
  );

  redirect(
    `/administracion/rh/vacaciones/${vacacionId}?rechazada=true`,
  );
}

export async function actualizarVacacion(
  vacacionId: number,
  formData: FormData,
) {
  await requerirAdmin();

  const empleadoId = Number(formData.get("empleadoId"));
  const fechaInicio = String(
    formData.get("fechaInicio") ?? "",
  ).trim();
  const fechaFin = String(
    formData.get("fechaFin") ?? "",
  ).trim();
  const observacion = String(
    formData.get("observacion") ?? "",
  ).trim();

  if (!Number.isInteger(vacacionId) || vacacionId <= 0) {
    redirect("/administracion/rh/vacaciones");
  }

  const vacacionesEncontradas = await db
    .select({
      id: vacaciones.id,
      observacion: vacaciones.observacion,
    })
    .from(vacaciones)
    .where(eq(vacaciones.id, vacacionId))
    .limit(1);

  const vacacionActual = vacacionesEncontradas[0];

  if (!vacacionActual) {
    redirect("/administracion/rh/vacaciones");
  }

  if (
    esVacacionGeneradaPorPermiso(
      vacacionActual.observacion,
    )
  ) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=automatico`,
    );
  }

  if (
    !Number.isInteger(empleadoId) ||
    empleadoId <= 0 ||
    !fechaInicio ||
    !fechaFin
  ) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}/editar?error=campos`,
    );
  }

  const inicio = new Date(`${fechaInicio}T00:00:00`);
  const fin = new Date(`${fechaFin}T00:00:00`);

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fin.getTime())
  ) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}/editar?error=fechas`,
    );
  }

  if (fin < inicio) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}/editar?error=rango`,
    );
  }

  const diferencia = fin.getTime() - inicio.getTime();

  const cantidadDias =
    Math.floor(diferencia / 86_400_000) + 1;

  const resultado = await db
    .update(vacaciones)
    .set({
      empleadoId,
      fechaInicio,
      fechaFin,
      cantidadDias,
      observacion: observacion || null,
      actualizadoEn: new Date().toISOString(),
    })
    .where(eq(vacaciones.id, vacacionId))
    .returning({
      id: vacaciones.id,
    });

  if (!resultado[0]) {
    redirect("/administracion/rh/vacaciones");
  }

  revalidatePath("/administracion/rh/vacaciones");
  revalidatePath(
    `/administracion/rh/vacaciones/${vacacionId}`,
  );

  redirect(
    `/administracion/rh/vacaciones/${vacacionId}?actualizada=true`,
  );
}

export async function eliminarVacacion(vacacionId: number) {
  await requerirAdmin();

  if (!Number.isInteger(vacacionId) || vacacionId <= 0) {
    redirect("/administracion/rh/vacaciones");
  }

  const resultado = await db
    .delete(vacaciones)
    .where(
      and(
        eq(vacaciones.id, vacacionId),
        eq(vacaciones.estado, "PENDIENTE"),
      ),
    )
    .returning({
      id: vacaciones.id,
    });

  if (!resultado[0]) {
    redirect(
      `/administracion/rh/vacaciones/${vacacionId}?error=eliminar`,
    );
  }

  revalidatePath("/administracion/rh/vacaciones");

  redirect(
    "/administracion/rh/vacaciones?eliminada=true",
  );
}