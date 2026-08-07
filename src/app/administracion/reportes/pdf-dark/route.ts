import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFImage,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import {
  esEstadoOrdenCompra,
  formatearDineroReporte,
  formatearFechaReporte,
  obtenerReporteCompras,
} from "@/lib/reportes-compras";
import { requerirAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

const MARGIN = 34;
const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

const NAVY = rgb(
  0.027,
  0.078,
  0.149,
);

const NAVY_CARD = rgb(
  0.043,
  0.118,
  0.208,
);

const NAVY_CARD_2 = rgb(
  0.055,
  0.145,
  0.247,
);

const CYAN = rgb(
  0.024,
  0.714,
  0.831,
);

const BLUE = rgb(
  0.145,
  0.388,
  0.922,
);

const PURPLE = rgb(
  0.576,
  0.200,
  0.918,
);

const GREEN = rgb(
  0.020,
  0.588,
  0.412,
);

const ORANGE = rgb(
  0.918,
  0.345,
  0.047,
);

const RED = rgb(
  0.863,
  0.149,
  0.149,
);

const AMBER = rgb(
  0.961,
  0.620,
  0.043,
);

const WHITE = rgb(
  1,
  1,
  1,
);

const TEXT_LIGHT = rgb(
  0.949,
  0.961,
  0.976,
);

const MUTED = rgb(
  0.580,
  0.639,
  0.722,
);

const BORDER = rgb(
  0.122,
  0.231,
  0.365,
);

const GRID = rgb(
  0.110,
  0.212,
  0.337,
);

type PdfColor =
  ReturnType<typeof rgb>;

type ChartRow = {
  label: string;
  value: number;
  valueText: string;
};

function truncate(
  text: string,
  length: number,
) {
  if (
    text.length <= length
  ) {
    return text;
  }

  return `${text.slice(
    0,
    Math.max(
      1,
      length - 3,
    ),
  )}...`;
}

function sanitizeFileName(
  value: string,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-zA-Z0-9_-]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    )
    .slice(0, 90);
}

function formatAxisValue(
  value: number,
  money = false,
) {
  let result = "";

  if (
    value >= 1_000_000
  ) {
    const millions =
      value / 1_000_000;

    result = `${
      millions >= 10
        ? millions.toFixed(0)
        : millions.toFixed(1)
    }M`;
  } else if (
    value >= 1_000
  ) {
    const thousands =
      value / 1_000;

    result = `${
      thousands >= 10
        ? thousands.toFixed(0)
        : thousands.toFixed(1)
    }K`;
  } else {
    result =
      value < 10
        ? value.toFixed(1)
        : value.toFixed(0);
  }

  result = result.replace(
    /\.0(?=[KM]?$)/,
    "",
  );

  return money
    ? `Q ${result}`
    : result;
}

function estadoLabel(
  estado: string,
) {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "APROBADA":
      return "Aprobada";
    case "COMPLETADA":
      return "Completada";
    case "CANCELADA":
      return "Cancelada";
    default:
      return estado;
  }
}

function estadoColor(
  estado: string,
) {
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

async function loadLogo(
  pdf: PDFDocument,
): Promise<PDFImage | null> {
  const candidates = [
    {
      file: path.join(
        process.cwd(),
        "public",
        "img",
        "logo-ac911.jpeg",
      ),
      type: "jpg",
    },
    {
      file: path.join(
        process.cwd(),
        "public",
        "img",
        "logo-ac911.jpg",
      ),
      type: "jpg",
    },
    {
      file: path.join(
        process.cwd(),
        "public",
        "img",
        "logo-ac911.png",
      ),
      type: "png",
    },
  ] as const;

  for (
    const candidate of
    candidates
  ) {
    try {
      const bytes =
        await readFile(
          candidate.file,
        );

      return candidate.type ===
        "png"
        ? await pdf.embedPng(
            bytes,
          )
        : await pdf.embedJpg(
            bytes,
          );
    } catch {
      // Probar el siguiente logo.
    }
  }

  return null;
}

function drawPageBackground(
  page: PDFPage,
) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: NAVY,
  });
}

