"use server";

import {
  and,
  desc,
  eq,
  ilike,
  ne,
} from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  articulosInventario,
  categoriasInventario,
  existenciasInventario,
} from "@/db/schema";
import { requerirInventario } from "@/lib/auth";

const RUTA_ARTICULOS =
  "/administracion/inventario/articulos";

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  return String(formData.get(campo) ?? "").trim();
}

function obtenerEntero(
  formData: FormData,
  campo: string,
): number {
  const valor = Number(formData.get(campo));

  if (!Number.isInteger(valor) || valor < 0) {
    return 0;
  }

  return valor;
}

function obtenerCostoEnCentavos(
  formData: FormData,
): number {
  const valor = obtenerTexto(
    formData,
    "costoReferencia",
  );

  if (!valor) {
    return 0;
  }

  const costo = Number(valor);

  if (!Number.isFinite(costo) || costo < 0) {
    return 0;
  }

  return Math.round(costo * 100);
}

function obtenerTipo(
  formData: FormData,
): "ACTIVO" | "CONSUMIBLE" | null {
  const tipo = obtenerTexto(formData, "tipo");

  if (
    tipo !== "ACTIVO" &&
    tipo !== "CONSUMIBLE"
  ) {
    return null;
  }

  return tipo;
}

function generarCodigo(id: number): string {
  return `ART-${String(id).padStart(5, "0")}`;
}

export async function crearArticulo(
  formData: FormData,
) {
  await requerirInventario();

  const nombre = obtenerTexto(formData, "nombre");
  const descripcion =
    obtenerTexto(formData, "descripcion") || null;

  const categoriaId = Number(
    formData.get("categoriaId"),
  );

  const tipo = obtenerTipo(formData);

  const unidadMedida = obtenerTexto(
    formData,
    "unidadMedida",
  );

  const marca =
    obtenerTexto(formData, "marca") || null;

  const modelo =
    obtenerTexto(formData, "modelo") || null;

  const costoReferencia =
    obtenerCostoEnCentavos(formData);

  const stockMinimo = obtenerEntero(
    formData,
    "stockMinimo",
  );

  const controlaStock =
    formData.get("controlaStock") === "on";

  if (!nombre) {
    redirect(
      `${RUTA_ARTICULOS}/nuevo?error=nombre`,
    );
  }

  if (
    !Number.isInteger(categoriaId) ||
    categoriaId <= 0
  ) {
    redirect(
      `${RUTA_ARTICULOS}/nuevo?error=categoria`,
    );
  }

  if (!tipo) {
    redirect(
      `${RUTA_ARTICULOS}/nuevo?error=tipo`,
    );
  }

  if (!unidadMedida) {
    redirect(
      `${RUTA_ARTICULOS}/nuevo?error=unidad`,
    );
  }

  const categoria = await db
    .select({
      id: categoriasInventario.id,
      estado: categoriasInventario.estado,
    })
    .from(categoriasInventario)
    .where(
      eq(categoriasInventario.id, categoriaId),
    )
    .limit(1);

  if (!categoria[0]) {
    redirect(
      `${RUTA_ARTICULOS}/nuevo?error=categoria`,
    );
  }

  if (categoria[0].estado !== "ACTIVO") {
    redirect(
      `${RUTA_ARTICULOS}/nuevo?error=categoria-inactiva`,
    );
  }

  const articuloDuplicado = await db
    .select({
      id: articulosInventario.id,
    })
    .from(articulosInventario)
    .where(
      and(
        ilike(articulosInventario.nombre, nombre),
        eq(
          articulosInventario.categoriaId,
          categoriaId,
        ),
      ),
    )
    .limit(1);

  if (articuloDuplicado[0]) {
    redirect(
      `${RUTA_ARTICULOS}/nuevo?error=duplicado`,
    );
  }

  await db.transaction(async (tx) => {
    const ultimoArticulo = await tx
      .select({
        id: articulosInventario.id,
      })
      .from(articulosInventario)
      .orderBy(desc(articulosInventario.id))
      .limit(1);

    const siguienteId =
      (ultimoArticulo[0]?.id ?? 0) + 1;

    const codigo = generarCodigo(siguienteId);

    const articulosCreados = await tx
      .insert(articulosInventario)
      .values({
        codigo,
        nombre,
        descripcion,
        categoriaId,
        tipo,
        unidadMedida,
        marca,
        modelo,
        costoReferencia,
        stockMinimo,
        controlaStock,
        estado: "ACTIVO",
        actualizadoEn: new Date(),
      })
      .returning({
        id: articulosInventario.id,
      });

    const articuloCreado = articulosCreados[0];

    if (!articuloCreado) {
      throw new Error(
        "No fue posible crear el artículo.",
      );
    }

    await tx.insert(existenciasInventario).values({
      articuloId: articuloCreado.id,
      cantidadActual: 0,
      cantidadReservada: 0,
      actualizadoEn: new Date(),
    });
  });

  revalidatePath(RUTA_ARTICULOS);
  revalidatePath(
    "/administracion/inventario/existencias",
  );

  redirect(`${RUTA_ARTICULOS}?creado=1`);
}

