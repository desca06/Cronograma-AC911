import { jwtVerify } from "jose";
import {
  NextRequest,
  NextResponse,
} from "next/server";

const nombreCookie = "control_trabajos_session";

const rutasPublicas = [
  "/login",
  "/asistencia",
  "/manifest.webmanifest",
  "/sw.js",
];

function obtenerClaveSecreta(): Uint8Array {
  const clave = process.env.SESSION_SECRET;

  if (!clave) {
    throw new Error("No se encontró SESSION_SECRET.");
  }

  return new TextEncoder().encode(clave);
}

function esRutaPublica(ruta: string) {
  return rutasPublicas.some(
    (rutaPublica) =>
      ruta === rutaPublica ||
      ruta.startsWith(`${rutaPublica}/`),
  );
}

function coincideRuta(ruta: string, base: string) {
  return ruta === base || ruta.startsWith(`${base}/`);
}

function rutaPermitidaParaRol(ruta: string, rol: string) {
  if (rol === "ADMIN") {
    return true;
  }

  if (rol === "TECNICO") {
    return (
      coincideRuta(ruta, "/mis-trabajos") ||
      coincideRuta(ruta, "/historial") ||
      coincideRuta(ruta, "/notificaciones") ||
      // Sin esta ruta el botón "Ver o subir evidencias"
      // redirige de vuelta a /mis-trabajos en Vercel.
      coincideRuta(ruta, "/evidencias") ||
      coincideRuta(ruta, "/api/push") ||
      coincideRuta(ruta, "/api/notificaciones")
    );
  }

  if (rol === "SUPERVISOR") {
    return (
      coincideRuta(ruta, "/dashboard") ||
      coincideRuta(ruta, "/trabajos") ||
      coincideRuta(ruta, "/cronograma") ||
      coincideRuta(ruta, "/empleados") ||
      coincideRuta(ruta, "/clientes") ||
      coincideRuta(ruta, "/vehiculos") ||
      coincideRuta(ruta, "/usuarios") ||
      coincideRuta(ruta, "/configuracion") ||
      coincideRuta(ruta, "/mis-trabajos") ||
      coincideRuta(ruta, "/historial") ||
      coincideRuta(ruta, "/notificaciones") ||
      coincideRuta(ruta, "/trabajos-asignados") ||
      coincideRuta(ruta, "/evidencias") ||
      coincideRuta(ruta, "/api/push") ||
      coincideRuta(ruta, "/api/notificaciones")
    );
  }

  if (rol === "COTIZADORA") {
    return (
      coincideRuta(ruta, "/dashboard") ||
      ruta === "/cronograma" ||
      coincideRuta(ruta, "/administracion") &&
        (
          ruta === "/administracion" ||
          coincideRuta(ruta, "/administracion/compras") ||
          coincideRuta(ruta, "/administracion/reportes")
        )
    );
  }

  if (rol === "BODEGA") {
    return (
      coincideRuta(ruta, "/dashboard") ||
      coincideRuta(ruta, "/administracion") &&
        (
          ruta === "/administracion" ||
          coincideRuta(ruta, "/administracion/inventario")
        )
    );
  }

  return false;
}

function destinoPorRol(rol: string) {
  if (rol === "TECNICO") {
    return "/mis-trabajos";
  }

  return "/dashboard";
}

export async function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;
  const esLogin = ruta === "/login";

  if (esRutaPublica(ruta)) {
    if (!esLogin) {
      return NextResponse.next();
    }

    const tokenLogin = request.cookies.get(nombreCookie)?.value;

    if (!tokenLogin) {
      return NextResponse.next();
    }

    try {
      const resultado = await jwtVerify(
        tokenLogin,
        obtenerClaveSecreta(),
      );

      const rol = String(resultado.payload.rol ?? "");
      const siguienteLogin = request.nextUrl.searchParams.get("siguiente");

      if (
        siguienteLogin &&
        /^\/asistencia\/[a-f0-9]{32,128}$/i.test(siguienteLogin)
      ) {
        return NextResponse.redirect(
          new URL(siguienteLogin, request.url),
        );
      }

      return NextResponse.redirect(
        new URL(destinoPorRol(rol), request.url),
      );
    } catch {
      const respuesta = NextResponse.next();
      respuesta.cookies.delete(nombreCookie);
      return respuesta;
    }
  }

  const token = request.cookies.get(nombreCookie)?.value;

  if (!token) {
    if (ruta.startsWith("/api/")) {
      return NextResponse.json(
        {
          ok: false,
          error: "No hay una sesión activa.",
        },
        { status: 401 },
      );
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

    const rol = String(resultado.payload.rol ?? "");

    if (!rutaPermitidaParaRol(ruta, rol)) {
      return NextResponse.redirect(
        new URL(destinoPorRol(rol), request.url),
      );
    }

    return NextResponse.next();
  } catch {
    if (ruta.startsWith("/api/")) {
      const respuesta = NextResponse.json(
        {
          ok: false,
          error: "La sesión no es válida o expiró.",
        },
        { status: 401 },
      );

      respuesta.cookies.delete(nombreCookie);
      return respuesta;
    }

    const respuesta = NextResponse.redirect(
      new URL("/login", request.url),
    );

    respuesta.cookies.delete(nombreCookie);
    return respuesta;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};