function drawHeader(
  page: PDFPage,
  logo: PDFImage | null,
  normal: PDFFont,
  bold: PDFFont,
  options: {
    title: string;
    subtitle: string;
    badge?: string;
  },
) {
  drawPageBackground(page);

  if (logo) {
    page.drawImage(logo, {
      x: MARGIN,
      y:
        PAGE_HEIGHT -
        76,
      width: 104,
      height: 48,
    });
  } else {
    page.drawRectangle({
      x: MARGIN,
      y:
        PAGE_HEIGHT -
        74,
      width: 104,
      height: 44,
      color: NAVY_CARD,
      borderColor: CYAN,
      borderWidth: 0.8,
    });

    page.drawText(
      "AC-911",
      {
        x: MARGIN + 23,
        y:
          PAGE_HEIGHT -
          58,
        size: 17,
        font: bold,
        color: CYAN,
      },
    );
  }

  page.drawText(
    options.title,
    {
      x: MARGIN + 122,
      y:
        PAGE_HEIGHT -
        46,
      size: 19,
      font: bold,
      color: WHITE,
    },
  );

  page.drawText(
    truncate(
      options.subtitle,
      78,
    ),
    {
      x: MARGIN + 122,
      y:
        PAGE_HEIGHT -
        65,
      size: 8.2,
      font: normal,
      color: MUTED,
    },
  );

  if (options.badge) {
    const badgeText =
      options.badge.toUpperCase();

    const badgeWidth =
      Math.max(
        118,
        bold.widthOfTextAtSize(
          badgeText,
          8,
        ) + 28,
      );

    page.drawRectangle({
      x:
        PAGE_WIDTH -
        MARGIN -
        badgeWidth,
      y:
        PAGE_HEIGHT -
        61,
      width: badgeWidth,
      height: 27,
      color: CYAN,
      borderColor: CYAN,
      borderWidth: 0.5,
    });

    const textWidth =
      bold.widthOfTextAtSize(
        badgeText,
        8,
      );

    page.drawText(
      badgeText,
      {
        x:
          PAGE_WIDTH -
          MARGIN -
          badgeWidth +
          (badgeWidth -
            textWidth) /
            2,
        y:
          PAGE_HEIGHT -
          51,
        size: 8,
        font: bold,
        color: NAVY,
      },
    );
  }

  page.drawLine({
    start: {
      x: MARGIN,
      y:
        PAGE_HEIGHT -
        88,
    },
    end: {
      x:
        PAGE_WIDTH -
        MARGIN,
      y:
        PAGE_HEIGHT -
        88,
    },
    thickness: 1,
    color: BORDER,
  });
}

function drawFooter(
  page: PDFPage,
  normal: PDFFont,
  bold: PDFFont,
  pageNumber: number,
  totalPages: number,
) {
  page.drawLine({
    start: {
      x: MARGIN,
      y: 24,
    },
    end: {
      x:
        PAGE_WIDTH -
        MARGIN,
      y: 24,
    },
    thickness: 0.6,
    color: BORDER,
  });

  page.drawText(
    "AC-911 | Reporte Ejecutivo de Compras",
    {
      x: MARGIN,
      y: 11,
      size: 6.5,
      font: normal,
      color: MUTED,
    },
  );

  const pageText =
    `Pagina ${pageNumber} de ${totalPages}`;

  const pageTextWidth =
    bold.widthOfTextAtSize(
      pageText,
      6.5,
    );

  page.drawText(
    pageText,
    {
      x:
        PAGE_WIDTH -
        MARGIN -
        pageTextWidth,
      y: 11,
      size: 6.5,
      font: bold,
      color: CYAN,
    },
  );
}

function drawMetricCard(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
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
    height: options.height,
    color: NAVY_CARD,
    borderColor: BORDER,
    borderWidth: 0.7,
  });

  page.drawRectangle({
    x: options.x,
    y:
      options.y +
      options.height -
      4,
    width: options.width,
    height: 4,
    color: options.accent,
  });

  page.drawText(
    options.title.toUpperCase(),
    {
      x: options.x + 12,
      y:
        options.y +
        options.height -
        20,
      size: 6.6,
      font: options.bold,
      color: MUTED,
    },
  );

  page.drawText(
    truncate(
      options.value,
      24,
    ),
    {
      x: options.x + 12,
      y: options.y + 14,
      size: 11.5,
      font: options.bold,
      color: WHITE,
    },
  );
}

