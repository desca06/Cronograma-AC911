import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import {
  formatearFechaTrabajo,
  obtenerReporteTrabajos,
} from "@/lib/reportes-trabajos";
import {
  requerirReportes,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const W = 842;
const H = 595;
const M = 34;
const CONTENT = W - M * 2;

const NAVY = rgb(
  0.027,
  0.078,
  0.149,
);

const CARD = rgb(
  0.043,
  0.118,
  0.208,
);

const CARD_ALT = rgb(
  0.055,
  0.145,
  0.245,
);

const BORDER = rgb(
  0.122,
  0.231,
  0.365,
);

const WHITE = rgb(
  1,
  1,
  1,
);

const MUTED = rgb(
  0.58,
  0.64,
  0.72,
);

const BLUE = rgb(
  0.145,
  0.388,
  0.922,
);

const GREEN = rgb(
  0.02,
  0.588,
  0.412,
);

const AMBER = rgb(
  0.961,
  0.62,
  0.043,
);

const PURPLE = rgb(
  0.576,
  0.2,
  0.918,
);

const RED = rgb(
  0.863,
  0.149,
  0.149,
);

const CYAN = rgb(
  0.024,
  0.714,
  0.831,
);

const SKY = rgb(
  0.224,
  0.651,
  0.925,
);

const PINK = rgb(
  0.925,
  0.282,
  0.6,
);

type DatoGrafica = {
  etiqueta: string;
  valor: number;
};

async function cargarLogo(
  pdf: PDFDocument,
): Promise<PDFImage | null> {
  const opciones = [
    [
      "logo-ac911.jpeg",
      "jpg",
    ],
    [
      "logo-ac911.jpg",
      "jpg",
    ],
    [
      "logo-ac911.png",
      "png",
    ],
  ] as const;

  for (
    const [
      archivo,
      tipo,
    ] of opciones
  ) {
    try {
      const bytes =
        await readFile(
          path.join(
            process.cwd(),
            "public",
            "img",
            archivo,
          ),
        );

      return tipo === "png"
        ? await pdf.embedPng(
            bytes,
          )
        : await pdf.embedJpg(
            bytes,
          );
    } catch {}
  }

  return null;
}

function dibujarFondo(
  page: PDFPage,
) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: NAVY,
  });
}

function dibujarHeader(
  page: PDFPage,
  logo: PDFImage | null,
  normal: PDFFont,
  bold: PDFFont,
  titulo: string,
  subtitulo: string,
) {
  dibujarFondo(
    page,
  );

  if (logo) {
    page.drawImage(
      logo,
      {
        x: M,
        y: H - 76,
        width: 104,
        height: 48,
      },
    );
  }

  page.drawText(
    titulo,
    {
      x:
        M +
        122,
      y:
        H -
        46,
      size: 19,
      font: bold,
      color: WHITE,
    },
  );

  page.drawText(
    subtitulo,
    {
      x:
        M +
        122,
      y:
        H -
        64,
      size: 8,
      font: normal,
      color: MUTED,
    },
  );

  page.drawLine({
    start: {
      x: M,
      y:
        H -
        88,
    },
    end: {
      x:
        W -
        M,
      y:
        H -
        88,
    },
    thickness: 1,
    color: BORDER,
  });
}

function dibujarTarjeta(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    titulo: string;
    valor: string;
    color: RGB;
    bold: PDFFont;
  },
) {
  page.drawRectangle({
    x:
      options.x,
    y:
      options.y,
    width:
      options.width,
    height: 58,
    color: CARD,
    borderColor:
      BORDER,
    borderWidth:
      0.7,
  });

  page.drawRectangle({
    x:
      options.x,
    y:
      options.y +
      54,
    width:
      options.width,
    height: 4,
    color:
      options.color,
  });

  page.drawText(
    options.titulo.toUpperCase(),
    {
      x:
        options.x +
        12,
      y:
        options.y +
        37,
      size: 6.5,
      font:
        options.bold,
      color: MUTED,
    },
  );

  page.drawText(
    options.valor,
    {
      x:
        options.x +
        12,
      y:
        options.y +
        15,
      size: 16,
      font:
        options.bold,
      color: WHITE,
    },
  );
}

function cortarTexto(
  texto: string,
  maximo: number,
) {
  if (
    texto.length <=
    maximo
  ) {
    return texto;
  }

  return `${texto.slice(
    0,
    Math.max(
      1,
      maximo -
        3,
    ),
  )}...`;
}

