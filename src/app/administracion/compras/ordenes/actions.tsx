"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  articulosInventario,
  existenciasInventario,
  movimientosInventario,
  ordenCompraEventos,
  ordenCompraItems,
  ordenesCompra,
  proveedores,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

type ItemFormulario = {
  tipo: "PRODUCTO" | "SERVICIO";
  articuloId?: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

function texto(valor: FormDataEntryValue | null) {
  return typeof valor === "string" ? valor.trim() : "";
}

function entero(valor: unknown) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.trunc(numero) : 0;
}

function dineroACentavos(valor: unknown) {
  const numero =
    typeof valor === "string"
      ? Number(valor.replace(",", "."))
      : Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return 0;
  }

  return Math.round(numero * 100);
}

function generarCodigoOrden() {
  const ahora = new Date();

  const fecha = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(ahora)
    .replaceAll("-", "");

  const aleatorio = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `OC-${fecha}-${aleatorio}`;
}

function parsearItems(raw: string): ItemFormulario[] {
  try {
    const datos = JSON.parse(raw);

    if (!Array.isArray(datos)) {
      return [];
    }

    return datos
      .map((item): ItemFormulario | null => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const tipo =
          item.tipo === "SERVICIO" ? "SERVICIO" : "PRODUCTO";

        const articuloId =
          item.articuloId === null ||
          item.articuloId === undefined ||
          item.articuloId === ""
            ? null
            : entero(item.articuloId);

        const descripcion =
          typeof item.descripcion === "string"
            ? item.descripcion.trim()
            : "";

        const cantidad = Math.max(entero(item.cantidad), 0);

        const precioUnitario = dineroACentavos(
          item.precioUnitario,
        );

        if (
          cantidad <= 0 ||
          precioUnitario < 0 ||
          (tipo === "PRODUCTO" && !articuloId) ||
          (tipo === "SERVICIO" && !descripcion)
        ) {
          return null;
        }

        return {
          tipo,
          articuloId,
          descripcion,
          cantidad,
          precioUnitario,
        };
      })
      .filter((item): item is ItemFormulario => Boolean(item));
  } catch {
    return [];
  }
}

export async function crearOrdenCompra(formData: FormData) {
  await requerirAdmin();

  const proveedorId = entero(formData.get("proveedorId"));
  const fechaCompra = texto(formData.get("fechaCompra"));
  const motivo = texto(formData.get("motivo"));
  const observaciones = texto(formData.get("observaciones"));
  const facturaReferencia = texto(
    formData.get("facturaReferencia"),
  );

  const items = parsearItems(texto(formData.get("items")));

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

  if (items.length === 0) {
    redirect(
      "/administracion/compras/ordenes/nueva?error=items",
    );
  }

  const proveedor = await db
    .select({ id: proveedores.id })
    .from(proveedores)
    .where(eq(proveedores.id, proveedorId))
    .limit(1);

  if (!proveedor[0]) {
    redirect(
      "/administracion/compras/ordenes/nueva?error=proveedor",
    );
  }

  const idsArticulos = [
    ...new Set(
      items
        .filter(
          (item) =>
            item.tipo === "PRODUCTO" && item.articuloId,
        )
        .map((item) => item.articuloId as number),
    ),
  ];

  for (const articuloId of idsArticulos) {
    const articulo = await db
      .select({
        id: articulosInventario.id,
        nombre: articulosInventario.nombre,
      })
      .from(articulosInventario)
      .where(eq(articulosInventario.id, articuloId))
      .limit(1);

    if (!articulo[0]) {
      redirect(
        "/administracion/compras/ordenes/nueva?error=articulo",
      );
    }
  }

  const subtotal = items.reduce(
    (acumulado, item) =>
      acumulado + item.cantidad * item.precioUnitario,
    0,
  );

  const codigo = generarCodigoOrden();

  const ordenId = await db.transaction(async (tx) => {
    const [orden] = await tx
      .insert(ordenesCompra)
      .values({
        codigo,
        proveedorId,
        fechaCompra,
        motivo,
        observaciones: observaciones || null,
        facturaReferencia: facturaReferencia || null,
        estado: "PENDIENTE",
        subtotal,
        total: subtotal,
      })
      .returning({ id: ordenesCompra.id });

    if (!orden) {
      throw new Error("No fue posible crear la orden.");
    }

    for (let indice = 0; indice < items.length; indice += 1) {
      const item = items[indice];

      let descripcion = item.descripcion;

      if (item.tipo === "PRODUCTO" && item.articuloId) {
        const [articulo] = await tx
          .select({
            nombre: articulosInventario.nombre,
          })
          .from(articulosInventario)
          .where(
            eq(articulosInventario.id, item.articuloId),
          )
          .limit(1);

        descripcion = articulo?.nombre ?? item.descripcion;
      }

      await tx.insert(ordenCompraItems).values({
        ordenCompraId: orden.id,
        tipo: item.tipo,
        articuloId:
          item.tipo === "PRODUCTO"
            ? item.articuloId ?? null
            : null,
        descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.cantidad * item.precioUnitario,
        orden: indice,
      });
    }

    await tx.insert(ordenCompraEventos).values({
      ordenCompraId: orden.id,
      tipo: "CREADA",
      estadoAnterior: null,
      estadoNuevo: "PENDIENTE",
      descripcion: "Orden de compra creada.",
    });

    return orden.id;
  });

  revalidatePath("/administracion/compras/ordenes");
  revalidatePath("/administracion/compras/historial");

  redirect(
    `/administracion/compras/ordenes/${ordenId}?success=creada`,
  );
}

