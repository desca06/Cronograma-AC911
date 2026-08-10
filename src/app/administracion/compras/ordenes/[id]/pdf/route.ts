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
import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  ordenCompraEventos,
  ordenCompraItems,
  ordenesCompra,
  proveedores,
  usuarios,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// A4 horizontal: igual al diseño Dark Ejecutivo aprobado.
const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 38;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const NAVY = rgb(0.024, 0.086, 0.161);
const CARD = rgb(0.051, 0.145, 0.251);
const CARD_ALT = rgb(0.063, 0.169, 0.286);
const HEADER = rgb(0.09, 0.227, 0.369);
const CYAN = rgb(0.024, 0.714, 0.831);
const PURPLE = rgb(0.545, 0.361, 0.965);
const GREEN = rgb(0.063, 0.725, 0.506);
const ORANGE = rgb(0.976, 0.451, 0.086);
const RED = rgb(0.937, 0.267, 0.267);
const AMBER = rgb(0.961, 0.620, 0.043);
const WHITE = rgb(1, 1, 1);
const TEXT = rgb(0.886, 0.91, 0.941);
const MUTED = rgb(0.58, 0.639, 0.722);
const BORDER = rgb(0.118, 0.227, 0.373);

const ROW_HEIGHT = 28;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type PdfColor = ReturnType<typeof rgb>;

function dinero(centavos: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(centavos / 100);
}

function fechaCompra(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)));
}

function fechaHoraGuatemala(fecha: Date | null) {
  if (!fecha) {
    return "No registrada";
  }

  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(fecha);
}

function horaGuatemala(fecha: Date | null) {
  if (!fecha) {
    return "No registrada";
  }

  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(fecha);
}

function truncate(texto: string, max: number) {
  if (texto.length <= max) {
    return texto;
  }

  return `${texto.slice(0, Math.max(1, max - 3))}...`;
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function estadoColor(estado: string): PdfColor {
  switch (estado) {
    case "PENDIENTE":
      return AMBER;
    case "APROBADA":
      return GREEN;
    case "COMPLETADA":
      return PURPLE;
    case "CANCELADA":
      return RED;
    default:
      return MUTED;
  }
}

async function loadLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  const candidatos = [
    {
      ruta: path.join(process.cwd(), "public", "img", "logo-ac911.jpeg"),
      tipo: "jpg",
    },
    {
      ruta: path.join(process.cwd(), "public", "img", "logo-ac911.jpg"),
      tipo: "jpg",
    },
    {
      ruta: path.join(process.cwd(), "public", "img", "logo-ac911.png"),
      tipo: "png",
    },
  ] as const;

  for (const candidato of candidatos) {
    try {
      const bytes = await readFile(candidato.ruta);

      return candidato.tipo === "png"
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
    } catch {
      // Probar el siguiente archivo de logo.
    }
  }

  return null;
}

function drawBackground(page: PDFPage) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: NAVY,
  });
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    width: number;
    size: number;
    font: PDFFont;
    color: PdfColor;
  },
) {
  const width = options.font.widthOfTextAtSize(text, options.size);

  page.drawText(text, {
    x: options.x + Math.max(0, (options.width - width) / 2),
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color,
  });
}

