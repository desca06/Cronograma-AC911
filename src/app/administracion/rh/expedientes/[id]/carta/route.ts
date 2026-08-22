import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  empleados,
  expedientes,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 58;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const NAVY = rgb(0.02, 0.16, 0.38);
const BLUE = rgb(0.02, 0.25, 0.6);
const TEXT = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.32, 0.36, 0.42);
const LINE = rgb(0.72, 0.78, 0.86);
const WHITE = rgb(1, 1, 1);

const EMPRESA = "INVERSIONES 3G DE GUATEMALA";
const EMPRESA_CORTO = "AC-911";
const DIRECCION_EMPRESA = "Guatemala, Zona 11, Col. Roosevelt";
const TELEFONO_EMPRESA = "2267-4000";
const CORREO_EMPRESA = "proyectos@ac-911.com";
const FIRMANTE = "Departamento de Recursos Humanos";

function safeText(value: string | null | undefined) {
  return value?.trim() || "No registrado";
}

function formatearFechaLarga(value: string | null | undefined) {
  if (!value) {
    return "la fecha";
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function fechaCartaHoy() {
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.trim().split(/\s+/);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
        }

        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

function drawCentered(
  page: PDFPage,
  text: string,
  options: {
    y: number;
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const width = options.font.widthOfTextAtSize(text, options.size);

  page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color ?? TEXT,
  });
}

function drawParagraph(
  page: PDFPage,
  text: string,
  options: {
    y: number;
    font: PDFFont;
    size: number;
    lineHeight?: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const lineHeight = options.lineHeight ?? options.size + 6;
  const lines = wrapText(text, options.font, options.size, CONTENT_WIDTH);
  let y = options.y;

  for (const line of lines) {
    page.drawText(line, {
      x: MARGIN,
      y,
      size: options.size,
      font: options.font,
      color: options.color ?? TEXT,
    });

    y -= lineHeight;
  }

  return y;
}

async function loadLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  const candidates = [
    path.join(process.cwd(), "public", "img", "logo-ac911.jpeg"),
    path.join(process.cwd(), "public", "img", "logo-ac911.jpg"),
    path.join(process.cwd(), "public", "img", "logo-911.jpg"),
  ];

  for (const file of candidates) {
    try {
      const bytes = await readFile(file);
      return await pdf.embedJpg(bytes);
    } catch {
      // Se intenta el siguiente archivo.
    }
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  await requerirAdmin();

  const { id } = await params;
  const expedienteId = Number(id);

  if (!Number.isInteger(expedienteId) || expedienteId <= 0) {
    return new Response("Expediente no válido.", {
      status: 400,
    });
  }

  const [expediente] = await db
    .select({
      id: expedientes.id,
      codigo: expedientes.codigo,
      empleadoNombre: empleados.nombre,
      empleadoPuesto: empleados.puesto,
      fechaIngreso: expedientes.fechaIngreso,
      fechaSalida: expedientes.fechaSalida,
    })
    .from(expedientes)
    .innerJoin(
      empleados,
      eq(expedientes.empleadoId, empleados.id),
    )
    .where(eq(expedientes.id, expedienteId))
    .limit(1);

  if (!expediente) {
    return new Response("Expediente no encontrado.", {
      status: 404,
    });
  }

  const nombre = safeText(expediente.empleadoNombre);
  const puesto = safeText(expediente.empleadoPuesto);
  const fechaInicio = formatearFechaLarga(expediente.fechaIngreso);
  const sigueLaborando = !expediente.fechaSalida;
  const fechaFinal = sigueLaborando
    ? "la fecha"
    : formatearFechaLarga(expediente.fechaSalida);

  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const logo = await loadLogo(pdf);

  pdf.setTitle(`Carta de recomendación · ${nombre}`);
  pdf.setAuthor(EMPRESA_CORTO);
  pdf.setSubject("Carta de recomendación laboral");
  pdf.setCreator("Sistema Administrativo AC-911");

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const top = PAGE_HEIGHT - 42;

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 8,
    width: PAGE_WIDTH,
    height: 8,
    color: NAVY,
  });

  const logoWidth = 118;
  const logoHeight = 62;

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
      color: rgb(0.93, 0.96, 1),
      borderColor: BLUE,
      borderWidth: 0.8,
    });

    const marca = EMPRESA_CORTO;
    const marcaAncho = bold.widthOfTextAtSize(marca, 16);

    page.drawText(marca, {
      x: MARGIN + (logoWidth - marcaAncho) / 2,
      y: top - 38,
      size: 16,
      font: bold,
      color: BLUE,
    });
  }

  const companyX = MARGIN + logoWidth + 16;

  page.drawText(EMPRESA, {
    x: companyX,
    y: top - 12,
    size: 12,
    font: bold,
    color: NAVY,
  });

  page.drawText(DIRECCION_EMPRESA, {
    x: companyX,
    y: top - 30,
    size: 9,
    font: normal,
    color: MUTED,
  });

  page.drawText(`Tel.: ${TELEFONO_EMPRESA}  |  ${CORREO_EMPRESA}`, {
    x: companyX,
    y: top - 44,
    size: 9,
    font: normal,
    color: MUTED,
  });

  page.drawLine({
    start: {
      x: MARGIN,
      y: top - logoHeight - 14,
    },
    end: {
      x: PAGE_WIDTH - MARGIN,
      y: top - logoHeight - 14,
    },
    thickness: 1.4,
    color: NAVY,
  });

  page.drawLine({
    start: {
      x: MARGIN,
      y: top - logoHeight - 18,
    },
    end: {
      x: PAGE_WIDTH - MARGIN,
      y: top - logoHeight - 18,
    },
    thickness: 0.4,
    color: LINE,
  });

  let y = top - logoHeight - 52;

  drawCentered(page, "CARTA DE RECOMENDACIÓN LABORAL", {
    y,
    font: bold,
    size: 15,
    color: NAVY,
  });

  y -= 36;

  page.drawText(`Guatemala, ${fechaCartaHoy()}`, {
    x: MARGIN,
    y,
    size: 11,
    font: normal,
    color: TEXT,
  });

  y -= 34;

  page.drawText("A QUIEN CORRESPONDA:", {
    x: MARGIN,
    y,
    size: 11.5,
    font: bold,
    color: TEXT,
  });

  y -= 28;

  const verboLabor = sigueLaborando ? "labora" : "laboró";
  const verboDemostro = sigueLaborando
    ? "ha demostrado"
    : "demostró";
  const verboFormo = sigueLaborando
    ? "ha formado"
    : "formó";

  const parrafo1 =
    `Por medio de la presente, hago constar que ${nombre} ${verboLabor} ` +
    `en ${EMPRESA} (${EMPRESA_CORTO}) desempeñándose como ${puesto}, ` +
    `durante el período comprendido entre ${fechaInicio} y ${fechaFinal}.`;

  const parrafo2 =
    `Durante el tiempo que ${verboFormo} parte de nuestra institución, ` +
    `${verboDemostro} ser una persona responsable, comprometida y ` +
    `profesional en el desempeño de sus funciones.`;

  const parrafo3 =
    `Por lo anterior, recomiendo ampliamente a ${nombre} para cualquier ` +
    `oportunidad laboral acorde con su experiencia y capacidades.`;

  const parrafo4 =
    "Sin otro particular, extiendo la presente para los fines que al interesado convengan.";

  y = drawParagraph(page, parrafo1, {
    y,
    font: normal,
    size: 11.5,
    lineHeight: 17,
  });

  y -= 16;

  y = drawParagraph(page, parrafo2, {
    y,
    font: normal,
    size: 11.5,
    lineHeight: 17,
  });

  y -= 16;

  y = drawParagraph(page, parrafo3, {
    y,
    font: normal,
    size: 11.5,
    lineHeight: 17,
  });

  y -= 16;

  y = drawParagraph(page, parrafo4, {
    y,
    font: normal,
    size: 11.5,
    lineHeight: 17,
  });

  y -= 58;

  const firmaX = PAGE_WIDTH / 2 - 110;
  const firmaAncho = 220;

  page.drawLine({
    start: {
      x: firmaX,
      y,
    },
    end: {
      x: firmaX + firmaAncho,
      y,
    },
    thickness: 0.8,
    color: MUTED,
  });

  y -= 18;

  drawCentered(page, FIRMANTE, {
    y,
    font: bold,
    size: 11,
    color: TEXT,
  });

  y -= 15;

  drawCentered(page, EMPRESA, {
    y,
    font: normal,
    size: 10,
    color: MUTED,
  });

  y -= 14;

  drawCentered(page, EMPRESA_CORTO, {
    y,
    font: bold,
    size: 10,
    color: BLUE,
  });

  y -= 14;

  drawCentered(page, `Tel.: ${TELEFONO_EMPRESA}`, {
    y,
    font: normal,
    size: 9.5,
    color: MUTED,
  });

  y -= 13;

  drawCentered(page, `Correo: ${CORREO_EMPRESA}`, {
    y,
    font: normal,
    size: 9.5,
    color: MUTED,
  });

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: 28,
    color: NAVY,
  });

  page.drawText(
    `${EMPRESA_CORTO}  ·  Recursos Humanos  ·  Documento confidencial`,
    {
      x: MARGIN,
      y: 11,
      size: 8,
      font: normal,
      color: WHITE,
    },
  );

  const bytes = await pdf.save();
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const fileName = sanitizeFileName(
    `carta-recomendacion-${nombre}`,
  );

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="${fileName || `carta-${expediente.id}`}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}