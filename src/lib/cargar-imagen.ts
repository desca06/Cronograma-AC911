import { readFile } from "node:fs/promises";
import path from "node:path";

type TipoImagen = "jpg" | "png";

export type ImagenCargada = {
  bytes: Uint8Array;
  tipo: TipoImagen;
};

function detectarTipo(
  bytes: Uint8Array,
  pista = "",
): TipoImagen | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }

  const pistaNormal = pista.toLowerCase();

  if (
    pistaNormal.includes("jpeg") ||
    pistaNormal.includes("jpg")
  ) {
    return "jpg";
  }

  if (pistaNormal.includes("png")) {
    return "png";
  }

  return null;
}

function bytesDesdeDataUrl(
  archivoUrl: string,
): ImagenCargada | null {
  const coincidencia = archivoUrl.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/,
  );

  if (!coincidencia) {
    return null;
  }

  const tipoMime = coincidencia[1];
  const base64 = coincidencia[2];

  try {
    const bytes = new Uint8Array(
      Buffer.from(base64, "base64"),
    );

    const tipo = detectarTipo(bytes, tipoMime);

    if (!tipo) {
      return null;
    }

    return { bytes, tipo };
  } catch {
    return null;
  }
}

async function bytesDesdeHttp(
  archivoUrl: string,
): Promise<ImagenCargada | null> {
  try {
    const respuesta = await fetch(archivoUrl, {
      cache: "no-store",
    });

    if (!respuesta.ok) {
      return null;
    }

    const buffer = Buffer.from(
      await respuesta.arrayBuffer(),
    );
    const bytes = new Uint8Array(buffer);
    const tipo = detectarTipo(
      bytes,
      respuesta.headers.get("content-type") || archivoUrl,
    );

    if (!tipo) {
      return null;
    }

    return { bytes, tipo };
  } catch {
    return null;
  }
}

async function bytesDesdeDisco(
  archivoUrl: string,
): Promise<ImagenCargada | null> {
  const rutaRelativa = archivoUrl.replace(/^\/+/, "");

  if (!rutaRelativa || rutaRelativa.includes("..")) {
    return null;
  }

  try {
    const rutaFisica = path.join(
      process.cwd(),
      "public",
      rutaRelativa,
    );

    const buffer = await readFile(rutaFisica);
    const bytes = new Uint8Array(buffer);
    const tipo = detectarTipo(bytes, rutaFisica);

    if (!tipo) {
      return null;
    }

    return { bytes, tipo };
  } catch {
    return null;
  }
}

export async function cargarImagenEvidencia(
  archivoUrl: string,
): Promise<ImagenCargada | null> {
  const url = archivoUrl.trim();

  if (!url) {
    return null;
  }

  if (url.startsWith("data:image/")) {
    return bytesDesdeDataUrl(url);
  }

  if (
    url.startsWith("https://") ||
    url.startsWith("http://")
  ) {
    return bytesDesdeHttp(url);
  }

  return bytesDesdeDisco(url);
}