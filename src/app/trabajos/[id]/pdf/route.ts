import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  asc,
  eq,
} from "drizzle-orm";
import {
  PDFDocument,
  PDFImage,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import { db } from "@/db";
import {
  clientes,
  empleados,
  evidencias,
  trabajoEmpleados,
  trabajoObservacionesTecnico,
  trabajos,
  usuarios,
  vehiculos,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";
import { cargarImagenEvidencia } from "@/lib/cargar-imagen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache =
  "force-no-store";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 36;

const COLOR = {
  navy: rgb(
    8 / 255,
    47 / 255,
    73 / 255,
  ),
  blue: rgb(
    2 / 255,
    132 / 255,
    199 / 255,
  ),
  sky: rgb(
    224 / 255,
    242 / 255,
    254 / 255,
  ),
  skyBorder: rgb(
    125 / 255,
    211 / 255,
    252 / 255,
  ),
  slate900: rgb(
    15 / 255,
    23 / 255,
    42 / 255,
  ),
  slate700: rgb(
    51 / 255,
    65 / 255,
    85 / 255,
  ),
  slate500: rgb(
    100 / 255,
    116 / 255,
    139 / 255,
  ),
  slate200: rgb(
    226 / 255,
    232 / 255,
    240 / 255,
  ),
  slate50: rgb(
    248 / 255,
    250 / 255,
    252 / 255,
  ),
  white: rgb(1, 1, 1),
  green: rgb(
    22 / 255,
    163 / 255,
    74 / 255,
  ),
  brand: rgb(0.02, 0.25, 0.6),
  brandDark: rgb(0.01, 0.17, 0.43),
};

function cortar(
  texto: string,
  limite: number,
) {
  if (
    texto.length <= limite
  ) {
    return texto;
  }

  return `${texto.slice(
    0,
    Math.max(
      limite - 3,
      1,
    ),
  )}...`;
}

function formatearFechaHora(
  fecha: Date | string,
) {
  const valor =
    fecha instanceof Date
      ? fecha
      : new Date(fecha);

  return new Intl.DateTimeFormat(
    "es-GT",
    {
      timeZone:
        "America/Guatemala",
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(valor);
}

function partirTexto(
  texto: string,
  maxWidth: number,
  font: any,
  size: number,
) {
  const palabras =
    texto
      .replace(/\r/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const lineas: string[] =
    [];

  let actual = "";

  for (const palabra of palabras) {
    const prueba =
      actual
        ? `${actual} ${palabra}`
        : palabra;

    if (
      font.widthOfTextAtSize(
        prueba,
        size,
      ) <= maxWidth
    ) {
      actual = prueba;
    } else {
      if (actual) {
        lineas.push(
          actual,
        );
      }

      actual = palabra;
    }
  }

  if (actual) {
    lineas.push(actual);
  }

  return lineas.length
    ? lineas
    : [""];
}

function dibujarTextoEnvuelto(
  page: PDFPage,
  texto: string,
  x: number,
  y: number,
  maxWidth: number,
  font: any,
  size: number,
  color = COLOR.slate700,
  lineHeight = 12,
) {
  const lineas =
    partirTexto(
      texto,
      maxWidth,
      font,
      size,
    );

  let cursorY = y;

  for (const linea of lineas) {
    page.drawText(
      linea,
      {
        x,
        y: cursorY,
        size,
        font,
        color,
      },
    );

    cursorY -=
      lineHeight;
  }

  return cursorY;
}

function dibujarCampo(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  regular: any,
  bold: any,
) {
  page.drawRectangle({
    x,
    y,
    width,
    height: 52,
    color: COLOR.white,
    borderColor:
      COLOR.skyBorder,
    borderWidth: 1,
  });

  page.drawText(
    label.toUpperCase(),
    {
      x: x + 10,
      y: y + 34,
      size: 6.4,
      font: bold,
      color: COLOR.blue,
    },
  );

  const valor =
    cortar(value, 42);

  page.drawText(
    valor,
    {
      x: x + 10,
      y: y + 15,
      size: 8.4,
      font: bold,
      color: COLOR.slate900,
    },
  );
}

async function cargarLogo(
  pdf: PDFDocument,
): Promise<PDFImage | null> {
  const logoPath = path.join(
    process.cwd(),
    "public",
    "img",
    "logo-ac911.jpeg",
  );

  try {
    const bytes = await readFile(logoPath);
    return await pdf.embedJpg(bytes);
  } catch (error) {
    console.error("No se pudo cargar el logo del PDF:", error);
    return null;
  }
}

function dibujarEncabezado(
  page: PDFPage,
  logo: PDFImage | null,
  codigo: string,
  estado: string,
  regular: any,
  bold: any,
) {
  const top = PAGE_HEIGHT - 16;
  const logoWidth = 140;
  const logoHeight = 72;

  if (logo) {
    page.drawImage(logo, {
      x: MARGIN,
      y: top - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    page.drawRectangle({
      x: MARGIN,
      y: top - logoHeight,
      width: logoWidth,
      height: logoHeight,
      color: COLOR.sky,
      borderColor: COLOR.brand,
      borderWidth: 0.8,
    });

    page.drawText("AC-911", {
      x: MARGIN + 36,
      y: top - 42,
      size: 18,
      font: bold,
      color: COLOR.brand,
    });
  }

  const companyX = MARGIN + logoWidth + 16;

  page.drawText("INVERSIONES 3G DE GUATEMALA", {
    x: companyX,
    y: top - 10,
    size: 13,
    font: bold,
    color: COLOR.slate900,
  });

  const detalles = [
    "Guatemala, Zona 11, Col. Roosevelt",
    "Teléfono: 2267-4000",
    "Email: proyectos@ac-911.com",
  ];

  detalles.forEach((detalle, index) => {
    page.drawText(detalle, {
      x: companyX,
      y: top - 28 - index * 13,
      size: 8.5,
      font: regular,
      color: COLOR.slate700,
    });
  });

  const codigoAncho = bold.widthOfTextAtSize(codigo, 14);

  page.drawText(codigo, {
    x: PAGE_WIDTH - MARGIN - codigoAncho,
    y: top - 14,
    size: 14,
    font: bold,
    color: COLOR.brand,
  });

  const etiqueta = "Reporte Técnico";
  const etiquetaAncho = bold.widthOfTextAtSize(etiqueta, 9.5);

  page.drawText(etiqueta, {
    x: PAGE_WIDTH - MARGIN - etiquetaAncho,
    y: top - 34,
    size: 9.5,
    font: bold,
    color: COLOR.brand,
  });

  const textoEstado = cortar(estado.toUpperCase(), 18);
  const badgeWidth = Math.max(
    92,
    bold.widthOfTextAtSize(textoEstado, 8) + 18,
  );

  page.drawRectangle({
    x: PAGE_WIDTH - MARGIN - badgeWidth,
    y: top - 60,
    width: badgeWidth,
    height: 18,
    color: COLOR.brand,
  });

  const estadoAncho = bold.widthOfTextAtSize(textoEstado, 8);

  page.drawText(textoEstado, {
    x:
      PAGE_WIDTH -
      MARGIN -
      badgeWidth / 2 -
      estadoAncho / 2,
    y: top - 54,
    size: 8,
    font: bold,
    color: COLOR.white,
  });

  page.drawLine({
    start: {
      x: MARGIN,
      y: top - logoHeight - 8,
    },
    end: {
      x: PAGE_WIDTH - MARGIN,
      y: top - logoHeight - 8,
    },
    thickness: 2,
    color: COLOR.brand,
  });

  const titulo = "INFORME DE TRABAJO";
  const tituloAncho = bold.widthOfTextAtSize(titulo, 13);

  page.drawText(titulo, {
    x: (PAGE_WIDTH - tituloAncho) / 2,
    y: top - logoHeight - 28,
    size: 13,
    font: bold,
    color: COLOR.brand,
  });

  return top - logoHeight - 42;
}

function dibujarPie(
  page: PDFPage,
  numero: number,
  regular: any,
) {
  page.drawText(
    `AC-911 · Reporte de trabajo · Página ${numero}`,
    {
      x: MARGIN,
      y: 20,
      size: 6.5,
      font: regular,
      color: COLOR.slate500,
    },
  );
}
