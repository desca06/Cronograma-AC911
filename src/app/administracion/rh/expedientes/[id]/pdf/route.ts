import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFFont,
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
const MARGIN = 28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const BLUE = rgb(0.02, 0.25, 0.60);
const BLUE_DARK = rgb(0.01, 0.17, 0.43);
const BLUE_LIGHT = rgb(0.93, 0.97, 1);
const BORDER = rgb(0.78, 0.84, 0.91);
const TEXT = rgb(0.08, 0.10, 0.14);
const MUTED = rgb(0.35, 0.40, 0.48);
const WHITE = rgb(1, 1, 1);
const LIGHT = rgb(0.98, 0.985, 0.995);
const GREEN_LIGHT = rgb(0.92, 0.98, 0.94);
const RED_LIGHT = rgb(1, 0.94, 0.94);
const VIOLET_LIGHT = rgb(0.96, 0.93, 1);

function safeText(value: string | null | undefined) {
  return value?.trim() || "No registrado";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "No registrada";
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "No registrada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function stateLabel(value: string) {
  if (value === "ACTIVO") {
    return "ACTIVO";
  }

  if (value === "INACTIVO") {
    return "INACTIVO";
  }

  return value;
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

function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    width: number;
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
    lineHeight?: number;
    maxLines?: number;
  },
) {
  const lines = wrapText(
    text,
    options.font,
    options.size,
    options.width,
  );

  const visibleLines = options.maxLines
    ? lines.slice(0, options.maxLines)
    : lines;

  const lineHeight = options.lineHeight ?? options.size + 3;
  let y = options.y;

  visibleLines.forEach((line) => {
    page.drawText(line, {
      x: options.x,
      y,
      size: options.size,
      font: options.font,
      color: options.color ?? TEXT,
    });

    y -= lineHeight;
  });

  return {
    y,
    lines: visibleLines.length,
  };
}

function drawCard(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    color?: ReturnType<typeof rgb>;
    borderColor?: ReturnType<typeof rgb>;
  },
) {
  page.drawRectangle({
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    color: options.color ?? WHITE,
    borderColor: options.borderColor ?? BORDER,
    borderWidth: 0.8,
  });
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    width: number;
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const textWidth = options.font.widthOfTextAtSize(
    text,
    options.size,
  );

  page.drawText(text, {
    x: options.x + Math.max(0, (options.width - textWidth) / 2),
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color ?? TEXT,
  });
}

function drawField(
  page: PDFPage,
  label: string,
  value: string,
  options: {
    x: number;
    y: number;
    width: number;
    height?: number;
    normal: PDFFont;
    bold: PDFFont;
    background?: ReturnType<typeof rgb>;
  },
) {
  const height = options.height ?? 50;

  drawCard(page, {
    x: options.x,
    y: options.y - height,
    width: options.width,
    height,
    color: options.background ?? LIGHT,
    borderColor: BORDER,
  });

  page.drawText(label.toUpperCase(), {
    x: options.x + 12,
    y: options.y - 17,
    size: 7.3,
    font: options.bold,
    color: BLUE,
  });

  drawWrappedText(page, value, {
    x: options.x + 12,
    y: options.y - 34,
    width: options.width - 24,
    font: options.normal,
    size: 9,
    lineHeight: 11,
    maxLines: 2,
  });
}

async function loadLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  const candidates = [
    {
      file: path.join(
        process.cwd(),
        "public",
        "img",
        "logo-ac911.jpeg",
      ),
      type: "jpg" as const,
    },
    {
      file: path.join(
        process.cwd(),
        "public",
        "img",
        "logo-ac911.jpg",
      ),
      type: "jpg" as const,
    },
    {
      file: path.join(
        process.cwd(),
        "public",
        "img",
        "logo-ac911.png",
      ),
      type: "png" as const,
    },
  ];

  for (const candidate of candidates) {
    try {
      const bytes = await readFile(candidate.file);

      if (candidate.type === "png") {
        return await pdf.embedPng(bytes);
      }

      return await pdf.embedJpg(bytes);
    } catch {
      // Se intenta con el siguiente nombre de archivo.
    }
  }

  return null;
}

