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
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  clientes,
  cotizaciones,
  cotizacionItems,
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
const ORANGE_LIGHT = rgb(1, 0.96, 0.90);
const PURPLE_LIGHT = rgb(0.96, 0.93, 1);

function money(valueInCents: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(valueInCents / 100);
}

function formatDate(value: Date | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function safeText(value: string | null | undefined) {
  return value?.trim() || "No registrado";
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
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
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

  const lineHeight =
    options.lineHeight ?? options.size + 3;

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

function drawRoundedCard(
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

function drawLabelValue(
  page: PDFPage,
  label: string,
  value: string,
  options: {
    x: number;
    y: number;
    labelWidth?: number;
    valueWidth?: number;
    normal: PDFFont;
    bold: PDFFont;
  },
) {
  page.drawText(label, {
    x: options.x,
    y: options.y,
    size: 8.5,
    font: options.bold,
    color: BLUE,
  });

  page.drawText(value, {
    x: options.x + (options.labelWidth ?? 92),
    y: options.y,
    size: 8.5,
    font: options.normal,
    color: TEXT,
    maxWidth: options.valueWidth ?? 170,
  });
}

async function loadLogo(pdf: PDFDocument): Promise<PDFImage | null> {
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
    drawRoundedCard(page, {
      x: MARGIN,
      y: top - logoHeight,
      width: logoWidth,
      height: logoHeight,
      color: BLUE_LIGHT,
      borderColor: BLUE,
    });

    page.drawText("AC-911", {
      x: MARGIN + 41,
      y: top - 48,
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

  const details = [
    "Guatemala, Zona 11, Col. Roosevelt",
    "Teléfono: 2267-4000",
    "Email: proyectos@ac-911.com",
  ];

  details.forEach((detail, index) => {
    page.drawText(detail, {
      x: companyX,
      y: top - 31 - index * 15,
      size: 8.5,
      font: normal,
      color: TEXT,
    });
  });

  page.drawText(code, {
    x: PAGE_WIDTH - MARGIN - 104,
    y: top - 17,
    size: 14,
    font: bold,
    color: BLUE,
  });

  page.drawText("Cotización Comercial", {
    x: PAGE_WIDTH - MARGIN - 112,
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

  page.drawText("INFORME DE COTIZACIÓN", {
    x: 194,
    y: top - logoHeight - 37,
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

  page.drawText("AC-911", {
    x: 286,
    y: 20,
    size: 8,
    font: bold,
    color: BLUE,
  });

  page.drawText("Departamento Comercial", {
    x: 258,
    y: 10,
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

function itemTypeStyle(type: string) {
  if (type === "PRODUCTO") {
    return {
      label: "Producto",
      background: BLUE_LIGHT,
      color: BLUE,
    };
  }

  if (type === "SERVICIO") {
    return {
      label: "Servicio",
      background: GREEN_LIGHT,
      color: rgb(0.08, 0.48, 0.24),
    };
  }

  return {
    label: "Costo adicional",
    background: ORANGE_LIGHT,
    color: rgb(0.75, 0.34, 0.02),
  };
}

export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  await requerirAdmin();

  const { id } = await params;
  const quotationId = Number(id);

  if (
    !Number.isInteger(quotationId) ||
    quotationId <= 0
  ) {
    return new Response("Cotización no válida.", {
      status: 400,
    });
  }

  const [quotation] = await db
    .select({
      id: cotizaciones.id,
      codigo: cotizaciones.codigo,
      titulo: cotizaciones.titulo,
      colaborador: cotizaciones.colaborador,
      fechaSolicitud: cotizaciones.fechaSolicitud,
      validaHasta: cotizaciones.validaHasta,
      diasVigencia: cotizaciones.diasVigencia,
      estado: cotizaciones.estado,
      observaciones: cotizaciones.observaciones,
      condicionesPago: cotizaciones.condicionesPago,
      porcentajeAnticipo:
        cotizaciones.porcentajeAnticipo,
      porcentajeFinal: cotizaciones.porcentajeFinal,
      incluyeIva: cotizaciones.incluyeIva,
      subtotalProductos:
        cotizaciones.subtotalProductos,
      subtotalServicios:
        cotizaciones.subtotalServicios,
      subtotalCostosAdicionales:
        cotizaciones.subtotalCostosAdicionales,
      total: cotizaciones.total,
      clienteNombre: clientes.nombre,
    })
    .from(cotizaciones)
    .innerJoin(
      clientes,
      eq(cotizaciones.clienteId, clientes.id),
    )
    .where(eq(cotizaciones.id, quotationId))
    .limit(1);

  if (!quotation) {
    return new Response(
      "Cotización no encontrada.",
      { status: 404 },
    );
  }

  const items = await db
    .select({
      id: cotizacionItems.id,
      tipo: cotizacionItems.tipo,
      nombre: cotizacionItems.nombre,
      descripcion: cotizacionItems.descripcion,
      cantidad: cotizacionItems.cantidad,
      precioUnitario: cotizacionItems.precioUnitario,
      subtotal: cotizacionItems.subtotal,
      orden: cotizacionItems.orden,
    })
    .from(cotizacionItems)
    .where(
      eq(cotizacionItems.cotizacionId, quotationId),
    )
    .orderBy(
      asc(cotizacionItems.orden),
      asc(cotizacionItems.id),
    );

  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(
    StandardFonts.Helvetica,
  );
  const bold = await pdf.embedFont(
    StandardFonts.HelveticaBold,
  );
  const logo = await loadLogo(pdf);

  pdf.setTitle(`Cotización ${quotation.codigo}`);
  pdf.setAuthor("AC-911");
  pdf.setSubject(quotation.titulo);
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
    quotation.codigo,
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
      quotation.codigo,
    );
  };

  const ensureSpace = (height: number) => {
    if (y - height < 55) {
      newPage();
    }
  };

  // Información general
  const infoHeight = 92;

  drawRoundedCard(page, {
    x: MARGIN,
    y: y - infoHeight,
    width: CONTENT_WIDTH,
    height: infoHeight,
    color: WHITE,
    borderColor: BORDER,
  });

  const middle = MARGIN + CONTENT_WIDTH / 2;

  page.drawLine({
    start: {
      x: middle,
      y: y - infoHeight + 12,
    },
    end: {
      x: middle,
      y: y - 12,
    },
    thickness: 0.6,
    color: BORDER,
  });

  drawLabelValue(
    page,
    "Cliente:",
    safeText(quotation.clienteNombre),
    {
      x: MARGIN + 14,
      y: y - 22,
      normal,
      bold,
      labelWidth: 72,
      valueWidth: 170,
    },
  );

  drawLabelValue(
    page,
    "Colaborador:",
    safeText(quotation.colaborador),
    {
      x: MARGIN + 14,
      y: y - 45,
      normal,
      bold,
      labelWidth: 72,
      valueWidth: 170,
    },
  );

  drawLabelValue(
    page,
    "Trabajo:",
    quotation.titulo,
    {
      x: MARGIN + 14,
      y: y - 68,
      normal,
      bold,
      labelWidth: 72,
      valueWidth: 174,
    },
  );

  drawLabelValue(
    page,
    "Fecha:",
    formatDate(quotation.fechaSolicitud),
    {
      x: middle + 14,
      y: y - 22,
      normal,
      bold,
      labelWidth: 93,
      valueWidth: 125,
    },
  );

  drawLabelValue(
    page,
    "Vigencia:",
    `${quotation.diasVigencia} días`,
    {
      x: middle + 14,
      y: y - 45,
      normal,
      bold,
      labelWidth: 93,
      valueWidth: 125,
    },
  );

  drawLabelValue(
    page,
    "Vencimiento:",
    formatDate(quotation.validaHasta),
    {
      x: middle + 14,
      y: y - 68,
      normal,
      bold,
      labelWidth: 93,
      valueWidth: 125,
    },
  );

  y -= infoHeight + 16;

  // Tabla
  const columns = {
    typeX: MARGIN,
    typeW: 88,
    descriptionX: MARGIN + 88,
    descriptionW: 240,
    quantityX: MARGIN + 328,
    quantityW: 66,
    unitX: MARGIN + 394,
    unitW: 82,
    subtotalX: MARGIN + 476,
    subtotalW: 80,
  };

  const drawTableHeader = () => {
    const headerHeight = 25;

    page.drawRectangle({
      x: MARGIN,
      y: y - headerHeight,
      width: CONTENT_WIDTH,
      height: headerHeight,
      color: BLUE,
    });

    const headers = [
      ["TIPO", columns.typeX, columns.typeW],
      [
        "DESCRIPCIÓN",
        columns.descriptionX,
        columns.descriptionW,
      ],
      [
        "CANTIDAD",
        columns.quantityX,
        columns.quantityW,
      ],
      [
        "VALOR UNITARIO",
        columns.unitX,
        columns.unitW,
      ],
      [
        "SUBTOTAL",
        columns.subtotalX,
        columns.subtotalW,
      ],
    ] as const;

    headers.forEach(([label, x, width]) => {
      const textWidth =
        bold.widthOfTextAtSize(label, 7.2);

      page.drawText(label, {
        x: x + (width - textWidth) / 2,
        y: y - 16,
        size: 7.2,
        font: bold,
        color: WHITE,
      });

      if (x !== MARGIN) {
        page.drawLine({
          start: { x, y },
          end: { x, y: y - headerHeight },
          thickness: 0.5,
          color: WHITE,
          opacity: 0.45,
        });
      }
    });

    y -= headerHeight;
  };

  drawTableHeader();

  for (const item of items) {
    const description = [
      item.nombre,
      item.descripcion ?? "",
    ]
      .filter(Boolean)
      .join("\n");

    const descriptionLines = wrapText(
      description,
      normal,
      8,
      columns.descriptionW - 16,
    );

    const rowHeight = Math.max(
      43,
      descriptionLines.length * 11 + 14,
    );

    if (y - rowHeight < 60) {
      newPage();
      drawTableHeader();
    }

    page.drawRectangle({
      x: MARGIN,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color:
        item.orden % 2 === 0 ? LIGHT : WHITE,
      borderColor: BORDER,
      borderWidth: 0.5,
    });

    [
      columns.descriptionX,
      columns.quantityX,
      columns.unitX,
      columns.subtotalX,
    ].forEach((x) => {
      page.drawLine({
        start: { x, y },
        end: { x, y: y - rowHeight },
        thickness: 0.5,
        color: BORDER,
      });
    });

    const style = itemTypeStyle(item.tipo);

    page.drawRectangle({
      x: columns.typeX + 10,
      y: y - 29,
      width: columns.typeW - 20,
      height: 18,
      color: style.background,
    });

    const typeWidth = bold.widthOfTextAtSize(
      style.label,
      7.2,
    );

    page.drawText(style.label, {
      x:
        columns.typeX +
        (columns.typeW - typeWidth) / 2,
      y: y - 23,
      size: 7.2,
      font: bold,
      color: style.color,
    });

    drawWrappedText(page, description, {
      x: columns.descriptionX + 8,
      y: y - 16,
      width: columns.descriptionW - 16,
      font: normal,
      size: 8,
      lineHeight: 11,
    });

    const quantity = String(item.cantidad);
    const quantityWidth =
      normal.widthOfTextAtSize(quantity, 8.5);

    page.drawText(quantity, {
      x:
        columns.quantityX +
        (columns.quantityW - quantityWidth) / 2,
      y: y - 24,
      size: 8.5,
      font: normal,
      color: TEXT,
    });

    const unitPrice = money(item.precioUnitario);
    const unitPriceWidth =
      normal.widthOfTextAtSize(unitPrice, 8);

    page.drawText(unitPrice, {
      x:
        columns.unitX +
        columns.unitW -
        unitPriceWidth -
        7,
      y: y - 24,
      size: 8,
      font: normal,
      color: TEXT,
    });

    const subtotal = money(item.subtotal);
    const subtotalWidth =
      bold.widthOfTextAtSize(subtotal, 8);

    page.drawText(subtotal, {
      x:
        columns.subtotalX +
        columns.subtotalW -
        subtotalWidth -
        7,
      y: y - 24,
      size: 8,
      font: bold,
      color: TEXT,
    });

    y -= rowHeight;
  }

  y -= 12;

  // Resumen
  ensureSpace(115);

  const summaryWidth = 220;
  const summaryHeight = 102;
  const summaryX =
    PAGE_WIDTH - MARGIN - summaryWidth;

  drawRoundedCard(page, {
    x: summaryX,
    y: y - summaryHeight,
    width: summaryWidth,
    height: summaryHeight,
    color: WHITE,
    borderColor: BORDER,
  });

  const summaryRows = [
    [
      "Productos:",
      money(quotation.subtotalProductos),
    ],
    [
      "Servicios:",
      money(quotation.subtotalServicios),
    ],
    [
      "Costos adicionales:",
      money(
        quotation.subtotalCostosAdicionales,
      ),
    ],
  ];

  let summaryY = y - 20;

  summaryRows.forEach(([label, value]) => {
    page.drawText(label, {
      x: summaryX + 14,
      y: summaryY,
      size: 8.5,
      font: bold,
      color: BLUE,
    });

    const valueWidth =
      normal.widthOfTextAtSize(value, 8.5);

    page.drawText(value, {
      x:
        summaryX +
        summaryWidth -
        valueWidth -
        14,
      y: summaryY,
      size: 8.5,
      font: normal,
      color: TEXT,
    });

    summaryY -= 20;
  });

  page.drawLine({
    start: {
      x: summaryX + 12,
      y: summaryY + 7,
    },
    end: {
      x: summaryX + summaryWidth - 12,
      y: summaryY + 7,
    },
    thickness: 0.8,
    color: BORDER,
  });

  page.drawText("TOTAL:", {
    x: summaryX + 14,
    y: summaryY - 8,
    size: 10.5,
    font: bold,
    color: BLUE,
  });

  const totalText = money(quotation.total);
  const totalWidth =
    bold.widthOfTextAtSize(totalText, 11);

  page.drawText(totalText, {
    x:
      summaryX +
      summaryWidth -
      totalWidth -
      14,
    y: summaryY - 8,
    size: 11,
    font: bold,
    color: TEXT,
  });

  y -= summaryHeight + 18;

  // Condiciones y observaciones
  ensureSpace(160);

  const gap = 12;
  const boxWidth = (CONTENT_WIDTH - gap) / 2;

  const conditions =
    quotation.condicionesPago ||
    `• Anticipo del ${quotation.porcentajeAnticipo}% para iniciar el proyecto.
• Saldo restante del ${quotation.porcentajeFinal}% al finalizar.
• Cotización válida por ${quotation.diasVigencia} días.
• El total ${quotation.incluyeIva ? "incluye" : "no incluye"} IVA.`;

  const observations =
    quotation.observaciones ||
    "Cotización válida por el tiempo indicado.\nPrecios y disponibilidad sujetos a cambios sin previo aviso.";

  const conditionLines = wrapText(
    conditions,
    normal,
    8,
    boxWidth - 24,
  );

  const observationLines = wrapText(
    observations,
    normal,
    8,
    boxWidth - 24,
  );

  const boxHeight = Math.max(
    115,
    Math.max(
      conditionLines.length,
      observationLines.length,
    ) *
      11 +
      42,
  );

  if (y - boxHeight < 55) {
    newPage();
  }

  drawRoundedCard(page, {
    x: MARGIN,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: WHITE,
    borderColor: BORDER,
  });

  drawRoundedCard(page, {
    x: MARGIN + boxWidth + gap,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: WHITE,
    borderColor: BORDER,
  });

  page.drawText(
    "CONDICIONES DE PAGO Y ENTREGA",
    {
      x: MARGIN + 12,
      y: y - 20,
      size: 8.5,
      font: bold,
      color: BLUE,
    },
  );

  page.drawText("OBSERVACIONES", {
    x: MARGIN + boxWidth + gap + 12,
    y: y - 20,
    size: 8.5,
    font: bold,
    color: BLUE,
  });

  drawWrappedText(page, conditions, {
    x: MARGIN + 12,
    y: y - 40,
    width: boxWidth - 24,
    font: bold,
    size: 8,
    lineHeight: 11,
  });

  drawWrappedText(page, observations, {
    x: MARGIN + boxWidth + gap + 12,
    y: y - 40,
    width: boxWidth - 24,
    font: normal,
    size: 8,
    lineHeight: 11,
  });

  y -= boxHeight + 32;

  // Firma
  if (y < 92) {
    newPage();
  }

  page.drawLine({
    start: {
      x: PAGE_WIDTH / 2 - 82,
      y: y,
    },
    end: {
      x: PAGE_WIDTH / 2 + 82,
      y,
    },
    thickness: 0.8,
    color: MUTED,
  });

  page.drawText("AC-911", {
    x: PAGE_WIDTH / 2 - 15,
    y: y - 17,
    size: 9,
    font: bold,
    color: BLUE,
  });

  page.drawText("Departamento Comercial", {
    x: PAGE_WIDTH / 2 - 49,
    y: y - 32,
    size: 8,
    font: normal,
    color: TEXT,
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
  const download =
    url.searchParams.get("download") === "1";

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="${quotation.codigo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}