function drawLineChart(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    legend: string;
    rows: ChartRow[];
    color: PdfColor;
    normal: PDFFont;
    bold: PDFFont;
    money?: boolean;
    maxRows?: number;
  },
) {
  const rows =
    options.rows.slice(
      0,
      options.maxRows ?? 12,
    );

  page.drawRectangle({
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    color: NAVY_CARD,
    borderColor: BORDER,
    borderWidth: 0.7,
  });

  page.drawText(
    options.title,
    {
      x: options.x + 12,
      y:
        options.y +
        options.height -
        19,
      size: 8.6,
      font: options.bold,
      color: WHITE,
    },
  );

  const legendWidth =
    options.normal.widthOfTextAtSize(
      options.legend,
      6.3,
    );

  const legendX =
    options.x +
    options.width -
    legendWidth -
    50;

  const legendY =
    options.y +
    options.height -
    16;

  page.drawLine({
    start: {
      x: legendX,
      y: legendY + 2,
    },
    end: {
      x: legendX + 28,
      y: legendY + 2,
    },
    thickness: 3,
    color: options.color,
  });

  page.drawText(
    options.legend,
    {
      x: legendX + 34,
      y: legendY,
      size: 6.3,
      font: options.normal,
      color: MUTED,
    },
  );

  if (
    rows.length === 0
  ) {
    page.drawText(
      "Sin datos para graficar.",
      {
        x: options.x + 12,
        y:
          options.y +
          options.height /
            2,
        size: 7.5,
        font: options.normal,
        color: MUTED,
      },
    );

    return;
  }

  const chartX =
    options.x + 45;

  const chartY =
    options.y + 35;

  const chartWidth =
    options.width - 62;

  const chartHeight =
    options.height - 72;

  const maxRaw =
    Math.max(
      ...rows.map(
        (row) => row.value,
      ),
      1,
    );

  const maxValue =
    maxRaw <= 5
      ? Math.max(
          1,
          Math.ceil(
            maxRaw + 1,
          ),
        )
      : maxRaw * 1.10;

  const ticks = 4;

  for (
    let index = 0;
    index <= ticks;
    index += 1
  ) {
    const ratio =
      index / ticks;

    const y =
      chartY +
      ratio *
        chartHeight;

    page.drawLine({
      start: {
        x: chartX,
        y,
      },
      end: {
        x:
          chartX +
          chartWidth,
        y,
      },
      thickness: 0.45,
      color: GRID,
    });

    const value =
      maxValue * ratio;

    const label =
      formatAxisValue(
        value,
        options.money,
      );

    const labelWidth =
      options.normal.widthOfTextAtSize(
        label,
        5.6,
      );

    page.drawText(
      label,
      {
        x:
          chartX -
          labelWidth -
          7,
        y: y - 2,
        size: 5.6,
        font: options.normal,
        color: MUTED,
      },
    );
  }

  page.drawLine({
    start: {
      x: chartX,
      y: chartY,
    },
    end: {
      x: chartX,
      y:
        chartY +
        chartHeight,
    },
    thickness: 0.8,
    color: MUTED,
  });

  page.drawLine({
    start: {
      x: chartX,
      y: chartY,
    },
    end: {
      x:
        chartX +
        chartWidth,
      y: chartY,
    },
    thickness: 0.8,
    color: MUTED,
  });

  const points =
    rows.map(
      (row, index) => {
        const x =
          rows.length === 1
            ? chartX +
              chartWidth / 2
            : chartX +
              (index *
                chartWidth) /
                (rows.length -
                  1);

        const y =
          chartY +
          (row.value /
            maxValue) *
            chartHeight;

        return {
          ...row,
          x,
          y,
        };
      },
    );

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    page.drawLine({
      start: {
        x:
          points[
            index - 1
          ].x,
        y:
          points[
            index - 1
          ].y,
      },
      end: {
        x:
          points[index].x,
        y:
          points[index].y,
      },
      thickness: 2.5,
      color: options.color,
    });
  }

  const showValues =
    points.length <= 6;

  points.forEach(
    (point) => {
      page.drawCircle({
        x: point.x,
        y: point.y,
        size: 3.6,
        color: options.color,
        borderColor: options.color,
        borderWidth: 0.5,
      });

      if (showValues) {
        const valueText =
          truncate(
            point.valueText,
            15,
          );

        const valueWidth =
          options.bold.widthOfTextAtSize(
            valueText,
            5.3,
          );

        page.drawText(
          valueText,
          {
            x:
              point.x -
              valueWidth / 2,
            y:
              Math.min(
                options.y +
                  options.height -
                  31,
                point.y + 7,
              ),
            size: 5.3,
            font: options.bold,
            color: TEXT_LIGHT,
          },
        );
      }

      const label =
        truncate(
          point.label,
          rows.length > 8
            ? 9
            : 13,
        );

      page.drawText(
        label,
        {
          x:
            point.x - 2,
          y: chartY - 11,
          size:
            rows.length > 8
              ? 4.8
              : 5.3,
          font: options.normal,
          color: MUTED,
          rotate: degrees(
            35,
          ),
        },
      );
    },
  );
}

