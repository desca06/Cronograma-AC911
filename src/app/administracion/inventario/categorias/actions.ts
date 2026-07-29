"use server";

import { db } from "@/db";
import { categoriasInventario } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const RUTA_CATEGORIAS =
  "/administracion/inventario/categorias";

function obtenerTexto(
  formData: FormData,
  campo: string,
) {
  return String(formData.get(campo) ?? "").trim();
}

export async function crearCategoria(
  formData: FormData,
) {
  const nombre = obtenerTexto(formData, "nombre");
  const descripcion =
    obtenerTexto(formData, "descripcion") || null;

  if (!nombre) {
    redirect(
      `${RUTA_CATEGORIAS}/nueva?error=nombre`,
    );
  }

  const categoriaExistente = await db
    .select({
      id: categoriasInventario.id,
    })
    .from(categoriasInventario)
    .where(eq(categoriasInventario.nombre, nombre))
    .limit(1);

  if (categoriaExistente.length > 0) {
    redirect(
      `${RUTA_CATEGORIAS}/nueva?error=duplicada`,
    );
  }

  await db.insert(categoriasInventario).values({
    nombre,
    descripcion,
    estado: "ACTIVO",
  });

  revalidatePath(RUTA_CATEGORIAS);
  redirect(`${RUTA_CATEGORIAS}?creada=1`);
}

export async function editarCategoria(
  id: number,
  formData: FormData,
) {
  const nombre = obtenerTexto(formData, "nombre");
  const descripcion =
    obtenerTexto(formData, "descripcion") || null;

  if (!Number.isInteger(id) || id <= 0) {
    redirect(`${RUTA_CATEGORIAS}?error=id`);
  }

  if (!nombre) {
    redirect(
      `${RUTA_CATEGORIAS}/editar/${id}?error=nombre`,
    );
  }

  const categoriaExistente = await db
    .select({
      id: categoriasInventario.id,
    })
    .from(categoriasInventario)
    .where(eq(categoriasInventario.nombre, nombre))
    .limit(1);

  if (
    categoriaExistente.length > 0 &&
    categoriaExistente[0].id !== id
  ) {
    redirect(
      `${RUTA_CATEGORIAS}/editar/${id}?error=duplicada`,
    );
  }

  await db
    .update(categoriasInventario)
    .set({
      nombre,
      descripcion,
      actualizadoEn: new Date().toISOString(),
    })
    .where(eq(categoriasInventario.id, id));

  revalidatePath(RUTA_CATEGORIAS);
  revalidatePath(
    `${RUTA_CATEGORIAS}/editar/${id}`,
  );

  redirect(`${RUTA_CATEGORIAS}?editada=1`);
}

export async function cambiarEstadoCategoria(
  id: number,
) {
  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const resultado = await db
    .select({
      estado: categoriasInventario.estado,
    })
    .from(categoriasInventario)
    .where(eq(categoriasInventario.id, id))
    .limit(1);

  const categoria = resultado[0];

  if (!categoria) {
    return;
  }

  const nuevoEstado =
    categoria.estado === "ACTIVO"
      ? "INACTIVO"
      : "ACTIVO";

  await db
    .update(categoriasInventario)
    .set({
      estado: nuevoEstado,
      actualizadoEn: new Date().toISOString(),
    })
    .where(eq(categoriasInventario.id, id));

  revalidatePath(RUTA_CATEGORIAS);
}