export async function editarArticulo(
  articuloId: number,
  formData: FormData,
) {
  await requerirInventario();

  if (
    !Number.isInteger(articuloId) ||
    articuloId <= 0
  ) {
    redirect(`${RUTA_ARTICULOS}?error=id`);
  }

  const nombre = obtenerTexto(formData, "nombre");
  const descripcion =
    obtenerTexto(formData, "descripcion") || null;

  const categoriaId = Number(
    formData.get("categoriaId"),
  );

  const tipo = obtenerTipo(formData);

  const unidadMedida = obtenerTexto(
    formData,
    "unidadMedida",
  );

  const marca =
    obtenerTexto(formData, "marca") || null;

  const modelo =
    obtenerTexto(formData, "modelo") || null;

  const costoReferencia =
    obtenerCostoEnCentavos(formData);

  const stockMinimo = obtenerEntero(
    formData,
    "stockMinimo",
  );

  const controlaStock =
    formData.get("controlaStock") === "on";

  const rutaEditar =
    `${RUTA_ARTICULOS}/editar/${articuloId}`;

  if (!nombre) {
    redirect(`${rutaEditar}?error=nombre`);
  }

  if (
    !Number.isInteger(categoriaId) ||
    categoriaId <= 0
  ) {
    redirect(`${rutaEditar}?error=categoria`);
  }

  if (!tipo) {
    redirect(`${rutaEditar}?error=tipo`);
  }

  if (!unidadMedida) {
    redirect(`${rutaEditar}?error=unidad`);
  }

  const articuloActual = await db
    .select({
      id: articulosInventario.id,
    })
    .from(articulosInventario)
    .where(
      eq(articulosInventario.id, articuloId),
    )
    .limit(1);

  if (!articuloActual[0]) {
    redirect(`${RUTA_ARTICULOS}?error=id`);
  }

  const categoria = await db
    .select({
      id: categoriasInventario.id,
      estado: categoriasInventario.estado,
    })
    .from(categoriasInventario)
    .where(
      eq(categoriasInventario.id, categoriaId),
    )
    .limit(1);

  if (!categoria[0]) {
    redirect(`${rutaEditar}?error=categoria`);
  }

  if (categoria[0].estado !== "ACTIVO") {
    redirect(
      `${rutaEditar}?error=categoria-inactiva`,
    );
  }

  const articuloDuplicado = await db
    .select({
      id: articulosInventario.id,
    })
    .from(articulosInventario)
    .where(
      and(
        ilike(articulosInventario.nombre, nombre),
        eq(
          articulosInventario.categoriaId,
          categoriaId,
        ),
        ne(articulosInventario.id, articuloId),
      ),
    )
    .limit(1);

  if (articuloDuplicado[0]) {
    redirect(`${rutaEditar}?error=duplicado`);
  }

  await db
    .update(articulosInventario)
    .set({
      nombre,
      descripcion,
      categoriaId,
      tipo,
      unidadMedida,
      marca,
      modelo,
      costoReferencia,
      stockMinimo,
      controlaStock,
      actualizadoEn: new Date(),
    })
    .where(
      eq(articulosInventario.id, articuloId),
    );

  revalidatePath(RUTA_ARTICULOS);
  revalidatePath(rutaEditar);
  revalidatePath(
    "/administracion/inventario/existencias",
  );

  redirect(`${RUTA_ARTICULOS}?editado=1`);
}

export async function cambiarEstadoArticulo(
  articuloId: number,
) {
  await requerirInventario();

  if (
    !Number.isInteger(articuloId) ||
    articuloId <= 0
  ) {
    redirect(`${RUTA_ARTICULOS}?error=id`);
  }

  const resultado = await db
    .select({
      id: articulosInventario.id,
      estado: articulosInventario.estado,
    })
    .from(articulosInventario)
    .where(
      eq(articulosInventario.id, articuloId),
    )
    .limit(1);

  const articulo = resultado[0];

  if (!articulo) {
    redirect(`${RUTA_ARTICULOS}?error=id`);
  }

  const nuevoEstado =
    articulo.estado === "ACTIVO"
      ? "INACTIVO"
      : "ACTIVO";

  await db
    .update(articulosInventario)
    .set({
      estado: nuevoEstado,
      actualizadoEn: new Date(),
    })
    .where(
      eq(articulosInventario.id, articuloId),
    );

  revalidatePath(RUTA_ARTICULOS);
  revalidatePath(
    "/administracion/inventario/existencias",
  );

  redirect(`${RUTA_ARTICULOS}?estado=1`);
}