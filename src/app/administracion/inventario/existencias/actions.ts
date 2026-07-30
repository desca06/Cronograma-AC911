"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  articulosInventario,
  existenciasInventario,
  movimientosInventario,
  type TipoMovimientoInventario,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

type DatosMovimiento = {
  articuloId: number;
  cantidad: number;
  motivo: string;
  observaciones: string | null;
  documentoReferencia: string | null;
};

type ResultadoMovimiento =
  | {
      ok: true;
    }
  | {
      ok: false;
      error:
        | "articulo"
        | "cantidad"
        | "motivo"
        | "inexistente"
        | "inactivo"
        | "sin-control"
        | "sin-existencia"
        | "stock-insuficiente";
    };

const RUTA_EXISTENCIAS =
  "/administracion/inventario/existencias";

/**
 * Busca el ID del usuario autenticado.
 *
 * Admite estas formas:
 * { id }
 * { usuarioId }
 * { usuario: { id } }
 * { user: { id } }
 */
function obtenerUsuarioId(valor: unknown): number {
  if (!valor || typeof valor !== "object") {
    throw new Error(
      "No fue posible obtener el usuario autenticado.",
    );
  }

  const sesion = valor as Record<string, unknown>;

  const idDirecto = Number(
    sesion.id ?? sesion.usuarioId,
  );

  if (
    Number.isInteger(idDirecto) &&
    idDirecto > 0
  ) {
    return idDirecto;
  }

  const usuario = sesion.usuario;

  if (usuario && typeof usuario === "object") {
    const usuarioId = Number(
      (usuario as Record<string, unknown>).id,
    );

    if (
      Number.isInteger(usuarioId) &&
      usuarioId > 0
    ) {
      return usuarioId;
    }
  }

  const user = sesion.user;

  if (user && typeof user === "object") {
    const userId = Number(
      (user as Record<string, unknown>).id,
    );

    if (
      Number.isInteger(userId) &&
      userId > 0
    ) {
      return userId;
    }
  }

  throw new Error(
    "La sesión no contiene el ID del usuario autenticado.",
  );
}

function obtenerTextoOpcional(
  formData: FormData,
  campo: string,
): string | null {
  const valor = String(
    formData.get(campo) ?? "",
  ).trim();

  return valor.length > 0 ? valor : null;
}

