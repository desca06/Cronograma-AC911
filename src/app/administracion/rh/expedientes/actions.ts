"use server";

import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import {
  and,
  eq,
  ne,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  empleados,
  expedientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

const ESTADOS_VALIDOS = [
  "ACTIVO",
  "INACTIVO",
] as const;

const TIPOS_IMAGEN_PERMITIDOS = [
  "image/jpeg",
  "image/png",
] as const;

const MAXIMO_IMAGEN_BYTES =
  5 * 1024 * 1024;

function obtenerTexto(
  formData: FormData,
  campo: string,
) {
  return String(
    formData.get(campo) ?? "",
  ).trim();
}

function generarCodigo(
  expedienteId: number,
) {
  return `EXP-${String(
    expedienteId,
  ).padStart(5, "0")}`;
}

function extensionPorMime(
  mime: string,
) {
  if (mime === "image/png") {
    return "png";
  }

  return "jpg";
}

function esFirmaPng(
  bytes: Uint8Array,
) {
  const firma = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
  ];

  return (
    bytes.length >= firma.length &&
    firma.every(
      (valor, indice) =>
        bytes[indice] === valor,
    )
  );
}

function esFirmaJpeg(
  bytes: Uint8Array,
) {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

function archivoCoincideConMime(
  bytes: Uint8Array,
  mime: string,
) {
  if (mime === "image/png") {
    return esFirmaPng(bytes);
  }

  if (mime === "image/jpeg") {
    return esFirmaJpeg(bytes);
  }

  return false;
}

function rutaFisicaDesdeFotoUrl(
  fotoUrl: string | null | undefined,
) {
  if (
    !fotoUrl ||
    !fotoUrl.startsWith(
      "/uploads/empleados/",
    )
  ) {
    return null;
  }

  const nombre = path.basename(
    fotoUrl,
  );

  return path.join(
    process.cwd(),
    "public",
    "uploads",
    "empleados",
    nombre,
  );
}

async function eliminarArchivoFoto(
  fotoUrl: string | null | undefined,
) {
  const ruta =
    rutaFisicaDesdeFotoUrl(
      fotoUrl,
    );

  if (!ruta) {
    return;
  }

  try {
    await unlink(ruta);
  } catch {
    // Si el archivo ya no existe,
    // no bloqueamos la operación.
  }
}

export async function crearExpediente(
  formData: FormData,
) {
  await requerirAdmin();

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const dpi =
    obtenerTexto(
      formData,
      "dpi",
    );

  const nit =
    obtenerTexto(
      formData,
      "nit",
    );

  const igss =
    obtenerTexto(
      formData,
      "igss",
    );

  const fechaIngreso =
    obtenerTexto(
      formData,
      "fechaIngreso",
    );

  const contactoEmergencia =
    obtenerTexto(
      formData,
      "contactoEmergencia",
    );

  const telefonoEmergencia =
    obtenerTexto(
      formData,
      "telefonoEmergencia",
    );

  const direccion =
    obtenerTexto(
      formData,
      "direccion",
    );

  const observaciones =
    obtenerTexto(
      formData,
      "observaciones",
    );

  if (
    !Number.isInteger(
      empleadoId,
    ) ||
    empleadoId <= 0 ||
    !dpi ||
    !fechaIngreso ||
    !contactoEmergencia ||
    !telefonoEmergencia ||
    !direccion
  ) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=campos",
    );
  }

  const empleadoEncontrado =
    await db
      .select({
        id: empleados.id,
      })
      .from(empleados)
      .where(
        eq(
          empleados.id,
          empleadoId,
        ),
      )
      .limit(1);

  if (!empleadoEncontrado[0]) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=empleado",
    );
  }

  const expedienteExistente =
    await db
      .select({
        id: expedientes.id,
      })
      .from(expedientes)
      .where(
        eq(
          expedientes.empleadoId,
          empleadoId,
        ),
      )
      .limit(1);

  if (expedienteExistente[0]) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=duplicado",
    );
  }

  const dpiExistente =
    await db
      .select({
        id: expedientes.id,
      })
      .from(expedientes)
      .where(
        eq(
          expedientes.dpi,
          dpi,
        ),
      )
      .limit(1);

  if (dpiExistente[0]) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=dpi",
    );
  }

  const resultado =
    await db
      .insert(expedientes)
      .values({
        empleadoId,
        codigo: null,
        fotoUrl: null,
        dpi,
        nit: nit || null,
        igss: igss || null,
        fechaIngreso,
        contactoEmergencia,
        telefonoEmergencia,
        direccion,
        observaciones:
          observaciones || null,
        estado: "ACTIVO",
      })
      .returning({
        id: expedientes.id,
      });

  const expedienteCreado =
    resultado[0];

  if (!expedienteCreado) {
    redirect(
      "/administracion/rh/expedientes/nuevo?error=crear",
    );
  }

  const codigo =
    generarCodigo(
      expedienteCreado.id,
    );

  await db
    .update(expedientes)
    .set({
      codigo,
      actualizadoEn:
        new Date().toISOString(),
    })
    .where(
      eq(
        expedientes.id,
        expedienteCreado.id,
      ),
    );

  revalidatePath(
    "/administracion/rh/expedientes",
  );

  redirect(
    `/administracion/rh/expedientes/${expedienteCreado.id}?success=creado&pdf=1`,
  );
}

