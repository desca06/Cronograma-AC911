"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  ordenCompraEventos,
  ordenCompraItems,
  ordenesCompra,
  proveedores,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

type ItemFormulario = {
  tipo: "PRODUCTO" | "SERVICIO";
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

function texto(
  valor:
    | FormDataEntryValue
    | null,
) {
  return typeof valor ===
    "string"
    ? valor.trim()
    : "";
}

function entero(
  valor: unknown,
) {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero,
  )
    ? Math.trunc(numero)
    : 0;
}

function dineroACentavos(
  valor: unknown,
) {
  const numero =
    typeof valor ===
    "string"
      ? Number(
          valor.replace(
            ",",
            ".",
          ),
        )
      : Number(valor);

  if (
    !Number.isFinite(
      numero,
    ) ||
    numero < 0
  ) {
    return 0;
  }

  return Math.round(
    numero * 100,
  );
}

function generarCodigoOrden() {
  const ahora =
    new Date();

  const fecha =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Guatemala",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    )
      .format(ahora)
      .replaceAll(
        "-",
        "",
      );

  const aleatorio =
    crypto
      .randomUUID()
      .slice(0, 6)
      .toUpperCase();

  return `OC-${fecha}-${aleatorio}`;
}

function parsearItems(
  raw: string,
): ItemFormulario[] {
  try {
    const datos =
      JSON.parse(raw);

    if (
      !Array.isArray(
        datos,
      )
    ) {
      return [];
    }

    return datos
      .map(
        (
          item,
        ): ItemFormulario | null => {
          if (
            !item ||
            typeof item !==
              "object"
          ) {
            return null;
          }

          const tipo =
            item.tipo ===
            "SERVICIO"
              ? "SERVICIO"
              : "PRODUCTO";

          const descripcion =
            typeof item.descripcion ===
            "string"
              ? item.descripcion.trim()
              : "";

          const cantidad =
            Math.max(
              entero(
                item.cantidad,
              ),
              0,
            );

          const precioUnitario =
            dineroACentavos(
              item.precioUnitario,
            );

          if (
            !descripcion ||
            cantidad <= 0 ||
            precioUnitario < 0
          ) {
            return null;
          }

          return {
            tipo,
            descripcion,
            cantidad,
            precioUnitario,
          };
        },
      )
      .filter(
        (
          item,
        ): item is ItemFormulario =>
          Boolean(item),
      );
  } catch {
    return [];
  }
}

export async function crearOrdenCompra(
  formData: FormData,
) {
  const sesion =
    await requerirAdmin();

  const proveedorId =
    entero(
      formData.get(
        "proveedorId",
      ),
    );

  const fechaCompra =
    texto(
      formData.get(
        "fechaCompra",
      ),
    );

  const motivo =
    texto(
      formData.get(
        "motivo",
      ),
    );

  const observaciones =
    texto(
      formData.get(
        "observaciones",
      ),
    );

  const facturaReferencia =
    texto(
      formData.get(
        "facturaReferencia",
      ),
    );

  const items =
    parsearItems(
      texto(
        formData.get(
          "items",
        ),
      ),
    );

  if (!proveedorId) {
    redirect(
      "/administracion/compras/ordenes/nueva?error=proveedor",
    );
  }

  if (!fechaCompra) {
    redirect(
      "/administracion/compras/ordenes/nueva?error=fecha",
    );
  }

  if (!motivo) {
    redirect(
      "/administracion/compras/ordenes/nueva?error=motivo",
    );
  }

  if (
    items.length === 0
  ) {
    redirect(
      "/administracion/compras/ordenes/nueva?error=items",
    );
  }

  const proveedor =
    await db
      .select({
        id: proveedores.id,
      })
      .from(proveedores)
      .where(
        eq(
          proveedores.id,
          proveedorId,
        ),
      )
      .limit(1);

  if (!proveedor[0]) {
    redirect(
      "/administracion/compras/ordenes/nueva?error=proveedor",
    );
  }

  const subtotal =
    items.reduce(
      (
        acumulado,
        item,
      ) =>
        acumulado +
        item.cantidad *
          item.precioUnitario,
      0,
    );

  const codigo =
    generarCodigoOrden();

  const ahora =
    new Date();

  const ordenId =
    await db.transaction(
      async (tx) => {
        const [orden] =
          await tx
            .insert(
              ordenesCompra,
            )
            .values({
              codigo,
              proveedorId,
              fechaCompra,
              motivo,
              observaciones:
                observaciones ||
                null,
              facturaReferencia:
                facturaReferencia ||
                null,
              estado:
                "PENDIENTE",
              subtotal,
              total: subtotal,
              creadoEn:
                ahora,
              actualizadoEn:
                ahora,
            })
            .returning({
              id: ordenesCompra.id,
            });

        if (!orden) {
          throw new Error(
            "No fue posible crear la orden.",
          );
        }

        for (
          let indice = 0;
          indice <
          items.length;
          indice += 1
        ) {
          const item =
            items[indice];

          await tx
            .insert(
              ordenCompraItems,
            )
            .values({
              ordenCompraId:
                orden.id,
              tipo:
                item.tipo,
              articuloId:
                null,
              descripcion:
                item.descripcion,
              cantidad:
                item.cantidad,
              precioUnitario:
                item.precioUnitario,
              subtotal:
                item.cantidad *
                item.precioUnitario,
              orden:
                indice,
              creadoEn:
                ahora,
            });
        }

        await tx
          .insert(
            ordenCompraEventos,
          )
          .values({
            ordenCompraId:
              orden.id,
            usuarioId:
              sesion.usuarioId,
            tipo:
              "CREADA",
            estadoAnterior:
              null,
            estadoNuevo:
              "PENDIENTE",
            descripcion:
              "Orden de compra creada con ingreso manual de productos y servicios.",
            creadoEn:
              ahora,
          });

        return orden.id;
      },
    );

  revalidatePath(
    "/administracion/compras",
  );

  revalidatePath(
    "/administracion/compras/ordenes",
  );

  revalidatePath(
    "/administracion/compras/historial",
  );

  redirect(
    `/administracion/compras/ordenes/${ordenId}?success=creada`,
  );
}