function drawInsightCard(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    lines: string[];
    normal: PDFFont;
    bold: PDFFont;
  },
) {
  page.drawRectangle({
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    color: NAVY_CARD,
    borderColor: BORDER,
    borderWidth: 0.7,
  });

  page.drawText(
    options.title.toUpperCase(),
    {
      x: options.x + 14,
      y:
        options.y +
        options.height -
        21,
      size: 7.3,
      font: options.bold,
      color: CYAN,
    },
  );

  const lineHeight = 15;
  const firstLineY =
    options.y +
    options.height -
    43;

  options.lines
    .slice(0, 4)
    .forEach(
      (
        line,
        index,
      ) => {
        page.drawText(
          truncate(
            line,
            105,
          ),
          {
            x:
              options.x +
              14,
            y:
              firstLineY -
              index *
                lineHeight,
            size: 7.1,
            font:
              index === 0
                ? options.bold
                : options.normal,
            color:
              index === 0
                ? WHITE
                : TEXT_LIGHT,
          },
        );
      },
    );
}

function drawTableHeader(
  page: PDFPage,
  y: number,
  bold: PDFFont,
) {
  page.drawRectangle({
    x: MARGIN,
    y: y - 25,
    width: CONTENT_WIDTH,
    height: 25,
    color: NAVY_CARD_2,
    borderColor: BORDER,
    borderWidth: 0.5,
  });

  const columns = [
    {
      title: "Fecha",
      x: MARGIN,
      width: 70,
    },
    {
      title: "Hora",
      x: MARGIN + 70,
      width: 72,
    },
    {
      title: "Orden",
      x: MARGIN + 142,
      width: 130,
    },
    {
      title: "Proveedor",
      x: MARGIN + 272,
      width: 145,
    },
    {
      title: "Estado",
      x: MARGIN + 417,
      width: 90,
    },
    {
      title: "Motivo",
      x: MARGIN + 507,
      width: 170,
    },
    {
      title: "Total",
      x: MARGIN + 677,
      width: 97,
    },
  ];

  columns.forEach(
    (column) => {
      page.drawText(
        column.title.toUpperCase(),
        {
          x:
            column.x + 6,
          y: y - 16,
          size: 6.2,
          font: bold,
          color: MUTED,
        },
      );
    },
  );

  return columns;
}