export async function actualizarExpediente(
  expedienteId: number,
  formData: FormData,
) {
  await requerirAdmin();

  if (
    !Number.isInteger(
      expedienteId,
    ) ||
    expedienteId <= 0
  ) {
    redirect(
      "/administracion/rh/expedientes?error=expediente",
    );
  }

  const empleadoId = Number(
    formData.get("empleadoId"),
  );

  const dpi =
    obtenerTexto(
      formData,
      "dpi",
    );

  const nit =
    obtenerTexto(
      formData,
      "nit",
    );

  const igss =
    obtenerTexto(
      formData,
      "igss",
    );

  const fechaIngreso =
    obtenerTexto(
      formData,
      "fechaIngreso",
    );

  const contactoEmergencia =
    obtenerTexto(
      formData,
      "contactoEmergencia",
    );

  const telefonoEmergencia =
    obtenerTexto(
      formData,
      "telefonoEmergencia",
    );

  const direccion =
    obtenerTexto(
      formData,
      "direccion",
    );

  const observaciones =
    obtenerTexto(
      formData,
      "observaciones",
    );

  const estado =
    obtenerTexto(
      formData,
      "estado",
    );

  if (
    !Number.isInteger(
      empleadoId,
    ) ||
    empleadoId <= 0 ||
    !dpi ||
    !fechaIngreso ||
    !contactoEmergencia ||
    !telefonoEmergencia ||
    !direccion
  ) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=campos`,
    );
  }

  if (
    !ESTADOS_VALIDOS.includes(
      estado as (
        typeof ESTADOS_VALIDOS
      )[number],
    )
  ) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=estado`,
    );
  }

  const expedienteEncontrado =
    await db
      .select({
        id: expedientes.id,
      })
      .from(expedientes)
      .where(
        eq(
          expedientes.id,
          expedienteId,
        ),
      )
      .limit(1);

  if (!expedienteEncontrado[0]) {
    redirect(
      "/administracion/rh/expedientes?error=no-encontrado",
    );
  }

  const empleadoEncontrado =
    await db
      .select({
        id: empleados.id,
      })
      .from(empleados)
      .where(
        eq(
          empleados.id,
          empleadoId,
        ),
      )
      .limit(1);

  if (!empleadoEncontrado[0]) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=empleado`,
    );
  }

  const empleadoDuplicado =
    await db
      .select({
        id: expedientes.id,
      })
      .from(expedientes)
      .where(
        and(
          eq(
            expedientes.empleadoId,
            empleadoId,
          ),
          ne(
            expedientes.id,
            expedienteId,
          ),
        ),
      )
      .limit(1);

  if (empleadoDuplicado[0]) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=duplicado`,
    );
  }

  const dpiDuplicado =
    await db
      .select({
        id: expedientes.id,
      })
      .from(expedientes)
      .where(
        and(
          eq(
            expedientes.dpi,
            dpi,
          ),
          ne(
            expedientes.id,
            expedienteId,
          ),
        ),
      )
      .limit(1);

  if (dpiDuplicado[0]) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=dpi`,
    );
  }

  await db
    .update(expedientes)
    .set({
      empleadoId,
      dpi,
      nit: nit || null,
      igss: igss || null,
      fechaIngreso,
      contactoEmergencia,
      telefonoEmergencia,
      direccion,
      observaciones:
        observaciones || null,
      estado,
      actualizadoEn:
        new Date().toISOString(),
    })
    .where(
      eq(
        expedientes.id,
        expedienteId,
      ),
    );

  revalidatePath(
    "/administracion/rh/expedientes",
  );

  revalidatePath(
    `/administracion/rh/expedientes/${expedienteId}`,
  );

  redirect(
    `/administracion/rh/expedientes/${expedienteId}?success=actualizado&pdf=1`,
  );
}

export async function subirFotoExpediente(
  formData: FormData,
) {
  await requerirAdmin();

  const expedienteId =
    Number(
      formData.get(
        "expedienteId",
      ),
    );

  if (
    !Number.isInteger(
      expedienteId,
    ) ||
    expedienteId <= 0
  ) {
    redirect(
      "/administracion/rh/expedientes?error=expediente",
    );
  }

  const archivo =
    formData.get("foto");

  if (
    !(archivo instanceof File) ||
    archivo.size === 0
  ) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=foto-vacia`,
    );
  }

  if (
    !TIPOS_IMAGEN_PERMITIDOS.includes(
      archivo.type as (
        typeof TIPOS_IMAGEN_PERMITIDOS
      )[number],
    )
  ) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=foto-tipo`,
    );
  }

  if (
    archivo.size >
    MAXIMO_IMAGEN_BYTES
  ) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=foto-peso`,
    );
  }

  const expedienteActual =
    await db
      .select({
        id: expedientes.id,
        fotoUrl:
          expedientes.fotoUrl,
      })
      .from(expedientes)
      .where(
        eq(
          expedientes.id,
          expedienteId,
        ),
      )
      .limit(1);

  if (!expedienteActual[0]) {
    redirect(
      "/administracion/rh/expedientes?error=no-encontrado",
    );
  }

  const buffer =
    Buffer.from(
      await archivo.arrayBuffer(),
    );

  const encabezado =
    new Uint8Array(
      buffer.subarray(
        0,
        Math.min(
          buffer.length,
          16,
        ),
      ),
    );

  if (
    !archivoCoincideConMime(
      encabezado,
      archivo.type,
    )
  ) {
    redirect(
      `/administracion/rh/expedientes/${expedienteId}/editar?error=foto-tipo`,
    );
  }

  const carpeta =
    path.join(
      process.cwd(),
      "public",
      "uploads",
      "empleados",
    );

  await mkdir(
    carpeta,
    {
      recursive: true,
    },
  );

  const extension =
    extensionPorMime(
      archivo.type,
    );

  const nombreArchivo =
    `expediente-${expedienteId}-${Date.now()}.${extension}`;

  const rutaFisica =
    path.join(
      carpeta,
      nombreArchivo,
    );

  await writeFile(
    rutaFisica,
    buffer,
  );

  const fotoUrl =
    `/uploads/empleados/${nombreArchivo}`;

  await db
    .update(expedientes)
    .set({
      fotoUrl,
      actualizadoEn:
        new Date().toISOString(),
    })
    .where(
      eq(
        expedientes.id,
        expedienteId,
      ),
    );

  await eliminarArchivoFoto(
    expedienteActual[0].fotoUrl,
  );

  revalidatePath(
    "/administracion/rh/expedientes",
  );

  revalidatePath(
    `/administracion/rh/expedientes/${expedienteId}`,
  );

  revalidatePath(
    `/administracion/rh/expedientes/${expedienteId}/editar`,
  );

  redirect(
    `/administracion/rh/expedientes/${expedienteId}/editar?success=foto`,
  );
}

