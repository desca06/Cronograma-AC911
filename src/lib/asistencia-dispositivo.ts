import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

export const NOMBRE_COOKIE_DISPOSITIVO =
  "ac911_asistencia_dispositivo";

const duracionUnAnioMs =
  1000 * 60 * 60 * 24 * 365;

export function generarTokenDispositivo() {
  return randomBytes(32).toString("hex");
}

export function leerTokenDispositivo(
  request: Request,
) {
  const header = request.headers.get("cookie");

  if (!header) {
    return null;
  }

  const partes = header.split(";");

  for (const parte of partes) {
    const [nombre, ...resto] = parte.trim().split("=");

    if (nombre === NOMBRE_COOKIE_DISPOSITIVO) {
      const valor = resto.join("=").trim();
      return valor || null;
    }
  }

  return null;
}

export function pegarCookieDispositivo(
  respuesta: NextResponse,
  token: string,
) {
  const expira = new Date(
    Date.now() + duracionUnAnioMs,
  );

  respuesta.cookies.set(
    NOMBRE_COOKIE_DISPOSITIVO,
    token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expira,
    },
  );

  return respuesta;
}