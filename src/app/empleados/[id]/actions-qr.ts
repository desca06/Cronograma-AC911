"use server";

import { randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { empleadoQr, empleados } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

const RUTA_EMPLEADOS = "/empleados";

function generarTokenSeguro() {
  return randomBytes(32).toString("hex");
}

async function validarEmpleado(empleadoId: number) {
  if (!Number.isInteger(empleadoId) || empleadoId <= 0) {
    redirect(`${RUTA_EMPLEADOS}?error=empleado`);
  }

  const [empleado] = await db
    .select({ id: empleados.id })
    .from(empleados)
    .where(eq(empleados.id, empleadoId))
    .limit(1);

  if (!empleado) {
    redirect(`${RUTA_EMPLEADOS}?error=empleado`);
  }
}

export async function generarQrEmpleado(
  empleadoId: number,
) {
  await requerirAdmin();
  await validarEmpleado(empleadoId);

  const [qrExistente] = await db
    .select({ id: empleadoQr.id })
    .from(empleadoQr)
    .where(eq(empleadoQr.empleadoId, empleadoId))
    .limit(1);

  if (qrExistente) {
    redirect(
      `${RUTA_EMPLEADOS}/${empleadoId}?qr=existente`,
    );
  }

  await db.insert(empleadoQr).values({
    empleadoId,
    token: generarTokenSeguro(),
    actualizadoEn: new Date(),
  });

  revalidatePath(`${RUTA_EMPLEADOS}/${empleadoId}`);

  redirect(
    `${RUTA_EMPLEADOS}/${empleadoId}?qr=generado`,
  );
}

export async function regenerarQrEmpleado(
  empleadoId: number,
) {
  await requerirAdmin();
  await validarEmpleado(empleadoId);

  const [qrExistente] = await db
    .select({ id: empleadoQr.id })
    .from(empleadoQr)
    .where(eq(empleadoQr.empleadoId, empleadoId))
    .limit(1);

  const token = generarTokenSeguro();

  if (qrExistente) {
    await db
      .update(empleadoQr)
      .set({
        token,
        actualizadoEn: new Date(),
      })
      .where(eq(empleadoQr.empleadoId, empleadoId));
  } else {
    await db.insert(empleadoQr).values({
      empleadoId,
      token,
      actualizadoEn: new Date(),
    });
  }

  revalidatePath(`${RUTA_EMPLEADOS}/${empleadoId}`);

  redirect(
    `${RUTA_EMPLEADOS}/${empleadoId}?qr=regenerado`,
  );
}

export async function eliminarQrEmpleado(
  empleadoId: number,
) {
  await requerirAdmin();
  await validarEmpleado(empleadoId);

  await db
    .delete(empleadoQr)
    .where(eq(empleadoQr.empleadoId, empleadoId));

  revalidatePath(`${RUTA_EMPLEADOS}/${empleadoId}`);

  redirect(
    `${RUTA_EMPLEADOS}/${empleadoId}?qr=eliminado`,
  );
}