function drawHeader(
  page: PDFPage,
  logo: PDFImage | null,
  normal: PDFFont,
  bold: PDFFont,
  codigo: string,
  estado: string,
) {
  drawBackground(page);

  if (logo) {
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - 80,
      width: 98,
      height: 48,
    });
  } else {
    page.drawRectangle({
      x: MARGIN,
      y: PAGE_HEIGHT - 76,
      width: 98,
      height: 42,
      color: CARD,
      borderColor: CYAN,
      borderWidth: 0.8,
    });

    drawCenteredText(page, "AC-911", {
      x: MARGIN,
      y: PAGE_HEIGHT - 60,
      width: 98,
      size: 16,
      font: bold,
      color: CYAN,
    });
  }

  page.drawText("AC-911 / ORDEN DE COMPRA", {
    x: MARGIN + 118,
    y: PAGE_HEIGHT - 46,
    size: 19,
    font: bold,
    color: WHITE,
  });

  page.drawText(codigo, {
    x: MARGIN + 118,
    y: PAGE_HEIGHT - 66,
    size: 8,
    font: normal,
    color: MUTED,
  });

  const badgeWidth = Math.max(
    110,
    bold.widthOfTextAtSize(estado, 8) + 28,
  );

  const stateColor = estadoColor(estado);

  page.drawRectangle({
    x: PAGE_WIDTH - MARGIN - badgeWidth,
    y: PAGE_HEIGHT - 63,
    width: badgeWidth,
    height: 30,
    color: stateColor,
    borderColor: stateColor,
    borderWidth: 0.5,
  });

  drawCenteredText(page, estado, {
    x: PAGE_WIDTH - MARGIN - badgeWidth,
    y: PAGE_HEIGHT - 52,
    width: badgeWidth,
    size: 8,
    font: bold,
    color: NAVY,
  });

  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 90 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 90 },
    thickness: 0.8,
    color: BORDER,
  });
}

function drawFooter(
  page: PDFPage,
  normal: PDFFont,
  bold: PDFFont,
  pagina: number,
  total: number,
) {
  page.drawLine({
    start: { x: MARGIN, y: 24 },
    end: { x: PAGE_WIDTH - MARGIN, y: 24 },
    thickness: 0.6,
    color: BORDER,
  });

  page.drawText("AC-911 | Departamento de Compras", {
    x: MARGIN,
    y: 11,
    size: 6.5,
    font: normal,
    color: MUTED,
  });

  const texto = `Pagina ${pagina} de ${total}`;
  const ancho = bold.widthOfTextAtSize(texto, 6.5);

  page.drawText(texto, {
    x: PAGE_WIDTH - MARGIN - ancho,
    y: 11,
    size: 6.5,
    font: bold,
    color: CYAN,
  });
}

function drawSummaryCard(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    title: string;
    value: string;
    accent: PdfColor;
    normal: PDFFont;
    bold: PDFFont;
  },
) {
  page.drawRectangle({
    x: options.x,
    y: options.y,
    width: options.width,
    height: 54,
    color: CARD,
    borderColor: BORDER,
    borderWidth: 0.7,
  });

  page.drawRectangle({
    x: options.x,
    y: options.y + 50,
    width: options.width,
    height: 4,
    color: options.accent,
  });

  page.drawText(options.title.toUpperCase(), {
    x: options.x + 12,
    y: options.y + 34,
    size: 6.2,
    font: options.bold,
    color: MUTED,
  });

  page.drawText(truncate(options.value, 25), {
    x: options.x + 12,
    y: options.y + 13,
    size: 10,
    font: options.bold,
    color: WHITE,
  });
}

function drawSectionTitle(
  page: PDFPage,
  title: string,
  y: number,
  bold: PDFFont,
) {
  page.drawText(title.toUpperCase(), {
    x: MARGIN,
    y,
    size: 9,
    font: bold,
    color: CYAN,
  });

  page.drawLine({
    start: { x: MARGIN, y: y - 7 },
    end: { x: PAGE_WIDTH - MARGIN, y: y - 7 },
    thickness: 0.7,
    color: BORDER,
  });

  return y - 18;
}

function drawPurchaseTableHeader(
  page: PDFPage,
  y: number,
  bold: PDFFont,
) {
  const columns = [
    { title: "Tipo", x: MARGIN, width: 90 },
    { title: "Descripcion", x: MARGIN + 90, width: 300 },
    { title: "Cant.", x: MARGIN + 390, width: 70 },
    { title: "Precio", x: MARGIN + 460, width: 145 },
    { title: "Subtotal", x: MARGIN + 605, width: CONTENT_WIDTH - 605 },
  ];

  page.drawRectangle({
    x: MARGIN,
    y: y - 25,
    width: CONTENT_WIDTH,
    height: 25,
    color: HEADER,
    borderColor: BORDER,
    borderWidth: 0.5,
  });

  columns.forEach((column) => {
    page.drawText(column.title.toUpperCase(), {
      x: column.x + 6,
      y: y - 16,
      size: 6.5,
      font: bold,
      color: WHITE,
    });
  });

  return columns;
}

