import {
  eq,
} from "drizzle-orm";

import { db } from "@/db";
import {
  suscripcionesPush,
} from "@/db/schema";
import {
  obtenerSesion,
} from "@/lib/auth";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type SuscripcionEntrada = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
  navegador?: unknown;
};

export async function GET() {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return Response.json(
        {
          ok: false,
          registrado: false,
          error:
            "No hay una sesión activa.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const registros =
      await db
        .select({
          id:
            suscripcionesPush.id,
          endpoint:
            suscripcionesPush.endpoint,
        })
        .from(
          suscripcionesPush,
        )
        .where(
          eq(
            suscripcionesPush.usuarioId,
            sesion.usuarioId,
          ),
        );

    return Response.json(
      {
        ok: true,
        registrado:
          registros.length > 0,
        cantidad:
          registros.length,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[AC911 PUSH GET]",
      error,
    );

    return Response.json(
      {
        ok: false,
        registrado: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo verificar el dispositivo.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const sesion =
      await obtenerSesion();

    if (!sesion) {
      return Response.json(
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

    const body =
      await request.json() as SuscripcionEntrada;

    const endpoint =
      typeof body.endpoint ===
      "string"
        ? body.endpoint.trim()
        : "";

    const p256dh =
      typeof body.keys
        ?.p256dh === "string"
        ? body.keys.p256dh.trim()
        : "";

    const auth =
      typeof body.keys
        ?.auth === "string"
        ? body.keys.auth.trim()
        : "";

    const navegador =
      typeof body.navegador ===
      "string"
        ? body.navegador
            .trim()
            .slice(
              0,
              500,
            )
        : null;

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Suscripción push inválida: faltan endpoint, p256dh o auth.",
        },
        {
          status: 400,
        },
      );
    }

    const [existente] =
      await db
        .select({
          id:
            suscripcionesPush.id,
        })
        .from(
          suscripcionesPush,
        )
        .where(
          eq(
            suscripcionesPush.endpoint,
            endpoint,
          ),
        )
        .limit(1);

    if (existente) {
      await db
        .update(
          suscripcionesPush,
        )
        .set({
          usuarioId:
            sesion.usuarioId,
          p256dh,
          auth,
          navegador,
          actualizadoEn:
            new Date().toISOString(),
        })
        .where(
          eq(
            suscripcionesPush.id,
            existente.id,
          ),
        );
    } else {
      await db
        .insert(
          suscripcionesPush,
        )
        .values({
          usuarioId:
            sesion.usuarioId,
          endpoint,
          p256dh,
          auth,
          navegador,
        });
    }

    const [guardada] =
      await db
        .select({
          id:
            suscripcionesPush.id,
          usuarioId:
            suscripcionesPush.usuarioId,
        })
        .from(
          suscripcionesPush,
        )
        .where(
          eq(
            suscripcionesPush.endpoint,
            endpoint,
          ),
        )
        .limit(1);

    if (
      !guardada ||
      guardada.usuarioId !==
        sesion.usuarioId
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "La suscripción no pudo verificarse después de guardarla.",
        },
        {
          status: 500,
        },
      );
    }

    return Response.json(
      {
        ok: true,
        registrado: true,
        suscripcionId:
          guardada.id,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "[AC911 PUSH POST]",
      error,
    );

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la suscripción push.",
      },
      {
        status: 500,
      },
    );
  }
}