function drawOrderRow(
  page: PDFPage,
  options: {
    y: number;
    rowIndex: number;
    order: {
      codigo: string;
      fechaCompra: string;
      creadoEn: Date;
      proveedor: string;
      motivo: string;
      estado: string;
      total: number;
    };
    columns: Array<{
      title: string;
      x: number;
      width: number;
    }>;
    normal: PDFFont;
    bold: PDFFont;
  },
) {
  const rowHeight = 28;

  page.drawRectangle({
    x: MARGIN,
    y:
      options.y -
      rowHeight,
    width: CONTENT_WIDTH,
    height: rowHeight,
    color:
      options.rowIndex % 2 ===
      0
        ? NAVY
        : NAVY_CARD,
    borderColor: BORDER,
    borderWidth: 0.25,
  });

  const hora =
    new Intl.DateTimeFormat(
      "es-GT",
      {
        timeZone:
          "America/Guatemala",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
    ).format(
      options.order
        .creadoEn,
    );

  const values = [
    {
      text:
        formatearFechaReporte(
          options.order
            .fechaCompra,
        ),
      font: options.normal,
      color: TEXT_LIGHT,
      max: 13,
    },
    {
      text: hora,
      font: options.normal,
      color: TEXT_LIGHT,
      max: 12,
    },
    {
      text:
        options.order.codigo,
      font: options.bold,
      color: CYAN,
      max: 22,
    },
    {
      text:
        options.order.proveedor,
      font: options.bold,
      color: WHITE,
      max: 24,
    },
    {
      text:
        estadoLabel(
          options.order.estado,
        ),
      font: options.bold,
      color:
        estadoColor(
          options.order.estado,
        ),
      max: 14,
    },
    {
      text:
        options.order.motivo,
      font: options.normal,
      color: TEXT_LIGHT,
      max: 29,
    },
    {
      text:
        formatearDineroReporte(
          options.order.total,
        ),
      font: options.bold,
      color: WHITE,
      max: 18,
    },
  ];

  values.forEach(
    (
      value,
      index,
    ) => {
      const column =
        options.columns[
          index
        ];

      const text =
        truncate(
          value.text,
          value.max,
        );

      const size =
        index === 6
          ? 6.2
          : 6.0;

      if (index === 6) {
        const width =
          value.font.widthOfTextAtSize(
            text,
            size,
          );

        page.drawText(
          text,
          {
            x:
              column.x +
              column.width -
              width -
              7,
            y:
              options.y -
              18,
            size,
            font: value.font,
            color: value.color,
          },
        );

        return;
      }

      page.drawText(
        text,
        {
          x:
            column.x + 6,
          y:
            options.y -
            18,
          size,
          font: value.font,
          color: value.color,
        },
      );
    },
  );

  return rowHeight;
}

export async function GET(
  request: Request,
) {
  await requerirAdmin();

  const url =
    new URL(request.url);

  const desde =
    url.searchParams
      .get("desde")
      ?.trim() ||
    undefined;

  const hasta =
    url.searchParams
      .get("hasta")
      ?.trim() ||
    undefined;

  const proveedorId =
    Number(
      url.searchParams.get(
        "proveedorId",
      ) ?? "",
    );

  const estadoRaw =
    url.searchParams.get(
      "estado",
    );

  const estado =
    esEstadoOrdenCompra(
      estadoRaw,
    )
      ? estadoRaw
      : undefined;

  const reporte =
    await obtenerReporteCompras({
      desde,
      hasta,
      proveedorId:
        Number.isInteger(
          proveedorId,
        ) &&
        proveedorId > 0
          ? proveedorId
          : undefined,
      estado,
    });

  const pdf =
    await PDFDocument.create();

  const normal =
    await pdf.embedFont(
      StandardFonts.Helvetica,
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold,
    );

  const logo =
    await loadLogo(pdf);

  const periodo =
    desde || hasta
      ? `${desde ?? "Inicio"} a ${
          hasta ??
          "Actualidad"
        }`
      : "Todo el historial";

  const generado =
    new Intl.DateTimeFormat(
      "es-GT",
      {
        timeZone:
          "America/Guatemala",
        dateStyle: "medium",
        timeStyle: "medium",
      },
    ).format(
      new Date(),
    );

  pdf.setTitle(
    `Reporte Ejecutivo de Compras - ${periodo}`,
  );

  pdf.setAuthor("AC-911");

  pdf.setSubject(
    "Reporte ejecutivo de compras",
  );

  pdf.setCreator(
    "Sistema Administrativo AC-911",
  );

  const overviewPage =
    pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  drawHeader(
    overviewPage,
    logo,
    normal,
    bold,
    {
      title:
        "AC-911 / COMPRAS",
      subtitle:
        `Reporte ejecutivo - ${periodo}`,
      badge:
        "Executive Report",
    },
  );

  const metricY = 443;
  const metricHeight = 53;
  const metricGap = 10;

  const metricWidth =
    (CONTENT_WIDTH -
      metricGap * 3) /
    4;

  const metrics = [
    {
      title: "Gasto real",
      value:
        formatearDineroReporte(
          reporte.resumen
            .gastoReal,
        ),
      accent: CYAN,
    },
    {
      title: "Órdenes",
      value: String(
        reporte.resumen
          .totalOrdenes,
      ),
      accent: PURPLE,
    },
    {
      title: "Completadas",
      value: String(
        reporte.resumen
          .completadas,
      ),
      accent: GREEN,
    },
    {
      title: "Promedio compra",
      value:
        formatearDineroReporte(
          reporte.resumen
            .promedioCompra,
        ),
      accent: ORANGE,
    },
  ];

  metrics.forEach(
    (
      metric,
      index,
    ) => {
      drawMetricCard(
        overviewPage,
        {
          x:
            MARGIN +
            index *
              (metricWidth +
                metricGap),
          y: metricY,
          width:
            metricWidth,
          height:
            metricHeight,
          title:
            metric.title,
          value:
            metric.value,
          accent:
            metric.accent,
          normal,
          bold,
        },
      );
    },
  );

  const chartGap = 12;
  const chartWidth =
    (CONTENT_WIDTH -
      chartGap) /
    2;

  drawLineChart(
    overviewPage,
    {
      x: MARGIN,
      y: 246,
      width:
        chartWidth,
      height: 180,
      title:
        "Compras completadas por mes",
      legend:
        "Gasto por mes",
      rows:
        reporte.porMes.map(
          (item) => ({
            label:
              item.etiqueta,
            value:
              item.total /
              100,
            valueText:
              formatearDineroReporte(
                item.total,
              ),
          }),
        ),
      color: CYAN,
      normal,
      bold,
      money: true,
      maxRows: 12,
    },
  );

  drawLineChart(
    overviewPage,
    {
      x:
        MARGIN +
        chartWidth +
        chartGap,
      y: 246,
      width:
        chartWidth,
      height: 180,
      title:
        "Proveedores con mayor gasto",
      legend:
        "Gasto por proveedor",
      rows:
        reporte.porProveedor.map(
          (item) => ({
            label:
              item.proveedor,
            value:
              item.total /
              100,
            valueText:
              formatearDineroReporte(
                item.total,
              ),
          }),
        ),
      color: PURPLE,
      normal,
      bold,
      money: true,
      maxRows: 8,
    },
  );

  drawLineChart(
    overviewPage,
    {
      x: MARGIN,
      y: 46,
      width:
        chartWidth,
      height: 182,
      title:
        "Órdenes por estado",
      legend:
        "Cantidad de órdenes",
      rows:
        reporte.porEstado.map(
          (item) => ({
            label:
              item.etiqueta,
            value:
              item.cantidad,
            valueText:
              `${item.cantidad} (${item.porcentaje}%)`,
          }),
        ),
      color: GREEN,
      normal,
      bold,
      maxRows: 4,
    },
  );

  drawLineChart(
    overviewPage,
    {
      x:
        MARGIN +
        chartWidth +
        chartGap,
      y: 46,
      width:
        chartWidth,
      height: 182,
      title:
        "Artículos más comprados",
      legend:
        "Unidades compradas",
      rows:
        reporte
          .articulosMasComprados
          .map(
            (item) => ({
              label:
                item.descripcion,
              value:
                item.cantidad,
              valueText:
                `${item.cantidad} uds.`,
            }),
          ),
      color: ORANGE,
      normal,
      bold,
      maxRows: 10,
    },
  );

  /*
   * Página de trazabilidad.
   * Si hay muchas órdenes se agregan páginas adicionales
   * manteniendo el mismo tema Dark Executive.
   */

  let detailPage =
    pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  drawHeader(
    detailPage,
    logo,
    normal,
    bold,
    {
      title:
        "DETALLE Y TRAZABILIDAD",
      subtitle:
        `Órdenes incluidas - ${periodo}`,
      badge:
        "Compras AC-911",
    },
  );

  /*
   * El bloque de hallazgos tiene altura suficiente para las 4 líneas.
   * La tabla empieza SIEMPRE debajo del bloque, con un espacio fijo.
   * Esto evita que el texto se monte sobre el encabezado de la tabla.
   */
  const insightY = 383;
  const insightHeight = 104;
  const insightTableGap = 18;

  drawInsightCard(
    detailPage,
    {
      x: MARGIN,
      y: insightY,
      width:
        CONTENT_WIDTH,
      height:
        insightHeight,
      title:
        "Hallazgos ejecutivos",
      lines: [
        `Proveedor principal: ${reporte.resumen.proveedorPrincipal} (${formatearDineroReporte(
          reporte.resumen
            .gastoProveedorPrincipal,
        )})`,
        `Compra de mayor valor: ${reporte.resumen.codigoCompraMayor} (${formatearDineroReporte(
          reporte.resumen
            .compraMayor,
        )})`,
        `Pendientes: ${reporte.resumen.pendientes} | Aprobadas: ${reporte.resumen.aprobadas} | Completadas: ${reporte.resumen.completadas} | Canceladas: ${reporte.resumen.canceladas}`,
        `Generado en Guatemala: ${generado}`,
      ],
      normal,
      bold,
    },
  );

  let tableY =
    insightY -
    insightTableGap;

  let columns =
    drawTableHeader(
      detailPage,
      tableY,
      bold,
    );

  tableY -= 25;

  const orders =
    reporte.ordenes;

  if (
    orders.length === 0
  ) {
    detailPage.drawText(
      "No hay órdenes para los filtros seleccionados.",
      {
        x: MARGIN + 8,
        y:
          tableY - 24,
        size: 8,
        font: normal,
        color: MUTED,
      },
    );
  } else {
    for (
      let index = 0;
      index <
      orders.length;
      index += 1
    ) {
      const order =
        orders[index];

      if (
        tableY - 34 <
        45
      ) {
        detailPage =
          pdf.addPage([
            PAGE_WIDTH,
            PAGE_HEIGHT,
          ]);

        drawHeader(
          detailPage,
          logo,
          normal,
          bold,
          {
            title:
              "DETALLE Y TRAZABILIDAD",
            subtitle:
              `Continuación - ${periodo}`,
            badge:
              "Compras AC-911",
          },
        );

        tableY = 482;

        columns =
          drawTableHeader(
            detailPage,
            tableY,
            bold,
          );

        tableY -= 25;
      }

      const rowHeight =
        drawOrderRow(
          detailPage,
          {
            y: tableY,
            rowIndex:
              index,
            order,
            columns,
            normal,
            bold,
          },
        );

      tableY -=
        rowHeight;
    }
  }

  const pages =
    pdf.getPages();

  pages.forEach(
    (
      page,
      index,
    ) => {
      drawFooter(
        page,
        normal,
        bold,
        index + 1,
        pages.length,
      );
    },
  );

  const bytes =
    await pdf.save();

  const download =
    url.searchParams.get(
      "download",
    ) === "1";

  const fileName =
    sanitizeFileName(
      `AC911-DARK-EXECUTIVE-${
        desde ??
        "inicio"
      }-${
        hasta ??
        "actualidad"
      }`,
    );

  return new Response(
    Buffer.from(bytes),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/pdf",
        "Content-Disposition": `${
          download
            ? "attachment"
            : "inline"
        }; filename="${
          fileName ||
          "AC911-DARK-EXECUTIVE"
        }.pdf"`,
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-AC911-PDF-STYLE": "dark-executive-v2",
      },
    },
  );
}