function drawPurchaseRow(
  page: PDFPage,
  options: {
    y: number;
    index: number;
    item: {
      tipo: string;
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    };
    columns: Array<{ title: string; x: number; width: number }>;
    normal: PDFFont;
    bold: PDFFont;
  },
) {
  page.drawRectangle({
    x: MARGIN,
    y: options.y - ROW_HEIGHT,
    width: CONTENT_WIDTH,
    height: ROW_HEIGHT,
    color: options.index % 2 === 0 ? CARD : CARD_ALT,
    borderColor: BORDER,
    borderWidth: 0.25,
  });

  const values = [
    { text: options.item.tipo, max: 16, color: TEXT, bold: false },
    {
      text: options.item.descripcion,
      max: 52,
      color: CYAN,
      bold: true,
    },
    {
      text: String(options.item.cantidad),
      max: 10,
      color: TEXT,
      bold: false,
    },
    {
      text: dinero(options.item.precioUnitario),
      max: 22,
      color: TEXT,
      bold: false,
    },
    {
      text: dinero(options.item.subtotal),
      max: 22,
      color: WHITE,
      bold: true,
    },
  ];

  values.forEach((value, index) => {
    const column = options.columns[index];
    const font = value.bold ? options.bold : options.normal;
    const text = truncate(value.text, value.max);
    const size = 6.8;

    if (index >= 3) {
      const width = font.widthOfTextAtSize(text, size);

      page.drawText(text, {
        x: column.x + column.width - width - 7,
        y: options.y - 18,
        size,
        font,
        color: value.color,
      });

      return;
    }

    page.drawText(text, {
      x: column.x + 6,
      y: options.y - 18,
      size,
      font,
      color: value.color,
    });
  });
}

function drawTotalCard(
  page: PDFPage,
  y: number,
  total: number,
  bold: PDFFont,
) {
  const width = 270;
  const x = PAGE_WIDTH - MARGIN - width;

  page.drawRectangle({
    x,
    y: y - 52,
    width,
    height: 52,
    color: CARD,
    borderColor: BORDER,
    borderWidth: 0.8,
  });

  page.drawText("TOTAL DE LA ORDEN", {
    x: x + 14,
    y: y - 20,
    size: 6.5,
    font: bold,
    color: MUTED,
  });

  const totalText = dinero(total);
  const widthText = bold.widthOfTextAtSize(totalText, 14);

  page.drawText(totalText, {
    x: x + width - widthText - 14,
    y: y - 39,
    size: 14,
    font: bold,
    color: WHITE,
  });
}

function drawHistoryItem(
  page: PDFPage,
  options: {
    y: number;
    evento: {
      tipo: string;
      descripcion: string | null;
      creadoEn: Date;
      usuario: string | null;
    };
    index: number;
    normal: PDFFont;
    bold: PDFFont;
  },
) {
  const height = 38;

  page.drawRectangle({
    x: MARGIN,
    y: options.y - height,
    width: CONTENT_WIDTH,
    height,
    color: options.index % 2 === 0 ? CARD : CARD_ALT,
    borderColor: BORDER,
    borderWidth: 0.45,
  });

  page.drawText(
    truncate(options.evento.descripcion ?? options.evento.tipo, 78),
    {
      x: MARGIN + 12,
      y: options.y - 15,
      size: 7.4,
      font: options.bold,
      color: WHITE,
    },
  );

  page.drawText(
    `${options.evento.usuario ?? "Usuario no disponible"} | ${fechaHoraGuatemala(
      options.evento.creadoEn,
    )}`,
    {
      x: MARGIN + 12,
      y: options.y - 29,
      size: 6.6,
      font: options.normal,
      color: MUTED,
    },
  );

  return height;
}

