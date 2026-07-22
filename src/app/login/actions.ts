"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { usuarios } from "@/db/schema";
import {
  crearSesion,
  eliminarSesion,
} from "@/lib/auth";

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  const valor = formData.get(campo);

  return typeof valor === "string"
    ? valor.trim()
    : "";
}

export async function iniciarSesion(
  formData: FormData,
): Promise<void> {
  const correo = obtenerTexto(
    formData,
    "correo",
  ).toLowerCase();

  const password = obtenerTexto(
    formData,
    "password",
  );

  if (!correo || !password) {
    redirect("/login?error=campos");
  }

  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.correo, correo))
    .limit(1);

  if (!usuario || !usuario.activo) {
    redirect("/login?error=credenciales");
  }

  const passwordCorrecto = await compare(
    password,
    usuario.passwordHash,
  );

  if (!passwordCorrecto) {
    redirect("/login?error=credenciales");
  }

  await crearSesion({
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  });

  if(usuario.rol === "TECNICO"){
    redirect("/mis-trabajos");
  }

  redirect("/dashboard");
}

export async function cerrarSesion(): Promise<void> {
  await eliminarSesion();
  redirect("/login");
}