export async function aprobarOrdenCompra(
  ordenId: number,
) {
  await requerirAdmin();

  await db.transaction(async (tx) => {
    const [orden] = await tx
      .select({
        id: ordenesCompra.id,
        estado: ordenesCompra.estado,
      })
      .from(ordenesCompra)
      .where(eq(ordenesCompra.id, ordenId))
      .limit(1);

    if (!orden || orden.estado !== "PENDIENTE") {
      throw new Error(
        "Solo se pueden aprobar órdenes pendientes.",
      );
    }

    await tx
      .update(ordenesCompra)
      .set({
        estado: "APROBADA",
        actualizadoEn: new Date(),
      })
      .where(eq(ordenesCompra.id, ordenId));

    await tx.insert(ordenCompraEventos).values({
      ordenCompraId: ordenId,
      tipo: "APROBADA",
      estadoAnterior: "PENDIENTE",
      estadoNuevo: "APROBADA",
      descripcion: "Orden de compra aprobada.",
    });
  });

  revalidatePath("/administracion/compras/ordenes");
  revalidatePath(
    `/administracion/compras/ordenes/${ordenId}`,
  );
  revalidatePath("/administracion/compras/historial");

  redirect(
    `/administracion/compras/ordenes/${ordenId}?success=aprobada`,
  );
}

export async function completarOrdenCompra(
  ordenId: number,
) {
  await requerirAdmin();

  await db.transaction(async (tx) => {
    const [orden] = await tx
      .select({
        id: ordenesCompra.id,
        codigo: ordenesCompra.codigo,
        estado: ordenesCompra.estado,
      })
      .from(ordenesCompra)
      .where(eq(ordenesCompra.id, ordenId))
      .limit(1);

    if (!orden || orden.estado !== "APROBADA") {
      throw new Error(
        "Solo se pueden completar órdenes aprobadas.",
      );
    }

    const items = await tx
      .select({
        tipo: ordenCompraItems.tipo,
        articuloId: ordenCompraItems.articuloId,
        descripcion: ordenCompraItems.descripcion,
        cantidad: ordenCompraItems.cantidad,
      })
      .from(ordenCompraItems)
      .where(
        eq(ordenCompraItems.ordenCompraId, ordenId),
      );

    for (const item of items) {
      if (
        item.tipo !== "PRODUCTO" ||
        !item.articuloId
      ) {
        continue;
      }

      const [existencia] = await tx
        .select({
          id: existenciasInventario.id,
          cantidadActual:
            existenciasInventario.cantidadActual,
        })
        .from(existenciasInventario)
        .where(
          eq(
            existenciasInventario.articuloId,
            item.articuloId,
          ),
        )
        .limit(1);

      const anterior = existencia?.cantidadActual ?? 0;
      const nueva = anterior + item.cantidad;

      if (existencia) {
        await tx
          .update(existenciasInventario)
          .set({
            cantidadActual: nueva,
            ultimaEntrada: new Date(),
            actualizadoEn: new Date(),
          })
          .where(
            eq(existenciasInventario.id, existencia.id),
          );
      } else {
        await tx.insert(existenciasInventario).values({
          articuloId: item.articuloId,
          cantidadActual: nueva,
          cantidadReservada: 0,
          ultimaEntrada: new Date(),
        });
      }

      await tx.insert(movimientosInventario).values({
        articuloId: item.articuloId,
        usuarioId: null,
        tipoMovimiento: "ENTRADA",
        cantidad: item.cantidad,
        existenciaAnterior: anterior,
        existenciaNueva: nueva,
        motivo: `Compra ${orden.codigo}`,
        observaciones:
          "Entrada automática al completar una orden de compra.",
        documentoReferencia: orden.codigo,
      });
    }

    await tx
      .update(ordenesCompra)
      .set({
        estado: "COMPLETADA",
        completadaEn: new Date(),
        actualizadoEn: new Date(),
      })
      .where(eq(ordenesCompra.id, ordenId));

    await tx.insert(ordenCompraEventos).values({
      ordenCompraId: ordenId,
      tipo: "COMPLETADA",
      estadoAnterior: "APROBADA",
      estadoNuevo: "COMPLETADA",
      descripcion:
        "Compra completada. Los productos vinculados fueron ingresados al inventario.",
    });
  });

  revalidatePath("/administracion/compras/ordenes");
  revalidatePath(
    `/administracion/compras/ordenes/${ordenId}`,
  );
  revalidatePath("/administracion/compras/historial");
  revalidatePath("/administracion/inventario");

  redirect(
    `/administracion/compras/ordenes/${ordenId}?success=completada`,
  );
}

export async function cancelarOrdenCompra(
  ordenId: number,
) {
  await requerirAdmin();

  await db.transaction(async (tx) => {
    const [orden] = await tx
      .select({
        id: ordenesCompra.id,
        estado: ordenesCompra.estado,
      })
      .from(ordenesCompra)
      .where(eq(ordenesCompra.id, ordenId))
      .limit(1);

    if (
      !orden ||
      orden.estado === "COMPLETADA" ||
      orden.estado === "CANCELADA"
    ) {
      throw new Error(
        "Esta orden ya no puede cancelarse.",
      );
    }

    await tx
      .update(ordenesCompra)
      .set({
        estado: "CANCELADA",
        actualizadoEn: new Date(),
      })
      .where(eq(ordenesCompra.id, ordenId));

    await tx.insert(ordenCompraEventos).values({
      ordenCompraId: ordenId,
      tipo: "CANCELADA",
      estadoAnterior: orden.estado,
      estadoNuevo: "CANCELADA",
      descripcion: "Orden de compra cancelada.",
    });
  });

  revalidatePath("/administracion/compras/ordenes");
  revalidatePath(
    `/administracion/compras/ordenes/${ordenId}`,
  );
  revalidatePath("/administracion/compras/historial");

  redirect(
    `/administracion/compras/ordenes/${ordenId}?success=cancelada`,
  );
}