function dibujarGraficaLineas(
  page: PDFPage,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    titulo: string;
    subtitulo: string;
    datos: DatoGrafica[];
    color: RGB;
    normal: PDFFont;
    bold: PDFFont;
  },
) {
  const {
    x,
    y,
    width,
    height,
    titulo,
    subtitulo,
    datos,
    color,
    normal,
    bold,
  } = options;

  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: CARD,
    borderColor: BORDER,
    borderWidth: 0.8,
  });

  page.drawText(
    titulo.toUpperCase(),
    {
      x: x + 14,
      y: y + height - 22,
      size: 8.5,
      font: bold,
      color: WHITE,
    },
  );

  page.drawText(
    subtitulo,
    {
      x: x + 14,
      y: y + height - 36,
      size: 6.3,
      font: normal,
      color: MUTED,
    },
  );

  const visibles =
    datos.slice(
      0,
      7,
    );

  if (
    visibles.length ===
    0
  ) {
    page.drawText(
      "Sin datos para graficar",
      {
        x: x + 14,
        y:
          y +
          height / 2,
        size: 8,
        font: normal,
        color: MUTED,
      },
    );

    return;
  }

  const areaX =
    x + 28;

  const areaY =
    y + 34;

  const areaW =
    width - 48;

  const areaH =
    height - 92;

  const maximo =
    Math.max(
      ...visibles.map(
        (item) =>
          item.valor,
      ),
      1,
    );

  page.drawLine({
    start: {
      x: areaX,
      y: areaY,
    },
    end: {
      x: areaX,
      y: areaY + areaH,
    },
    thickness: 0.8,
    color: BORDER,
  });

  page.drawLine({
    start: {
      x: areaX,
      y: areaY,
    },
    end: {
      x: areaX + areaW,
      y: areaY,
    },
    thickness: 0.8,
    color: BORDER,
  });

  const getX = (
    index: number,
  ) => {
    if (
      visibles.length ===
      1
    ) {
      return (
        areaX +
        areaW / 2
      );
    }

    return (
      areaX +
      (
        index *
        areaW
      ) /
        (
          visibles.length -
          1
        )
    );
  };

  const getY = (
    valor: number,
  ) =>
    areaY +
    (
      valor /
      maximo
    ) *
      (
        areaH -
        18
      );

  /*
   * Líneas horizontales de referencia.
   */
  for (
    let nivel = 0;
    nivel <= 4;
    nivel++
  ) {
    const gridY =
      areaY +
      (
        nivel /
        4
      ) *
        (
          areaH -
          18
        );

    page.drawLine({
      start: {
        x: areaX,
        y: gridY,
      },
      end: {
        x: areaX + areaW,
        y: gridY,
      },
      thickness: 0.35,
      color: BORDER,
      opacity: 0.5,
    });
  }

  /*
   * Línea principal.
   */
  if (
    visibles.length >
    1
  ) {
    for (
      let index = 0;
      index <
      visibles.length - 1;
      index++
    ) {
      const actual =
        visibles[index];

      const siguiente =
        visibles[
          index + 1
        ];

      page.drawLine({
        start: {
          x: getX(
            index,
          ),
          y: getY(
            actual.valor,
          ),
        },
        end: {
          x: getX(
            index + 1,
          ),
          y: getY(
            siguiente.valor,
          ),
        },
        thickness: 2.6,
        color,
      });
    }
  }

  visibles.forEach(
    (
      item,
      index,
    ) => {
      const puntoX =
        getX(
          index,
        );

      const puntoY =
        getY(
          item.valor,
        );

      page.drawCircle({
        x: puntoX,
        y: puntoY,
        size: 4.3,
        color,
        borderColor: WHITE,
        borderWidth: 1,
      });

      const valorTexto =
        String(
          item.valor,
        );

      const valorWidth =
        bold.widthOfTextAtSize(
          valorTexto,
          6.5,
        );

      page.drawText(
        valorTexto,
        {
          x:
            puntoX -
            valorWidth /
              2,
          y:
            puntoY +
            9,
          size: 6.5,
          font: bold,
          color: WHITE,
        },
      );

      const etiqueta =
        cortarTexto(
          item.etiqueta,
          14,
        );

      const etiquetaWidth =
        normal.widthOfTextAtSize(
          etiqueta,
          5.2,
        );

      page.drawText(
        etiqueta,
        {
          x:
            puntoX -
            etiquetaWidth /
              2,
          y:
            y +
            13,
          size: 5.2,
          font: normal,
          color: MUTED,
        },
      );
    },
  );
}

function dibujarPie(
  page: PDFPage,
  normal: PDFFont,
  numero: number,
) {
  page.drawText(
    `AC-911 - Reporte de trabajos - Pagina ${numero}`,
    {
      x: M,
      y: 15,
      size: 5.8,
      font: normal,
      color: MUTED,
    },
  );
}