export async function eliminarFotoExpediente(
  formData: FormData,
) {
  await requerirAdmin();

  const expedienteId =
    Number(
      formData.get(
        "expedienteId",
      ),
    );

  if (
    !Number.isInteger(
      expedienteId,
    ) ||
    expedienteId <= 0
  ) {
    redirect(
      "/administracion/rh/expedientes?error=expediente",
    );
  }

  const [expediente] =
    await db
      .select({
        fotoUrl:
          expedientes.fotoUrl,
      })
      .from(expedientes)
      .where(
        eq(
          expedientes.id,
          expedienteId,
        ),
      )
      .limit(1);

  if (!expediente) {
    redirect(
      "/administracion/rh/expedientes?error=no-encontrado",
    );
  }

  await db
    .update(expedientes)
    .set({
      fotoUrl: null,
      actualizadoEn:
        new Date().toISOString(),
    })
    .where(
      eq(
        expedientes.id,
        expedienteId,
      ),
    );

  await eliminarArchivoFoto(
    expediente.fotoUrl,
  );

  revalidatePath(
    `/administracion/rh/expedientes/${expedienteId}`,
  );

  revalidatePath(
    `/administracion/rh/expedientes/${expedienteId}/editar`,
  );

  redirect(
    `/administracion/rh/expedientes/${expedienteId}/editar?success=foto-eliminada`,
  );
}

export async function eliminarExpediente(
  expedienteId: number,
) {
  await requerirAdmin();

  if (
    !Number.isInteger(
      expedienteId,
    ) ||
    expedienteId <= 0
  ) {
    redirect(
      "/administracion/rh/expedientes?error=expediente",
    );
  }

  const [expedienteEncontrado] =
    await db
      .select({
        id: expedientes.id,
        fotoUrl:
          expedientes.fotoUrl,
      })
      .from(expedientes)
      .where(
        eq(
          expedientes.id,
          expedienteId,
        ),
      )
      .limit(1);

  if (!expedienteEncontrado) {
    redirect(
      "/administracion/rh/expedientes?error=no-encontrado",
    );
  }

  await db
    .delete(expedientes)
    .where(
      eq(
        expedientes.id,
        expedienteId,
      ),
    );

  await eliminarArchivoFoto(
    expedienteEncontrado.fotoUrl,
  );

  revalidatePath(
    "/administracion/rh/expedientes",
  );

  redirect(
    "/administracion/rh/expedientes?success=eliminado",
  );
}