function obtenerDatosMovimiento(
  formData: FormData,
): DatosMovimiento | ResultadoMovimiento {
  const articuloId = Number(
    formData.get("articuloId"),
  );

  const cantidad = Number(
    formData.get("cantidad"),
  );

  const motivo = String(
    formData.get("motivo") ?? "",
  ).trim();

  if (
    !Number.isInteger(articuloId) ||
    articuloId <= 0
  ) {
    return {
      ok: false,
      error: "articulo",
    };
  }

  if (
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {
    return {
      ok: false,
      error: "cantidad",
    };
  }

  if (motivo.length === 0) {
    return {
      ok: false,
      error: "motivo",
    };
  }

  return {
    articuloId,
    cantidad,
    motivo,
    observaciones: obtenerTextoOpcional(
      formData,
      "observaciones",
    ),
    documentoReferencia: obtenerTextoOpcional(
      formData,
      "documentoReferencia",
    ),
  };
}

function esResultadoError(
  valor: DatosMovimiento | ResultadoMovimiento,
): valor is ResultadoMovimiento {
  return "ok" in valor;
}

async function procesarMovimiento(
  tipoMovimiento: TipoMovimientoInventario,
  formData: FormData,
): Promise<ResultadoMovimiento> {
  const sesion = await requerirAdmin();
  const usuarioId = obtenerUsuarioId(sesion);

  const datos = obtenerDatosMovimiento(formData);

  if (esResultadoError(datos)) {
    return datos;
  }

  const {
    articuloId,
    cantidad,
    motivo,
    observaciones,
    documentoReferencia,
  } = datos;

  const resultado = await db.transaction(
    async (tx): Promise<ResultadoMovimiento> => {
      const [articulo] = await tx
        .select({
          id: articulosInventario.id,
          estado: articulosInventario.estado,
          controlaStock:
            articulosInventario.controlaStock,
        })
        .from(articulosInventario)
        .where(
          eq(
            articulosInventario.id,
            articuloId,
          ),
        )
        .limit(1);

      if (!articulo) {
        return {
          ok: false,
          error: "inexistente",
        };
      }

      if (articulo.estado !== "ACTIVO") {
        return {
          ok: false,
          error: "inactivo",
        };
      }

      if (!articulo.controlaStock) {
        return {
          ok: false,
          error: "sin-control",
        };
      }

      const fechaActual = new Date();

      const esIncremento =
        tipoMovimiento === "ENTRADA" ||
        tipoMovimiento ===
          "AJUSTE_POSITIVO";

      /*
       * La actualización se hace directamente en PostgreSQL.
       *
       * Para salidas y ajustes negativos, la condición gte()
       * impide que el stock quede por debajo de cero.
       */
      const [existenciaActualizada] = esIncremento
        ? await tx
            .update(existenciasInventario)
            .set({
              cantidadActual: sql<number>`
                ${existenciasInventario.cantidadActual}
                + ${cantidad}
              `,
              ultimaEntrada: fechaActual,
              actualizadoEn: fechaActual,
            })
            .where(
              eq(
                existenciasInventario.articuloId,
                articuloId,
              ),
            )
            .returning({
              cantidadNueva:
                existenciasInventario.cantidadActual,
            })
        : await tx
            .update(existenciasInventario)
            .set({
              cantidadActual: sql<number>`
                ${existenciasInventario.cantidadActual}
                - ${cantidad}
              `,
              ultimaSalida: fechaActual,
              actualizadoEn: fechaActual,
            })
            .where(
              and(
                eq(
                  existenciasInventario.articuloId,
                  articuloId,
                ),
                gte(
                  existenciasInventario.cantidadActual,
                  cantidad,
                ),
              ),
            )
            .returning({
              cantidadNueva:
                existenciasInventario.cantidadActual,
            });

      /*
       * En una entrada, la existencia anterior se obtiene
       * restando la cantidad a la nueva existencia.
       *
       * En una salida, se obtiene sumándola.
       */
      if (!existenciaActualizada) {
        const [existencia] = await tx
          .select({
            cantidadActual:
              existenciasInventario.cantidadActual,
          })
          .from(existenciasInventario)
          .where(
            eq(
              existenciasInventario.articuloId,
              articuloId,
            ),
          )
          .limit(1);

        if (!existencia) {
          return {
            ok: false,
            error: "sin-existencia",
          };
        }

        return {
          ok: false,
          error: "stock-insuficiente",
        };
      }

      const existenciaNueva =
        existenciaActualizada.cantidadNueva;

      const existenciaAnterior = esIncremento
        ? existenciaNueva - cantidad
        : existenciaNueva + cantidad;

      await tx.insert(movimientosInventario).values({
        articuloId,
        usuarioId,
        tipoMovimiento,
        cantidad,
        existenciaAnterior,
        existenciaNueva,
        motivo,
        observaciones,
        documentoReferencia,
        creadoEn: fechaActual,
      });

      return {
        ok: true,
      };
    },
  );

  if (resultado.ok) {
    revalidatePath(RUTA_EXISTENCIAS);
    revalidatePath(
      "/administracion/inventario/articulos",
    );
    revalidatePath(
      "/administracion/inventario",
    );
  }

  return resultado;
}

function redirigirConResultado(
  resultado: ResultadoMovimiento,
  tipo: TipoMovimientoInventario,
): never {
  if (!resultado.ok) {
    redirect(
      `${RUTA_EXISTENCIAS}?error=${resultado.error}`,
    );
  }

  redirect(
    `${RUTA_EXISTENCIAS}?exito=movimiento&tipo=${tipo}`,
  );
}

export async function registrarEntrada(
  formData: FormData,
): Promise<never> {
  const resultado = await procesarMovimiento(
    "ENTRADA",
    formData,
  );

  redirigirConResultado(
    resultado,
    "ENTRADA",
  );
}

export async function registrarSalida(
  formData: FormData,
): Promise<never> {
  const resultado = await procesarMovimiento(
    "SALIDA",
    formData,
  );

  redirigirConResultado(
    resultado,
    "SALIDA",
  );
}

export async function registrarAjustePositivo(
  formData: FormData,
): Promise<never> {
  const resultado = await procesarMovimiento(
    "AJUSTE_POSITIVO",
    formData,
  );

  redirigirConResultado(
    resultado,
    "AJUSTE_POSITIVO",
  );
}

export async function registrarAjusteNegativo(
  formData: FormData,
): Promise<never> {
  const resultado = await procesarMovimiento(
    "AJUSTE_NEGATIVO",
    formData,
  );

  redirigirConResultado(
    resultado,
    "AJUSTE_NEGATIVO",
  );
}