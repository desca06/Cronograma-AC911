import { jwtVerify } from "jose";
import {
  NextRequest,
  NextResponse,
} from "next/server";

const nombreCookie =
  "control_trabajos_session";

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

const rutasPublicas = [
  "/login",
  "/asistencia",
  "/manifest.webmanifest",
  "/sw.js",
];

function obtenerClaveSecreta(): Uint8Array {
  const clave =
    process.env.SESSION_SECRET;

  if (!clave) {
    throw new Error(
      "No se encontró SESSION_SECRET.",
    );
  }

  return new TextEncoder().encode(
    clave,
  );
}

function esRutaPublica(
  ruta: string,
) {
  return rutasPublicas.some(
    (rutaPublica) =>
      ruta === rutaPublica ||
      ruta.startsWith(
        `${rutaPublica}/`,
      ),
  );
}

export async function proxy(
  request: NextRequest,
) {
  const ruta =
    request.nextUrl.pathname;

  const esLogin =
    ruta === "/login";


  if (esRutaPublica(ruta)) {
    if (!esLogin) {
      return NextResponse.next();
    }

    const tokenLogin =
      request.cookies.get(
        nombreCookie,
      )?.value;

    if (!tokenLogin) {
      return NextResponse.next();
    }

    try {
      const resultado =
        await jwtVerify(
          tokenLogin,
          obtenerClaveSecreta(),
        );

      const rol = String(
        resultado.payload.rol ??
          "",
      );

      const destino =
        rol === "TECNICO"
          ? "/mis-trabajos"
          : "/dashboard";

      return NextResponse.redirect(
        new URL(
          destino,
          request.url,
        ),
      );
    } catch {
      const respuesta =
        NextResponse.next();

      respuesta.cookies.delete(
        nombreCookie,
      );

      return respuesta;
    }
  }

  /*
   * Las API de Push NO son públicas.
   *
   * /api/push/suscribir
   * /api/notificaciones/push/prueba
   *
   * Deben mantener sesión porque necesitamos
   * conocer el usuarioId real que registra
   * el dispositivo o solicita la prueba.
   */
  const token =
    request.cookies.get(
      nombreCookie,
    )?.value;

  if (!token) {
    /*
     * Para páginas seguimos redirigiendo al login.
     *
     * Para APIs devolvemos 401 JSON para evitar
     * que fetch() reciba HTML del login.
     */
    if (
      ruta.startsWith("/api/")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No hay una sesión activa.",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url,
      ),
    );
  }

  try {
    const resultado =
      await jwtVerify(
        token,
        obtenerClaveSecreta(),
      );

    const rol = String(
      resultado.payload.rol ??
        "",
    );

    const intentaEntrarComoSupervisor =
      rutasSupervisor.some(
        (rutaSupervisor) =>
          ruta ===
            rutaSupervisor ||
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

    return NextResponse.next();
  } catch {
    if (
      ruta.startsWith("/api/")
    ) {
      const respuesta =
        NextResponse.json(
          {
            ok: false,
            error:
              "La sesión no es válida o expiró.",
          },
          {
            status: 401,
          },
        );

      respuesta.cookies.delete(
        nombreCookie,
      );

      return respuesta;
    }

    const respuesta =
      NextResponse.redirect(
        new URL(
          "/login",
          request.url,
        ),
      );

    respuesta.cookies.delete(
      nombreCookie,
    );

    return respuesta;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};