import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

export class ErrorAlmacenamiento extends Error {
  codigo: "token" | "almacenamiento";

  constructor(
    codigo: "token" | "almacenamiento",
    mensaje: string,
  ) {
    super(mensaje);
    this.codigo = codigo;
    this.name = "ErrorAlmacenamiento";
  }
}

function estaEnVercel() {
  return process.env.VERCEL === "1";
}

export async function guardarArchivoPublico({
  rutaLogica,
  contenido,
  contentType,
}: {
  rutaLogica: string;
  contenido: Buffer;
  contentType: string;
}): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (token) {
    const blob = await put(
      rutaLogica,
      contenido,
      {
        access: "public",
        contentType,
        token,
      },
    );

    return blob.url;
  }

  /*
   * En local guardamos en disco.
   * En Vercel no hay disco permanente: si no hay
   * Blob token, dejamos la foto como data URL
   * para que el técnico pueda seguir trabajando.
   */
  if (!estaEnVercel()) {
    const rutaRelativa = rutaLogica.replace(/^\/+/, "");
    const rutaFisica = path.join(
      process.cwd(),
      "public",
      "uploads",
      rutaRelativa,
    );

    await mkdir(path.dirname(rutaFisica), {
      recursive: true,
    });

    await writeFile(rutaFisica, contenido);

    return `/uploads/${rutaRelativa}`;
  }

  const tipo = contentType || "image/jpeg";

  return `data:${tipo};base64,${contenido.toString("base64")}`;
}