function drawHeader(
  page: PDFPage,
  logo: PDFImage | null,
  normal: PDFFont,
  bold: PDFFont,
  code: string,
) {
  const top = PAGE_HEIGHT - 30;
  const logoWidth = 154;
  const logoHeight = 82;

  if (logo) {
    page.drawImage(logo, {
      x: MARGIN,
      y: top - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  } else {
    drawCard(page, {
      x: MARGIN,
      y: top - logoHeight,
      width: logoWidth,
      height: logoHeight,
      color: BLUE_LIGHT,
      borderColor: BLUE,
    });

    drawCenteredText(page, "AC-911", {
      x: MARGIN,
      y: top - 49,
      width: logoWidth,
      size: 22,
      font: bold,
      color: BLUE,
    });
  }

  const companyX = MARGIN + logoWidth + 18;

  page.drawText("INVERSIONES 3G DE GUATEMALA", {
    x: companyX,
    y: top - 10,
    size: 13,
    font: bold,
    color: TEXT,
  });

  [
    "Guatemala, Zona 11, Col. Roosevelt",
    "Teléfono: 2267-4000",
    "Email: proyectos@ac-911.com",
  ].forEach((detail, index) => {
    page.drawText(detail, {
      x: companyX,
      y: top - 31 - index * 15,
      size: 8.5,
      font: normal,
      color: TEXT,
    });
  });

  const codeWidth = bold.widthOfTextAtSize(code, 13);

  page.drawText(code, {
    x: PAGE_WIDTH - MARGIN - codeWidth,
    y: top - 17,
    size: 13,
    font: bold,
    color: BLUE,
  });

  const subtitle = "Expediente laboral";
  const subtitleWidth = bold.widthOfTextAtSize(subtitle, 9.5);

  page.drawText(subtitle, {
    x: PAGE_WIDTH - MARGIN - subtitleWidth,
    y: top - 42,
    size: 9.5,
    font: bold,
    color: BLUE,
  });

  page.drawLine({
    start: {
      x: MARGIN,
      y: top - logoHeight - 12,
    },
    end: {
      x: PAGE_WIDTH - MARGIN,
      y: top - logoHeight - 12,
    },
    thickness: 2,
    color: BLUE,
  });

  drawCenteredText(page, "EXPEDIENTE DEL EMPLEADO", {
    x: MARGIN,
    y: top - logoHeight - 38,
    width: CONTENT_WIDTH,
    size: 14,
    font: bold,
    color: BLUE,
  });

  return top - logoHeight - 55;
}

function drawFooter(
  page: PDFPage,
  normal: PDFFont,
  bold: PDFFont,
  current: number,
  total: number,
) {
  page.drawLine({
    start: { x: MARGIN, y: 34 },
    end: { x: PAGE_WIDTH - MARGIN, y: 34 },
    thickness: 1.2,
    color: BLUE,
  });

  drawCenteredText(page, "AC-911", {
    x: MARGIN,
    y: 20,
    width: CONTENT_WIDTH,
    size: 8,
    font: bold,
    color: BLUE,
  });

  drawCenteredText(page, "Departamento de Recursos Humanos", {
    x: MARGIN,
    y: 10,
    width: CONTENT_WIDTH,
    size: 7.5,
    font: normal,
    color: TEXT,
  });

  page.drawRectangle({
    x: PAGE_WIDTH - MARGIN - 73,
    y: 13,
    width: 73,
    height: 17,
    color: BLUE,
  });

  page.drawText(`Página ${current} de ${total}`, {
    x: PAGE_WIDTH - MARGIN - 63,
    y: 18.5,
    size: 7,
    font: bold,
    color: WHITE,
  });
}

function drawSectionTitle(
  page: PDFPage,
  title: string,
  options: {
    x: number;
    y: number;
    width: number;
    bold: PDFFont;
    background?: ReturnType<typeof rgb>;
  },
) {
  page.drawRectangle({
    x: options.x,
    y: options.y - 25,
    width: options.width,
    height: 25,
    color: options.background ?? BLUE_LIGHT,
  });

  page.drawText(title.toUpperCase(), {
    x: options.x + 12,
    y: options.y - 16,
    size: 8.5,
    font: options.bold,
    color: BLUE_DARK,
  });
}

export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  await requerirAdmin();

  const { id } = await params;
  const expedienteId = Number(id);

  if (
    !Number.isInteger(expedienteId) ||
    expedienteId <= 0
  ) {
    return new Response("Expediente no válido.", {
      status: 400,
    });
  }

  const [expediente] = await db
    .select({
      id: expedientes.id,
      codigo: expedientes.codigo,
      empleadoId: expedientes.empleadoId,
      empleadoNombre: empleados.nombre,
      empleadoPuesto: empleados.puesto,
      dpi: expedientes.dpi,
      nit: expedientes.nit,
      igss: expedientes.igss,
      fechaIngreso: expedientes.fechaIngreso,
      contactoEmergencia: expedientes.contactoEmergencia,
      telefonoEmergencia: expedientes.telefonoEmergencia,
      direccion: expedientes.direccion,
      observaciones: expedientes.observaciones,
      estado: expedientes.estado,
      creadoEn: expedientes.creadoEn,
      actualizadoEn: expedientes.actualizadoEn,
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

  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(
    StandardFonts.Helvetica,
  );
  const bold = await pdf.embedFont(
    StandardFonts.HelveticaBold,
  );
  const logo = await loadLogo(pdf);

  const code = safeText(expediente.codigo);

  pdf.setTitle(`Expediente ${code}`);
  pdf.setAuthor("AC-911");
  pdf.setSubject(
    `Expediente laboral de ${expediente.empleadoNombre}`,
  );
  pdf.setCreator("Sistema Administrativo AC-911");

  let page = pdf.addPage([
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ]);

  let y = drawHeader(
    page,
    logo,
    normal,
    bold,
    code,
  );

  const newPage = () => {
    page = pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

    y = drawHeader(
      page,
      logo,
      normal,
      bold,
      code,
    );
  };

  const ensureSpace = (height: number) => {
    if (y - height < 55) {
      newPage();
    }
  };

  // Perfil del empleado y espacio para fotografía.
  const profileHeight = 132;

  drawCard(page, {
    x: MARGIN,
    y: y - profileHeight,
    width: CONTENT_WIDTH,
    height: profileHeight,
    color: WHITE,
    borderColor: BORDER,
  });

  const photoX = MARGIN + 14;
  const photoY = y - profileHeight + 14;
  const photoWidth = 92;
  const photoHeight = 104;

  drawCard(page, {
    x: photoX,
    y: photoY,
    width: photoWidth,
    height: photoHeight,
    color: LIGHT,
    borderColor: BLUE,
  });

  page.drawCircle({
    x: photoX + photoWidth / 2,
    y: photoY + 68,
    size: 15,
    borderColor: MUTED,
    borderWidth: 1,
  });

  page.drawLine({
    start: {
      x: photoX + 26,
      y: photoY + 29,
    },
    end: {
      x: photoX + photoWidth - 26,
      y: photoY + 29,
    },
    thickness: 1,
    color: MUTED,
  });

  page.drawLine({
    start: {
      x: photoX + 26,
      y: photoY + 29,
    },
    end: {
      x: photoX + 35,
      y: photoY + 48,
    },
    thickness: 1,
    color: MUTED,
  });

  page.drawLine({
    start: {
      x: photoX + photoWidth - 26,
      y: photoY + 29,
    },
    end: {
      x: photoX + photoWidth - 35,
      y: photoY + 48,
    },
    thickness: 1,
    color: MUTED,
  });

  drawCenteredText(page, "FOTOGRAFÍA", {
    x: photoX,
    y: photoY + 10,
    width: photoWidth,
    size: 7,
    font: bold,
    color: MUTED,
  });

  const profileX = photoX + photoWidth + 18;
  const profileWidth = CONTENT_WIDTH - photoWidth - 46;

  page.drawText("EMPLEADO", {
    x: profileX,
    y: y - 24,
    size: 7.5,
    font: bold,
    color: BLUE,
  });

  drawWrappedText(
    page,
    safeText(expediente.empleadoNombre),
    {
      x: profileX,
      y: y - 46,
      width: profileWidth - 100,
      font: bold,
      size: 16,
      lineHeight: 18,
      maxLines: 2,
    },
  );

  page.drawText(safeText(expediente.empleadoPuesto), {
    x: profileX,
    y: y - 75,
    size: 10,
    font: normal,
    color: MUTED,
    maxWidth: profileWidth - 110,
  });

  const active = expediente.estado === "ACTIVO";
  const statusText = stateLabel(expediente.estado);
  const statusWidth = Math.max(
    68,
    bold.widthOfTextAtSize(statusText, 8) + 22,
  );
  const statusX = MARGIN + CONTENT_WIDTH - statusWidth - 14;

  page.drawRectangle({
    x: statusX,
    y: y - 49,
    width: statusWidth,
    height: 23,
    color: active ? GREEN_LIGHT : RED_LIGHT,
    borderColor: active
      ? rgb(0.22, 0.72, 0.43)
      : rgb(0.85, 0.30, 0.30),
    borderWidth: 0.6,
  });

  drawCenteredText(page, statusText, {
    x: statusX,
    y: y - 41,
    width: statusWidth,
    size: 8,
    font: bold,
    color: active
      ? rgb(0.04, 0.48, 0.24)
      : rgb(0.72, 0.10, 0.10),
  });

  page.drawLine({
    start: {
      x: profileX,
      y: y - 92,
    },
    end: {
      x: MARGIN + CONTENT_WIDTH - 14,
      y: y - 92,
    },
    thickness: 0.6,
    color: BORDER,
  });

  page.drawText("Código de expediente", {
    x: profileX,
    y: y - 109,
    size: 7.2,
    font: bold,
    color: MUTED,
  });

  page.drawText(code, {
    x: profileX + 94,
    y: y - 109,
    size: 8.5,
    font: bold,
    color: TEXT,
  });

  page.drawText("Fecha de ingreso", {
    x: profileX + 220,
    y: y - 109,
    size: 7.2,
    font: bold,
    color: MUTED,
  });

  page.drawText(formatDate(expediente.fechaIngreso), {
    x: profileX + 298,
    y: y - 109,
    size: 8.5,
    font: bold,
    color: TEXT,
    maxWidth: 110,
  });

  y -= profileHeight + 16;

  // Información personal.
  ensureSpace(150);
  drawSectionTitle(page, "Información personal", {
    x: MARGIN,
    y,
    width: CONTENT_WIDTH,
    bold,
  });
  y -= 36;

  const gap = 12;
  const halfWidth = (CONTENT_WIDTH - gap) / 2;

  drawField(page, "DPI", safeText(expediente.dpi), {
    x: MARGIN,
    y,
    width: halfWidth,
    normal,
    bold,
  });

  drawField(page, "NIT", safeText(expediente.nit), {
    x: MARGIN + halfWidth + gap,
    y,
    width: halfWidth,
    normal,
    bold,
  });

  y -= 62;

  drawField(
    page,
    "Número de IGSS",
    safeText(expediente.igss),
    {
      x: MARGIN,
      y,
      width: halfWidth,
      normal,
      bold,
    },
  );

  drawField(
    page,
    "Estado laboral",
    stateLabel(expediente.estado),
    {
      x: MARGIN + halfWidth + gap,
      y,
      width: halfWidth,
      normal,
      bold,
      background: active ? GREEN_LIGHT : RED_LIGHT,
    },
  );

  y -= 62;

  drawField(
    page,
    "Dirección",
    safeText(expediente.direccion),
    {
      x: MARGIN,
      y,
      width: CONTENT_WIDTH,
      height: 58,
      normal,
      bold,
    },
  );

  y -= 74;

  // Contacto de emergencia y fechas.
  ensureSpace(160);

  drawSectionTitle(page, "Contacto de emergencia", {
    x: MARGIN,
    y,
    width: halfWidth,
    bold,
    background: RED_LIGHT,
  });

  drawSectionTitle(page, "Control del expediente", {
    x: MARGIN + halfWidth + gap,
    y,
    width: halfWidth,
    bold,
    background: VIOLET_LIGHT,
  });

  y -= 36;

  drawField(
    page,
    "Nombre",
    safeText(expediente.contactoEmergencia),
    {
      x: MARGIN,
      y,
      width: halfWidth,
      normal,
      bold,
    },
  );

  drawField(
    page,
    "Expediente creado",
    formatDateTime(expediente.creadoEn),
    {
      x: MARGIN + halfWidth + gap,
      y,
      width: halfWidth,
      normal,
      bold,
    },
  );

  y -= 62;

  drawField(
    page,
    "Teléfono",
    safeText(expediente.telefonoEmergencia),
    {
      x: MARGIN,
      y,
      width: halfWidth,
      normal,
      bold,
    },
  );

  drawField(
    page,
    "Última actualización",
    formatDateTime(expediente.actualizadoEn),
    {
      x: MARGIN + halfWidth + gap,
      y,
      width: halfWidth,
      normal,
      bold,
    },
  );

  y -= 78;

  // Observaciones.
  const observations = safeText(expediente.observaciones);
  const observationLines = wrapText(
    observations,
    normal,
    8.5,
    CONTENT_WIDTH - 28,
  );
  const observationHeight = Math.max(
    88,
    observationLines.length * 11 + 45,
  );

  ensureSpace(observationHeight + 90);

  drawSectionTitle(page, "Observaciones", {
    x: MARGIN,
    y,
    width: CONTENT_WIDTH,
    bold,
    background: rgb(1, 0.97, 0.88),
  });

  y -= 33;

  drawCard(page, {
    x: MARGIN,
    y: y - observationHeight,
    width: CONTENT_WIDTH,
    height: observationHeight,
    color: WHITE,
    borderColor: BORDER,
  });

  drawWrappedText(page, observations, {
    x: MARGIN + 14,
    y: y - 20,
    width: CONTENT_WIDTH - 28,
    font: normal,
    size: 8.5,
    lineHeight: 11,
  });

  y -= observationHeight + 30;

  // Firmas.
  if (y < 92) {
    newPage();
  }

  const signatureWidth = 180;
  const leftSignatureX = MARGIN + 40;
  const rightSignatureX = PAGE_WIDTH - MARGIN - 40 - signatureWidth;

  [
    {
      x: leftSignatureX,
      title: "Empleado",
      name: safeText(expediente.empleadoNombre),
    },
    {
      x: rightSignatureX,
      title: "Recursos Humanos",
      name: "AC-911",
    },
  ].forEach((signature) => {
    page.drawLine({
      start: {
        x: signature.x,
        y,
      },
      end: {
        x: signature.x + signatureWidth,
        y,
      },
      thickness: 0.8,
      color: MUTED,
    });

    drawCenteredText(page, signature.name, {
      x: signature.x,
      y: y - 17,
      width: signatureWidth,
      size: 8.5,
      font: bold,
      color: TEXT,
    });

    drawCenteredText(page, signature.title, {
      x: signature.x,
      y: y - 31,
      width: signatureWidth,
      size: 7.5,
      font: normal,
      color: MUTED,
    });
  });

  const pages = pdf.getPages();

  pages.forEach((currentPage, index) => {
    drawFooter(
      currentPage,
      normal,
      bold,
      index + 1,
      pages.length,
    );
  });

  const bytes = await pdf.save();
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const fileName = sanitizeFileName(
    `${code}-${expediente.empleadoNombre}`,
  );

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="${fileName || `expediente-${expediente.id}`}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}