export async function GET(request: Request, { params }: Props) {
  await requerirAdmin();

  const { id } = await params;
  const ordenId = Number(id);

  if (!Number.isInteger(ordenId) || ordenId <= 0) {
    return new Response("Orden no valida.", { status: 400 });
  }

  const [orden] = await db
    .select({
      id: ordenesCompra.id,
      codigo: ordenesCompra.codigo,
      fechaCompra: ordenesCompra.fechaCompra,
      creadoEn: ordenesCompra.creadoEn,
      completadaEn: ordenesCompra.completadaEn,
      motivo: ordenesCompra.motivo,
      facturaReferencia: ordenesCompra.facturaReferencia,
      observaciones: ordenesCompra.observaciones,
      estado: ordenesCompra.estado,
      total: ordenesCompra.total,
      proveedor: proveedores.nombreComercial,
      proveedorCodigo: proveedores.codigo,
      nit: proveedores.nit,
    })
    .from(ordenesCompra)
    .innerJoin(proveedores, eq(ordenesCompra.proveedorId, proveedores.id))
    .where(eq(ordenesCompra.id, ordenId))
    .limit(1);

  if (!orden) {
    return new Response("Orden no encontrada.", { status: 404 });
  }

  const [items, eventos] = await Promise.all([
    db
      .select({
        id: ordenCompraItems.id,
        tipo: ordenCompraItems.tipo,
        descripcion: ordenCompraItems.descripcion,
        cantidad: ordenCompraItems.cantidad,
        precioUnitario: ordenCompraItems.precioUnitario,
        subtotal: ordenCompraItems.subtotal,
      })
      .from(ordenCompraItems)
      .where(eq(ordenCompraItems.ordenCompraId, ordenId))
      .orderBy(asc(ordenCompraItems.orden)),

    db
      .select({
        id: ordenCompraEventos.id,
        tipo: ordenCompraEventos.tipo,
        descripcion: ordenCompraEventos.descripcion,
        creadoEn: ordenCompraEventos.creadoEn,
        usuario: usuarios.nombre,
      })
      .from(ordenCompraEventos)
      .leftJoin(usuarios, eq(ordenCompraEventos.usuarioId, usuarios.id))
      .where(eq(ordenCompraEventos.ordenCompraId, ordenId))
      .orderBy(desc(ordenCompraEventos.creadoEn)),
  ]);

  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(pdf);

  pdf.setTitle(`Orden de compra ${orden.codigo}`);
  pdf.setAuthor("AC-911");
  pdf.setSubject(`Orden de compra ${orden.codigo}`);
  pdf.setCreator("Sistema Administrativo AC-911");

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  drawHeader(page, logo, normal, bold, orden.codigo, orden.estado);

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page, logo, normal, bold, orden.codigo, orden.estado);
    return 472;
  };

  // Resumen superior.
  const summaryY = 438;
  const summaryGap = 12;
  const summaryWidth = (CONTENT_WIDTH - summaryGap * 3) / 4;

  const summaryCards = [
    {
      title: "Proveedor",
      value: orden.proveedor,
      accent: CYAN,
    },
    {
      title: "Fecha",
      value: fechaCompra(orden.fechaCompra),
      accent: PURPLE,
    },
    {
      title: "Hora Guatemala",
      value: horaGuatemala(orden.creadoEn),
      accent: GREEN,
    },
    {
      title: "Total",
      value: dinero(orden.total),
      accent: ORANGE,
    },
  ];

  summaryCards.forEach((card, index) => {
    drawSummaryCard(page, {
      x: MARGIN + index * (summaryWidth + summaryGap),
      y: summaryY,
      width: summaryWidth,
      title: card.title,
      value: card.value,
      accent: card.accent,
      normal,
      bold,
    });
  });

  // Información adicional, sin cajas amarillas.
  let y = 414;

  page.drawText(`NIT: ${orden.nit}`, {
    x: MARGIN,
    y,
    size: 7.2,
    font: normal,
    color: MUTED,
  });

  page.drawText(`Motivo: ${truncate(orden.motivo, 58)}`, {
    x: MARGIN + 175,
    y,
    size: 7.2,
    font: normal,
    color: MUTED,
  });

  page.drawText(
    `Factura / referencia: ${orden.facturaReferencia ?? "Sin referencia"}`,
    {
      x: MARGIN + 500,
      y,
      size: 7.2,
      font: normal,
      color: MUTED,
    },
  );

  if (orden.completadaEn) {
    page.drawText(`Completada: ${fechaHoraGuatemala(orden.completadaEn)}`, {
      x: MARGIN,
      y: y - 15,
      size: 7,
      font: normal,
      color: GREEN,
    });
  }

  y -= 38;
  y = drawSectionTitle(page, "Detalle de compra", y, bold);

  let columns = drawPurchaseTableHeader(page, y, bold);
  y -= 25;

  if (items.length === 0) {
    page.drawText("No hay items registrados para esta orden.", {
      x: MARGIN + 8,
      y: y - 22,
      size: 7.5,
      font: normal,
      color: MUTED,
    });

    y -= 38;
  } else {
    for (let index = 0; index < items.length; index += 1) {
      if (y - ROW_HEIGHT < 90) {
        y = newPage();
        y = drawSectionTitle(page, "Detalle de compra - continuacion", y, bold);
        columns = drawPurchaseTableHeader(page, y, bold);
        y -= 25;
      }

      drawPurchaseRow(page, {
        y,
        index,
        item: items[index],
        columns,
        normal,
        bold,
      });

      y -= ROW_HEIGHT;
    }
  }

  y -= 14;

  if (y < 116) {
    y = newPage();
  }

  drawTotalCard(page, y, orden.total, bold);
  y -= 70;

  if (orden.observaciones) {
    if (y < 92) {
      y = newPage();
    }

    page.drawRectangle({
      x: MARGIN,
      y: y - 48,
      width: CONTENT_WIDTH,
      height: 48,
      color: CARD,
      borderColor: BORDER,
      borderWidth: 0.6,
    });

    page.drawText("OBSERVACIONES", {
      x: MARGIN + 12,
      y: y - 16,
      size: 6.5,
      font: bold,
      color: CYAN,
    });

    page.drawText(truncate(orden.observaciones, 115), {
      x: MARGIN + 12,
      y: y - 34,
      size: 7,
      font: normal,
      color: TEXT,
    });

    y -= 64;
  }

  if (y < 100) {
    y = newPage();
  }

  y = drawSectionTitle(page, "Historial de la orden", y, bold);

  if (eventos.length === 0) {
    page.drawText("No hay movimientos registrados para esta orden.", {
      x: MARGIN + 8,
      y: y - 22,
      size: 7.5,
      font: normal,
      color: MUTED,
    });
  } else {
    for (let index = 0; index < eventos.length; index += 1) {
      if (y - 38 < 48) {
        y = newPage();
        y = drawSectionTitle(page, "Historial de la orden - continuacion", y, bold);
      }

      const height = drawHistoryItem(page, {
        y,
        evento: eventos[index],
        index,
        normal,
        bold,
      });

      y -= height + 7;
    }
  }

  const pages = pdf.getPages();

  pages.forEach((current, index) => {
    drawFooter(current, normal, bold, index + 1, pages.length);
  });

  const bytes = await pdf.save();
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const fileName = sanitizeFileName(`orden-${orden.codigo}-dark`);

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${
        fileName || `orden-${orden.id}-dark`
      }.pdf"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}