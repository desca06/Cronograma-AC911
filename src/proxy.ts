import { jwtVerify } from "jose";
import {
  NextRequest,
  NextResponse,
} from "next/server";

const nombreCookie = "control_trabajos_session";

const rutasSupervisor = [
  "/dashboard",
  "/trabajos",
  "/cronograma",
  "/empleados",
  "/clientes",
  "/vehiculos",
  "/usuarios",
  "/configuracion",
];

function obtenerClaveSecreta(): Uint8Array {
  const clave = process.env.SESSION_SECRET;

  if (!clave) {
    throw new Error(
      "No se encontró SESSION_SECRET.",
    );
  }

  return new TextEncoder().encode(clave);
}

export async function proxy(
  request: NextRequest,
) {
  const ruta = request.nextUrl.pathname;

  const esLogin = ruta === "/login";

  const token =
    request.cookies.get(nombreCookie)?.value;

  if (!token) {
    if (esLogin) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  try {
    const resultado = await jwtVerify(
      token,
      obtenerClaveSecreta(),
    );

    const rol = String(
      resultado.payload.rol ?? "",
    );

    if (esLogin) {
      const destino =
        rol === "TECNICO"
          ? "/mis-trabajos"
          : "/dashboard";

      return NextResponse.redirect(
        new URL(destino, request.url),
      );
    }

    const intentaEntrarComoSupervisor =
      rutasSupervisor.some(
        (rutaSupervisor) =>
          ruta === rutaSupervisor ||
          ruta.startsWith(
            `${rutaSupervisor}/`,
          ),
      );

    if (
      rol === "TECNICO" &&
      intentaEntrarComoSupervisor
    ) {
      return NextResponse.redirect(
        new URL(
          "/mis-trabajos",
          request.url,
        ),
      );
    }

    if (
      rol === "SUPERVISOR" &&
      ruta.startsWith("/mis-trabajos")
    ) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url),
      );
    }

    return NextResponse.next();
  } catch {
    const respuesta =
      NextResponse.redirect(
        new URL("/login", request.url),
      );

    respuesta.cookies.delete(nombreCookie);

    return respuesta;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};