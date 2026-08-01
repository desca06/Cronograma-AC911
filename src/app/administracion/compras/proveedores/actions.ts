"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  proveedores,
  type TipoProveedor,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

const RUTA_PROVEEDORES =
  "/administracion/compras/proveedores";

function obtenerTexto(
  formData: FormData,
  campo: string,
): string {
  return String(formData.get(campo) ?? "").trim();
}

function obtenerTextoOpcional(
  formData: FormData,
  campo: string,
): string | null {
  const valor = obtenerTexto(formData, campo);

  return valor.length > 0 ? valor : null;
}

function normalizarNit(nit: string): string {
  return nit
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

function normalizarCorreo(
  correo: string | null,
): string | null {
  return correo
    ? correo.trim().toLowerCase()
    : null;
}

function esTipoProveedor(
  valor: string,
): valor is TipoProveedor {
  return [
    "PRODUCTOS",
    "SERVICIOS",
    "MIXTO",
  ].includes(valor);
}

function generarCodigo(numero: number): string {
  return `PROV-${String(numero).padStart(
    5,
    "0",
  )}`;
}

export async function crearProveedor(
  formData: FormData,
): Promise<never> {
  await requerirAdmin();

  const nombreComercial = obtenerTexto(
    formData,
    "nombreComercial",
  );

  const razonSocial = obtenerTextoOpcional(
    formData,
    "razonSocial",
  );

  const nitOriginal = obtenerTexto(
    formData,
    "nit",
  );

  const nit = normalizarNit(nitOriginal);

  const telefono = obtenerTextoOpcional(
    formData,
    "telefono",
  );

  const correo = normalizarCorreo(
    obtenerTextoOpcional(
      formData,
      "correo",
    ),
  );

  const direccion = obtenerTextoOpcional(
    formData,
    "direccion",
  );

  const contactoPrincipal =
    obtenerTextoOpcional(
      formData,
      "contactoPrincipal",
    );

  const telefonoContacto =
    obtenerTextoOpcional(
      formData,
      "telefonoContacto",
    );

  const tipoValor = obtenerTexto(
    formData,
    "tipo",
  );

  const observaciones =
    obtenerTextoOpcional(
      formData,
      "observaciones",
    );

  if (!nombreComercial) {
    redirect(
      `${RUTA_PROVEEDORES}/nuevo?error=nombre`,
    );
  }

  if (!nit) {
    redirect(
      `${RUTA_PROVEEDORES}/nuevo?error=nit`,
    );
  }

  if (!esTipoProveedor(tipoValor)) {
    redirect(
      `${RUTA_PROVEEDORES}/nuevo?error=tipo`,
    );
  }

  const [proveedorDuplicado] = await db
    .select({
      id: proveedores.id,
    })
    .from(proveedores)
    .where(eq(proveedores.nit, nit))
    .limit(1);

  if (proveedorDuplicado) {
    redirect(
      `${RUTA_PROVEEDORES}/nuevo?error=duplicado`,
    );
  }

  const proveedorId =
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(9112026)`,
      );

      const [resultado] = await tx
        .select({
          siguiente:
            sql<number>`coalesce(max(${proveedores.id}), 0) + 1`,
        })
        .from(proveedores);

      const siguiente = Number(
        resultado?.siguiente ?? 1,
      );

      const codigo = generarCodigo(
        siguiente,
      );

      const [creado] = await tx
        .insert(proveedores)
        .values({
          codigo,
          nombreComercial,
          razonSocial,
          nit,
          telefono,
          correo,
          direccion,
          contactoPrincipal,
          telefonoContacto,
          tipo: tipoValor,
          observaciones,
          actualizadoEn: new Date(),
        })
        .returning({
          id: proveedores.id,
        });

      if (!creado) {
        throw new Error(
          "No fue posible crear el proveedor.",
        );
      }

      return creado.id;
    });

  revalidatePath(RUTA_PROVEEDORES);
  revalidatePath(
    "/administracion/compras",
  );

  redirect(
    `${RUTA_PROVEEDORES}/${proveedorId}?creado=1`,
  );
}

export async function actualizarProveedor(
  proveedorId: number,
  formData: FormData,
): Promise<never> {
  await requerirAdmin();

  if (
    !Number.isInteger(proveedorId) ||
    proveedorId <= 0
  ) {
    redirect(
      `${RUTA_PROVEEDORES}?error=id`,
    );
  }

  const nombreComercial = obtenerTexto(
    formData,
    "nombreComercial",
  );

  const razonSocial = obtenerTextoOpcional(
    formData,
    "razonSocial",
  );

  const nit = normalizarNit(
    obtenerTexto(formData, "nit"),
  );

  const telefono = obtenerTextoOpcional(
    formData,
    "telefono",
  );

  const correo = normalizarCorreo(
    obtenerTextoOpcional(
      formData,
      "correo",
    ),
  );

  const direccion = obtenerTextoOpcional(
    formData,
    "direccion",
  );

  const contactoPrincipal =
    obtenerTextoOpcional(
      formData,
      "contactoPrincipal",
    );

  const telefonoContacto =
    obtenerTextoOpcional(
      formData,
      "telefonoContacto",
    );

  const tipoValor = obtenerTexto(
    formData,
    "tipo",
  );

  const observaciones =
    obtenerTextoOpcional(
      formData,
      "observaciones",
    );

  if (!nombreComercial) {
    redirect(
      `${RUTA_PROVEEDORES}/${proveedorId}/editar?error=nombre`,
    );
  }

  if (!nit) {
    redirect(
      `${RUTA_PROVEEDORES}/${proveedorId}/editar?error=nit`,
    );
  }

  if (!esTipoProveedor(tipoValor)) {
    redirect(
      `${RUTA_PROVEEDORES}/${proveedorId}/editar?error=tipo`,
    );
  }

  const [proveedor] = await db
    .select({
      id: proveedores.id,
    })
    .from(proveedores)
    .where(eq(proveedores.id, proveedorId))
    .limit(1);

  if (!proveedor) {
    redirect(
      `${RUTA_PROVEEDORES}?error=id`,
    );
  }

  const [duplicado] = await db
    .select({
      id: proveedores.id,
    })
    .from(proveedores)
    .where(eq(proveedores.nit, nit))
    .limit(1);

  if (
    duplicado &&
    duplicado.id !== proveedorId
  ) {
    redirect(
      `${RUTA_PROVEEDORES}/${proveedorId}/editar?error=duplicado`,
    );
  }

  await db
    .update(proveedores)
    .set({
      nombreComercial,
      razonSocial,
      nit,
      telefono,
      correo,
      direccion,
      contactoPrincipal,
      telefonoContacto,
      tipo: tipoValor,
      observaciones,
      actualizadoEn: new Date(),
    })
    .where(eq(proveedores.id, proveedorId));

  revalidatePath(RUTA_PROVEEDORES);
  revalidatePath(
    `${RUTA_PROVEEDORES}/${proveedorId}`,
  );
  revalidatePath(
    `${RUTA_PROVEEDORES}/${proveedorId}/editar`,
  );

  redirect(
    `${RUTA_PROVEEDORES}/${proveedorId}?actualizado=1`,
  );
}

export async function eliminarProveedor(
  proveedorId: number,
): Promise<never> {
  await requerirAdmin();

  if (
    !Number.isInteger(proveedorId) ||
    proveedorId <= 0
  ) {
    redirect(
      `${RUTA_PROVEEDORES}?error=id`,
    );
  }

  const [proveedor] = await db
    .select({
      id: proveedores.id,
    })
    .from(proveedores)
    .where(eq(proveedores.id, proveedorId))
    .limit(1);

  if (!proveedor) {
    redirect(
      `${RUTA_PROVEEDORES}?error=id`,
    );
  }

  try {
    await db
      .delete(proveedores)
      .where(eq(proveedores.id, proveedorId));
  } catch {
    redirect(
      `${RUTA_PROVEEDORES}/${proveedorId}?error=relaciones`,
    );
  }

  revalidatePath(RUTA_PROVEEDORES);
  revalidatePath(
    "/administracion/compras",
  );

  redirect(
    `${RUTA_PROVEEDORES}?eliminado=1`,
  );
}