export async function aprobarOrdenCompra(
  ordenId: number,
) {
  const sesion =
    await requerirAdmin();

  const ahora =
    new Date();

  await db.transaction(
    async (tx) => {
      const [orden] =
        await tx
          .select({
            id: ordenesCompra.id,
            estado:
              ordenesCompra.estado,
          })
          .from(
            ordenesCompra,
          )
          .where(
            eq(
              ordenesCompra.id,
              ordenId,
            ),
          )
          .limit(1);

      if (
        !orden ||
        orden.estado !==
          "PENDIENTE"
      ) {
        throw new Error(
          "Solo se pueden aprobar órdenes pendientes.",
        );
      }

      await tx
        .update(
          ordenesCompra,
        )
        .set({
          estado:
            "APROBADA",
          actualizadoEn:
            ahora,
        })
        .where(
          eq(
            ordenesCompra.id,
            ordenId,
          ),
        );

      await tx
        .insert(
          ordenCompraEventos,
        )
        .values({
          ordenCompraId:
            ordenId,
          usuarioId:
            sesion.usuarioId,
          tipo:
            "APROBADA",
          estadoAnterior:
            "PENDIENTE",
          estadoNuevo:
            "APROBADA",
          descripcion:
            "Orden de compra aprobada.",
          creadoEn:
            ahora,
        });
    },
  );

  revalidatePath(
    "/administracion/compras",
  );

  revalidatePath(
    "/administracion/compras/ordenes",
  );

  revalidatePath(
    `/administracion/compras/ordenes/${ordenId}`,
  );

  revalidatePath(
    "/administracion/compras/historial",
  );

  redirect(
    `/administracion/compras/ordenes/${ordenId}?success=aprobada`,
  );
}

export async function completarOrdenCompra(
  ordenId: number,
) {
  const sesion =
    await requerirAdmin();

  const ahora =
    new Date();

  await db.transaction(
    async (tx) => {
      const [orden] =
        await tx
          .select({
            id: ordenesCompra.id,
            estado:
              ordenesCompra.estado,
          })
          .from(
            ordenesCompra,
          )
          .where(
            eq(
              ordenesCompra.id,
              ordenId,
            ),
          )
          .limit(1);

      if (
        !orden ||
        orden.estado !==
          "APROBADA"
      ) {
        throw new Error(
          "Solo se pueden completar órdenes aprobadas.",
        );
      }

      await tx
        .update(
          ordenesCompra,
        )
        .set({
          estado:
            "COMPLETADA",
          completadaEn:
            ahora,
          actualizadoEn:
            ahora,
        })
        .where(
          eq(
            ordenesCompra.id,
            ordenId,
          ),
        );

      await tx
        .insert(
          ordenCompraEventos,
        )
        .values({
          ordenCompraId:
            ordenId,
          usuarioId:
            sesion.usuarioId,
          tipo:
            "COMPLETADA",
          estadoAnterior:
            "APROBADA",
          estadoNuevo:
            "COMPLETADA",
          descripcion:
            "Compra completada.",
          creadoEn:
            ahora,
        });
    },
  );

  revalidatePath(
    "/administracion/compras",
  );

  revalidatePath(
    "/administracion/compras/ordenes",
  );

  revalidatePath(
    `/administracion/compras/ordenes/${ordenId}`,
  );

  revalidatePath(
    "/administracion/compras/historial",
  );

  redirect(
    `/administracion/compras/ordenes/${ordenId}?success=completada`,
  );
}

export async function cancelarOrdenCompra(
  ordenId: number,
) {
  const sesion =
    await requerirAdmin();

  const ahora =
    new Date();

  await db.transaction(
    async (tx) => {
      const [orden] =
        await tx
          .select({
            id: ordenesCompra.id,
            estado:
              ordenesCompra.estado,
          })
          .from(
            ordenesCompra,
          )
          .where(
            eq(
              ordenesCompra.id,
              ordenId,
            ),
          )
          .limit(1);

      if (
        !orden ||
        orden.estado ===
          "COMPLETADA" ||
        orden.estado ===
          "CANCELADA"
      ) {
        throw new Error(
          "Esta orden ya no puede cancelarse.",
        );
      }

      await tx
        .update(
          ordenesCompra,
        )
        .set({
          estado:
            "CANCELADA",
          actualizadoEn:
            ahora,
        })
        .where(
          eq(
            ordenesCompra.id,
            ordenId,
          ),
        );

      await tx
        .insert(
          ordenCompraEventos,
        )
        .values({
          ordenCompraId:
            ordenId,
          usuarioId:
            sesion.usuarioId,
          tipo:
            "CANCELADA",
          estadoAnterior:
            orden.estado,
          estadoNuevo:
            "CANCELADA",
          descripcion:
            "Orden de compra cancelada.",
          creadoEn:
            ahora,
        });
    },
  );

  revalidatePath(
    "/administracion/compras",
  );

  revalidatePath(
    "/administracion/compras/ordenes",
  );

  revalidatePath(
    `/administracion/compras/ordenes/${ordenId}`,
  );

  revalidatePath(
    "/administracion/compras/historial",
  );

  redirect(
    `/administracion/compras/ordenes/${ordenId}?success=cancelada`,
  );
}