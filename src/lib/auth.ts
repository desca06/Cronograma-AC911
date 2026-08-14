import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "control_trabajos_session";
const duracionSesionSegundos = 60 * 60 * 8;

export type RolUsuario =
  | "ADMIN"
  | "SUPERVISOR"
  | "TECNICO"
  | "COTIZADORA"
  | "BODEGA";

function obtenerClaveSecreta(): Uint8Array {
  const clave = process.env.SESSION_SECRET;

  if (!clave) {
    throw new Error(
      "No se encontró SESSION_SECRET en el archivo .env.",
    );
  }

  return new TextEncoder().encode(clave);
}

export type DatosSesion = {
  usuarioId: number;
  nombre: string;
  correo: string;
  rol: string;
};

export async function crearSesion(
  datos: DatosSesion,
): Promise<void> {
  const expiraEn = new Date(
    Date.now() + duracionSesionSegundos * 1000,
  );

  const token = await new SignJWT({
    usuarioId: datos.usuarioId,
    nombre: datos.nombre,
    correo: datos.correo,
    rol: datos.rol,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(expiraEn.getTime() / 1000),
    )
    .sign(obtenerClaveSecreta());

  const almacenamientoCookies = await cookies();

  almacenamientoCookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEn,
  });
}

export async function obtenerSesion(): Promise<DatosSesion | null> {
  const almacenamientoCookies = await cookies();
  const token = almacenamientoCookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const resultado = await jwtVerify(
      token,
      obtenerClaveSecreta(),
    );

    const usuarioId = Number(resultado.payload.usuarioId);
    const nombre = String(resultado.payload.nombre ?? "");
    const correo = String(resultado.payload.correo ?? "");
    const rol = String(resultado.payload.rol ?? "");

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0 ||
      !nombre ||
      !correo ||
      !rol
    ) {
      return null;
    }

    return {
      usuarioId,
      nombre,
      correo,
      rol,
    };
  } catch {
    return null;
  }
}

export async function requerirSesion(): Promise<DatosSesion> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    redirect("/login");
  }

  return sesion;
}

export async function eliminarSesion(): Promise<void> {
  const almacenamientoCookies = await cookies();
  almacenamientoCookies.delete(COOKIE_NAME);
}

function tieneRol(
  rol: string,
  rolesPermitidos: readonly string[],
) {
  return rolesPermitidos.includes(rol);
}

export async function requerirSupervisor(): Promise<DatosSesion> {
  const sesion = await requerirSesion();

  if (!tieneRol(sesion.rol, ["SUPERVISOR", "ADMIN"])) {
    redirect("/dashboard");
  }

  return sesion;
}

export async function requerirAdmin(): Promise<DatosSesion> {
  const sesion = await requerirSesion();

  if (sesion.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  return sesion;
}

export async function requerirAdministracion(): Promise<DatosSesion> {
  const sesion = await requerirSesion();

  if (
    !tieneRol(sesion.rol, [
      "ADMIN",
      "COTIZADORA",
      "BODEGA",
    ])
  ) {
    redirect("/dashboard");
  }

  return sesion;
}

export async function requerirCompras(): Promise<DatosSesion> {
  const sesion = await requerirSesion();

  if (!tieneRol(sesion.rol, ["ADMIN", "COTIZADORA"])) {
    redirect("/dashboard");
  }

  return sesion;
}

export async function requerirInventario(): Promise<DatosSesion> {
  const sesion = await requerirSesion();

  if (!tieneRol(sesion.rol, ["ADMIN", "BODEGA"])) {
    redirect("/dashboard");
  }

  return sesion;
}

export async function requerirReportes(): Promise<DatosSesion> {
  const sesion = await requerirSesion();

  if (!tieneRol(sesion.rol, ["ADMIN", "COTIZADORA"])) {
    redirect("/dashboard");
  }

  return sesion;
}

export async function requerirCronograma(): Promise<DatosSesion> {
  const sesion = await requerirSesion();

  if (
    !tieneRol(sesion.rol, [
      "ADMIN",
      "SUPERVISOR",
      "COTIZADORA",
    ])
  ) {
    redirect("/dashboard");
  }

  return sesion;
}