export async function GET(
  request: Request,
) {
  await requerirReportes();

  const url =
    new URL(
      request.url,
    );

  const empleadoId =
    Number(
      url.searchParams.get(
        "empleadoId",
      ) ??
        "",
    );

  const clienteId =
    Number(
      url.searchParams.get(
        "clienteId",
      ) ??
        "",
    );

  const reporte =
    await obtenerReporteTrabajos({
      desde:
        url.searchParams.get(
          "desde",
        ) ||
        undefined,
      hasta:
        url.searchParams.get(
          "hasta",
        ) ||
        undefined,
      estado:
        url.searchParams.get(
          "estado",
        ) ||
        undefined,
      empleadoId:
        Number.isInteger(
          empleadoId,
        ) &&
        empleadoId >
          0
          ? empleadoId
          : undefined,
      clienteId:
        Number.isInteger(
          clienteId,
        ) &&
        clienteId >
          0
          ? clienteId
          : undefined,
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
    await cargarLogo(
      pdf,
    );

  const periodo =
    `${reporte.filtros.desde ?? "Inicio"} a ${reporte.filtros.hasta ?? "Actualidad"}`;

  /*
   * PAGINA 1
   * Resumen ejecutivo.
   */
  const page1 =
    pdf.addPage([
      W,
      H,
    ]);

  dibujarHeader(
    page1,
    logo,
    normal,
    bold,
    "AC-911 / TRABAJOS",
    `Reporte ejecutivo de trabajos - ${periodo}`,
  );

  const gap = 10;

  const cardWidth =
    (
      CONTENT -
      gap *
        2
    ) /
    3;

  const cards = [
    [
      "Trabajos del mes",
      String(
        reporte.resumen.total,
      ),
      BLUE,
    ],
    [
      "Finalizados",
      String(
        reporte.resumen.finalizados,
      ),
      GREEN,
    ],
    [
      "Pendientes",
      String(
        reporte.resumen.pendientes,
      ),
      AMBER,
    ],
    [
      "En proceso",
      String(
        reporte.resumen.enProceso,
      ),
      CYAN,
    ],
    [
      "Reprogramados",
      String(
        reporte.resumen.reprogramados,
      ),
      PURPLE,
    ],
    [
      "Cancelados",
      String(
        reporte.resumen.cancelados,
      ),
      RED,
    ],
  ] as const;

  cards.forEach(
    (
      item,
      index,
    ) => {
      const row =
        Math.floor(
          index /
            3,
        );

      const col =
        index %
        3;

      dibujarTarjeta(
        page1,
        {
          x:
            M +
            col *
              (
                cardWidth +
                gap
              ),
          y:
            425 -
            row *
              70,
          width:
            cardWidth,
          titulo:
            item[0],
          valor:
            item[1],
          color:
            item[2],
          bold,
        },
      );
    },
  );

  const insightY =
    250;

  const insights = [
    `Cumplimiento: ${reporte.resumen.porcentajeFinalizados}%`,
    `Personal principal: ${reporte.resumen.tecnicoPrincipal} (${reporte.resumen.trabajosTecnicoPrincipal})`,
    `Cliente principal: ${reporte.resumen.clientePrincipal} (${reporte.resumen.trabajosClientePrincipal})`,
    `Tipo mas frecuente: ${reporte.resumen.tipoPrincipal} (${reporte.resumen.trabajosTipoPrincipal})`,
  ];

  page1.drawRectangle({
    x: M,
    y: insightY,
    width: CONTENT,
    height: 86,
    color: CARD,
    borderColor:
      BORDER,
    borderWidth:
      0.7,
  });

  page1.drawText(
    "HALLAZGOS EJECUTIVOS",
    {
      x:
        M +
        14,
      y:
        insightY +
        66,
      size: 7,
      font: bold,
      color: CYAN,
    },
  );

  insights.forEach(
    (
      line,
      index,
    ) => {
      page1.drawText(
        cortarTexto(
          line,
          112,
        ),
        {
          x:
            M +
            14,
          y:
            insightY +
            48 -
            index *
              14,
          size: 7.2,
          font:
            index ===
            0
              ? bold
              : normal,
          color: WHITE,
        },
      );
    },
  );

  const tableY =
    222;

  page1.drawRectangle({
    x: M,
    y:
      tableY -
      24,
    width: CONTENT,
    height: 24,
    color: CARD,
    borderColor:
      BORDER,
    borderWidth:
      0.5,
  });

  const headers = [
    [
      "Fecha",
      M + 6,
    ],
    [
      "Cliente",
      M + 92,
    ],
    [
      "Tipo",
      M + 250,
    ],
    [
      "Estado",
      M + 430,
    ],
    [
      "Descripcion",
      M + 535,
    ],
  ] as const;

  headers.forEach(
    ([
      texto,
      x,
    ]) => {
      page1.drawText(
        texto.toUpperCase(),
        {
          x,
          y:
            tableY -
            16,
          size: 6.2,
          font: bold,
          color: MUTED,
        },
      );
    },
  );

  let y =
    tableY -
    24;

  for (
    const trabajo
    of reporte.trabajos.slice(
      0,
      6,
    )
  ) {
    y -= 26;

    page1.drawText(
      formatearFechaTrabajo(
        trabajo.fecha,
      ),
      {
        x:
          M +
          6,
        y:
          y +
          8,
        size: 6.2,
        font: normal,
        color: WHITE,
      },
    );

    page1.drawText(
      cortarTexto(
        trabajo.cliente,
        24,
      ),
      {
        x:
          M +
          92,
        y:
          y +
          8,
        size: 6.2,
        font: bold,
        color: WHITE,
      },
    );

    page1.drawText(
      cortarTexto(
        trabajo.tipo,
        25,
      ),
      {
        x:
          M +
          250,
        y:
          y +
          8,
        size: 6.2,
        font: normal,
        color: WHITE,
      },
    );

    page1.drawText(
      cortarTexto(
        trabajo.estado,
        16,
      ),
      {
        x:
          M +
          430,
        y:
          y +
          8,
        size: 6.2,
        font: bold,
        color: CYAN,
      },
    );

    page1.drawText(
      cortarTexto(
        trabajo.descripcion,
        38,
      ),
      {
        x:
          M +
          535,
        y:
          y +
          8,
        size: 6.2,
        font: normal,
        color: WHITE,
      },
    );
  }

  dibujarPie(
    page1,
    normal,
    1,
  );

  /*
   * PAGINA 2
   * Panel completo de graficas.
   */
  const page2 =
    pdf.addPage([
      W,
      H,
    ]);

  dibujarHeader(
    page2,
    logo,
    normal,
    bold,
    "AC-911 / ANALISIS GRAFICO",
    `Comportamiento de trabajos - ${periodo}`,
  );

  const chartGap =
    14;

  const chartWidth =
    (
      CONTENT -
      chartGap
    ) /
    2;

  const chartHeight =
    205;

  dibujarGraficaLineas(
    page2,
    {
      x: M,
      y: 300,
      width:
        chartWidth,
      height:
        chartHeight,
      titulo:
        "Trabajos por semana",
      subtitulo:
        "Distribucion dentro del periodo seleccionado",
      datos:
        reporte.porSemana.map(
          (item) => ({
            etiqueta:
              item.etiqueta,
            valor:
              item.cantidad,
          }),
        ),
      color: BLUE,
      normal,
      bold,
    },
  );

  dibujarGraficaLineas(
    page2,
    {
      x:
        M +
        chartWidth +
        chartGap,
      y: 300,
      width:
        chartWidth,
      height:
        chartHeight,
      titulo:
        "Trabajos por estado",
      subtitulo:
        "Situacion actual de las ordenes de trabajo",
      datos:
        reporte.porEstado.map(
          (item) => ({
            etiqueta:
              item.etiqueta,
            valor:
              item.cantidad,
          }),
        ),
      color: PURPLE,
      normal,
      bold,
    },
  );

  dibujarGraficaLineas(
    page2,
    {
      x: M,
      y: 72,
      width:
        chartWidth,
      height:
        chartHeight,
      titulo:
        "Trabajos por personal",
      subtitulo:
        "Cantidad de asignaciones por colaborador",
      datos:
        reporte.porTecnico.map(
          (item) => ({
            etiqueta:
              item.empleado,
            valor:
              item.cantidad,
          }),
        ),
      color: CYAN,
      normal,
      bold,
    },
  );

  dibujarGraficaLineas(
    page2,
    {
      x:
        M +
        chartWidth +
        chartGap,
      y: 72,
      width:
        chartWidth,
      height:
        chartHeight,
      titulo:
        "Trabajos por cliente",
      subtitulo:
        "Clientes con mayor actividad en el periodo",
      datos:
        reporte.porCliente.map(
          (item) => ({
            etiqueta:
              item.cliente,
            valor:
              item.cantidad,
          }),
        ),
      color: BLUE,
      normal,
      bold,
    },
  );

  dibujarPie(
    page2,
    normal,
    2,
  );

  const bytes =
    await pdf.save();

  const download =
    url.searchParams.get(
      "download",
    ) ===
    "1";

  return new Response(
    Buffer.from(
      bytes,
    ),
    {
      headers: {
        "Content-Type":
          "application/pdf",
        "Content-Disposition":
          `${
            download
              ? "attachment"
              : "inline"
          }; filename="AC911-REPORTE-TRABAJOS.pdf"`,
        "Cache-Control":
          "no-store",
      },
    },
  );
}