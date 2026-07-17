"use server";

import { hash } from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { usuarios } from "@/db/schema";
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

/*
 * CREAR USUARIO
 */

export async function crearUsuario(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const nombre = obtenerTexto(
    formData,
    "nombre",
  );

  const correo = obtenerTexto(
    formData,
    "correo",
  ).toLowerCase();

  const password = obtenerTexto(
    formData,
    "password",
  );

  const rolRecibido = obtenerTexto(
    formData,
    "rol",
  );

  const empleadoIdSeleccionado = Number(
    formData.get("empleadoId"),
  );

  if (
    !nombre ||
    !correo ||
    password.length < 8
  ) {
    redirect("/usuarios?error=datos");
  }

  const rolFinal =
    rolRecibido === "SUPERVISOR"
      ? "SUPERVISOR"
      : "TECNICO";

  const empleadoId =
    rolFinal === "TECNICO" &&
    Number.isInteger(empleadoIdSeleccionado) &&
    empleadoIdSeleccionado > 0
      ? empleadoIdSeleccionado
      : null;

  if (
    rolFinal === "TECNICO" &&
    empleadoId === null
  ) {
    redirect("/usuarios?error=empleado");
  }

  const correoExistente = db
    .select({
      id: usuarios.id,
    })
    .from(usuarios)
    .where(
      eq(usuarios.correo, correo),
    )
    .get();

  if (correoExistente) {
    redirect("/usuarios?error=correo");
  }

  const passwordHash = await hash(
    password,
    12,
  );

  db.insert(usuarios)
    .values({
      nombre,
      correo,
      passwordHash,
      rol: rolFinal,
      empleadoId,
      activo: true,
    })
    .run();

  revalidatePath("/usuarios");

  redirect("/usuarios?exito=creado");
}

/*
 * ACTUALIZAR USUARIO
 */

export async function actualizarUsuario(
  formData: FormData,
): Promise<void> {
  const sesion = await requerirSupervisor();

  const id = Number(
    formData.get("id"),
  );

  const nombre = obtenerTexto(
    formData,
    "nombre",
  );

  const correo = obtenerTexto(
    formData,
    "correo",
  ).toLowerCase();

  const rolRecibido = obtenerTexto(
    formData,
    "rol",
  );

  const empleadoIdSeleccionado = Number(
    formData.get("empleadoId"),
  );

  const activoRecibido =
    formData.get("activo") === "on";

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !nombre ||
    !correo
  ) {
    redirect("/usuarios?error=datos");
  }

  const correoExistente = db
    .select({
      id: usuarios.id,
    })
    .from(usuarios)
    .where(
      and(
        eq(usuarios.correo, correo),
        ne(usuarios.id, id),
      ),
    )
    .get();

  if (correoExistente) {
    redirect("/usuarios?error=correo");
  }

  /*
   * El usuario que tiene la sesión abierta
   * no puede quitarse a sí mismo el rol de
   * supervisor ni desactivar su cuenta.
   */

  const esUsuarioActual =
    id === sesion.usuarioId;

  const rolFinal = esUsuarioActual
    ? "SUPERVISOR"
    : rolRecibido === "SUPERVISOR"
      ? "SUPERVISOR"
      : "TECNICO";

  const activoFinal = esUsuarioActual
    ? true
    : activoRecibido;

  const empleadoId =
    rolFinal === "TECNICO" &&
    Number.isInteger(empleadoIdSeleccionado) &&
    empleadoIdSeleccionado > 0
      ? empleadoIdSeleccionado
      : null;

  if (
    rolFinal === "TECNICO" &&
    empleadoId === null
  ) {
    redirect("/usuarios?error=empleado");
  }

  db.update(usuarios)
    .set({
      nombre,
      correo,
      rol: rolFinal,
      empleadoId,
      activo: activoFinal,
    })
    .where(
      eq(usuarios.id, id),
    )
    .run();

  revalidatePath("/usuarios");

  redirect("/usuarios?exito=actualizado");
}

/*
 * CAMBIAR CONTRASEÑA
 */

export async function cambiarPasswordUsuario(
  formData: FormData,
): Promise<void> {
  await requerirSupervisor();

  const id = Number(
    formData.get("id"),
  );

  const password = obtenerTexto(
    formData,
    "password",
  );

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    password.length < 8
  ) {
    redirect("/usuarios?error=password");
  }

  const usuarioExistente = db
    .select({
      id: usuarios.id,
    })
    .from(usuarios)
    .where(
      eq(usuarios.id, id),
    )
    .get();

  if (!usuarioExistente) {
    redirect("/usuarios?error=datos");
  }

  const passwordHash = await hash(
    password,
    12,
  );

  db.update(usuarios)
    .set({
      passwordHash,
    })
    .where(
      eq(usuarios.id, id),
    )
    .run();

  revalidatePath("/usuarios");

  redirect("/usuarios?exito=password");
}