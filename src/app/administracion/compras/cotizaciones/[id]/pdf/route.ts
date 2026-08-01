import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  PDFDocument,
  StandardFonts,
  rgb,
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

const ANCHO_PAGINA = 612;
const ALTO_PAGINA = 792;
const MARGEN = 42;
const AZUL = rgb(0.08, 0.29, 0.56);
const AZUL_CLARO = rgb(0.92, 0.96, 1);
const GRIS = rgb(0.38, 0.43, 0.5);
const GRIS_CLARO = rgb(0.95, 0.96, 0.97);
const NEGRO = rgb(0.08, 0.1, 0.13);
const VERDE_CLARO = rgb(0.92, 0.98, 0.94);

function dinero(valorEnCentavos: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(valorEnCentavos / 100);
}

function fecha(valor: Date | null) {
  if (!valor) return "Sin fecha";

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(valor);
}

function textoSeguro(valor: string | null | undefined) {
  return valor?.trim() || "No registrado";
}

function dividirTexto(
  texto: string,
  fuente: PDFFont,
  tamano: number,
  anchoMaximo: number,
) {
  const parrafos = texto.replace(/\r/g, "").split("\n");
  const lineas: string[] = [];

  for (const parrafo of parrafos) {
    if (!parrafo.trim()) {
      lineas.push("");
      continue;
    }

    const palabras = parrafo.split(/\s+/);
    let linea = "";

    for (const palabra of palabras) {
      const candidata = linea
        ? `${linea} ${palabra}`
        : palabra;

      if (
        fuente.widthOfTextAtSize(candidata, tamano) <=
        anchoMaximo
      ) {
        linea = candidata;
      } else {
        if (linea) lineas.push(linea);
        linea = palabra;
      }
    }

    if (linea) lineas.push(linea);
  }

  return lineas;
}

function dibujarLineas(
  pagina: PDFPage,
  lineas: string[],
  opciones: {
    x: number;
    y: number;
    fuente: PDFFont;
    tamano: number;
    ancho?: number;
    interlineado?: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const interlineado =
    opciones.interlineado ?? opciones.tamano + 3;

  let y = opciones.y;

  for (const linea of lineas) {
    pagina.drawText(linea, {
      x: opciones.x,
      y,
      size: opciones.tamano,
      font: opciones.fuente,
      color: opciones.color ?? NEGRO,
      maxWidth: opciones.ancho,
    });

    y -= interlineado;
  }

  return y;
}

async function agregarLogo(
  pdf: PDFDocument,
  pagina: PDFPage,
) {
  /*
   * Cambia esta ruta si el logo de AC-911 tiene otro nombre.
   * Ruta esperada: public/img/logo-ac911.png
   */
  const rutaLogo = path.join(
    process.cwd(),
    "public",
    "img",
    "logo-ac911.png",
  );

  try {
    const bytes = await readFile(rutaLogo);
    const logo = await pdf.embedPng(bytes);
    const escala = logo.scale(0.16);

    pagina.drawImage(logo, {
      x: MARGEN,
      y: ALTO_PAGINA - 92,
      width: escala.width,
      height: escala.height,
    });
  } catch {
    // El PDF continúa funcionando aunque todavía no exista el logo.
  }
}

function nuevaPagina(
  pdf: PDFDocument,
  fuenteNormal: PDFFont,
  fuenteNegrita: PDFFont,
  codigo: string,
) {
  const pagina = pdf.addPage([
    ANCHO_PAGINA,
    ALTO_PAGINA,
  ]);

  pagina.drawText("AC-911", {
    x: MARGEN,
    y: ALTO_PAGINA - 42,
    size: 14,
    font: fuenteNegrita,
    color: AZUL,
  });

  pagina.drawText(`Cotizacion ${codigo}`, {
    x: ANCHO_PAGINA - MARGEN - 155,
    y: ALTO_PAGINA - 42,
    size: 10,
    font: fuenteNormal,
    color: GRIS,
  });

  pagina.drawLine({
    start: {
      x: MARGEN,
      y: ALTO_PAGINA - 54,
    },
    end: {
      x: ANCHO_PAGINA - MARGEN,
      y: ALTO_PAGINA - 54,
    },
    thickness: 1,
    color: rgb(0.84, 0.87, 0.91),
  });

  return {
    pagina,
    y: ALTO_PAGINA - 78,
  };
}

export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  await requerirAdmin();

  const { id } = await params;
  const cotizacionId = Number(id);

  if (
    !Number.isInteger(cotizacionId) ||
    cotizacionId <= 0
  ) {
    return new Response(
      "Cotizacion no valida.",
      { status: 400 },
    );
  }

  const [cotizacion] = await db
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
    .where(eq(cotizaciones.id, cotizacionId))
    .limit(1);

  if (!cotizacion) {
    return new Response(
      "Cotizacion no encontrada.",
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
      eq(cotizacionItems.cotizacionId, cotizacionId),
    )
    .orderBy(
      asc(cotizacionItems.orden),
      asc(cotizacionItems.id),
    );

  const pdf = await PDFDocument.create();
  const fuenteNormal = await pdf.embedFont(
    StandardFonts.Helvetica,
  );
  const fuenteNegrita = await pdf.embedFont(
    StandardFonts.HelveticaBold,
  );

  pdf.setTitle(
    `Cotizacion ${cotizacion.codigo}`,
  );
  pdf.setAuthor("AC-911");
  pdf.setSubject(cotizacion.titulo);
  pdf.setCreator("Sistema Administrativo AC-911");

  let pagina = pdf.addPage([
    ANCHO_PAGINA,
    ALTO_PAGINA,
  ]);

  await agregarLogo(pdf, pagina);

  pagina.drawText(
    "INVERSIONES 3G DE GUATEMALA",
    {
      x: 145,
      y: ALTO_PAGINA - 45,
      size: 13,
      font: fuenteNegrita,
      color: NEGRO,
    },
  );

  pagina.drawText(
    "Informe de Cotizacion",
    {
      x: 145,
      y: ALTO_PAGINA - 63,
      size: 10,
      font: fuenteNormal,
      color: GRIS,
    },
  );

  pagina.drawText(cotizacion.codigo, {
    x: ANCHO_PAGINA - MARGEN - 105,
    y: ALTO_PAGINA - 48,
    size: 13,
    font: fuenteNegrita,
    color: AZUL,
  });

  pagina.drawLine({
    start: {
      x: MARGEN,
      y: ALTO_PAGINA - 105,
    },
    end: {
      x: ANCHO_PAGINA - MARGEN,
      y: ALTO_PAGINA - 105,
    },
    thickness: 2,
    color: AZUL,
  });

  let y = ALTO_PAGINA - 132;

  pagina.drawRectangle({
    x: MARGEN,
    y: y - 68,
    width: ANCHO_PAGINA - MARGEN * 2,
    height: 72,
    color: AZUL_CLARO,
    borderColor: rgb(0.76, 0.84, 0.94),
    borderWidth: 1,
  });

  pagina.drawText("CLIENTE", {
    x: MARGEN + 14,
    y: y - 15,
    size: 8,
    font: fuenteNegrita,
    color: AZUL,
  });

  pagina.drawText(
    textoSeguro(cotizacion.clienteNombre),
    {
      x: MARGEN + 14,
      y: y - 32,
      size: 12,
      font: fuenteNegrita,
      color: NEGRO,
      maxWidth: 285,
    },
  );

  pagina.drawText("COLABORADOR", {
    x: MARGEN + 330,
    y: y - 15,
    size: 8,
    font: fuenteNegrita,
    color: AZUL,
  });

  pagina.drawText(
    textoSeguro(cotizacion.colaborador),
    {
      x: MARGEN + 330,
      y: y - 32,
      size: 10,
      font: fuenteNegrita,
      color: NEGRO,
      maxWidth: 160,
    },
  );

  pagina.drawText(
    `Solicitud: ${fecha(
      cotizacion.fechaSolicitud,
    )}`,
    {
      x: MARGEN + 14,
      y: y - 54,
      size: 9,
      font: fuenteNormal,
      color: GRIS,
    },
  );

  pagina.drawText(
    `Valida hasta: ${fecha(
      cotizacion.validaHasta,
    )}`,
    {
      x: MARGEN + 215,
      y: y - 54,
      size: 9,
      font: fuenteNormal,
      color: GRIS,
    },
  );

  pagina.drawText(
    `Estado: ${cotizacion.estado}`,
    {
      x: MARGEN + 402,
      y: y - 54,
      size: 9,
      font: fuenteNegrita,
      color: AZUL,
    },
  );

  y -= 96;

  pagina.drawText(cotizacion.titulo, {
    x: MARGEN,
    y,
    size: 15,
    font: fuenteNegrita,
    color: NEGRO,
    maxWidth: ANCHO_PAGINA - MARGEN * 2,
  });

  y -= 26;

  if (cotizacion.observaciones) {
    pagina.drawText("Observaciones", {
      x: MARGEN,
      y,
      size: 9,
      font: fuenteNegrita,
      color: GRIS,
    });

    y -= 15;

    const lineasObservaciones = dividirTexto(
      cotizacion.observaciones,
      fuenteNormal,
      9,
      ANCHO_PAGINA - MARGEN * 2,
    );

    y = dibujarLineas(
      pagina,
      lineasObservaciones,
      {
        x: MARGEN,
        y,
        fuente: fuenteNormal,
        tamano: 9,
        interlineado: 12,
        color: NEGRO,
      },
    );

    y -= 10;
  }

  function asegurarEspacio(
    altoNecesario: number,
  ) {
    if (y - altoNecesario >= 70) {
      return;
    }

    const nueva = nuevaPagina(
      pdf,
      fuenteNormal,
      fuenteNegrita,
      cotizacion.codigo,
    );

    pagina = nueva.pagina;
    y = nueva.y;
  }

  asegurarEspacio(70);

  pagina.drawRectangle({
    x: MARGEN,
    y: y - 24,
    width: ANCHO_PAGINA - MARGEN * 2,
    height: 24,
    color: AZUL,
  });

  const columnas = {
    descripcion: MARGEN + 8,
    cantidad: 392,
    unitario: 449,
    subtotal: 526,
  };

  pagina.drawText("DESCRIPCION", {
    x: columnas.descripcion,
    y: y - 16,
    size: 8,
    font: fuenteNegrita,
    color: rgb(1, 1, 1),
  });

  pagina.drawText("CANT.", {
    x: columnas.cantidad,
    y: y - 16,
    size: 8,
    font: fuenteNegrita,
    color: rgb(1, 1, 1),
  });

  pagina.drawText("UNITARIO", {
    x: columnas.unitario,
    y: y - 16,
    size: 8,
    font: fuenteNegrita,
    color: rgb(1, 1, 1),
  });

  pagina.drawText("SUBTOTAL", {
    x: columnas.subtotal,
    y: y - 16,
    size: 8,
    font: fuenteNegrita,
    color: rgb(1, 1, 1),
  });

  y -= 24;

  for (const item of items) {
    const descripcionCompleta = [
      item.nombre,
      item.descripcion ?? "",
    ]
      .filter(Boolean)
      .join("\n");

    const lineas = dividirTexto(
      descripcionCompleta,
      fuenteNormal,
      8.5,
      330,
    );

    const altoFila = Math.max(
      38,
      lineas.length * 11 + 14,
    );

    asegurarEspacio(altoFila + 4);

    pagina.drawRectangle({
      x: MARGEN,
      y: y - altoFila,
      width: ANCHO_PAGINA - MARGEN * 2,
      height: altoFila,
      color:
        item.orden % 2 === 0
          ? GRIS_CLARO
          : rgb(1, 1, 1),
      borderColor: rgb(0.86, 0.88, 0.91),
      borderWidth: 0.5,
    });

    pagina.drawText(
      item.tipo.replaceAll("_", " "),
      {
        x: columnas.descripcion,
        y: y - 13,
        size: 7,
        font: fuenteNegrita,
        color: AZUL,
      },
    );

    dibujarLineas(pagina, lineas, {
      x: columnas.descripcion,
      y: y - 25,
      fuente: fuenteNormal,
      tamano: 8.5,
      interlineado: 11,
      color: NEGRO,
    });

    pagina.drawText(String(item.cantidad), {
      x: columnas.cantidad,
      y: y - 23,
      size: 9,
      font: fuenteNormal,
      color: NEGRO,
    });

    pagina.drawText(
      dinero(item.precioUnitario),
      {
        x: columnas.unitario,
        y: y - 23,
        size: 8,
        font: fuenteNormal,
        color: NEGRO,
      },
    );

    pagina.drawText(dinero(item.subtotal), {
      x: columnas.subtotal,
      y: y - 23,
      size: 8,
      font: fuenteNegrita,
      color: NEGRO,
    });

    y -= altoFila;
  }

  y -= 20;
  asegurarEspacio(150);

  const anchoResumen = 230;
  const xResumen =
    ANCHO_PAGINA - MARGEN - anchoResumen;

  pagina.drawRectangle({
    x: xResumen,
    y: y - 112,
    width: anchoResumen,
    height: 116,
    color: VERDE_CLARO,
    borderColor: rgb(0.73, 0.87, 0.77),
    borderWidth: 1,
  });

  pagina.drawText("RESUMEN", {
    x: xResumen + 14,
    y: y - 17,
    size: 10,
    font: fuenteNegrita,
    color: NEGRO,
  });

  const filasResumen = [
    [
      "Productos",
      dinero(cotizacion.subtotalProductos),
    ],
    [
      "Servicios",
      dinero(cotizacion.subtotalServicios),
    ],
    [
      "Costos adicionales",
      dinero(
        cotizacion.subtotalCostosAdicionales,
      ),
    ],
  ];

  let yResumen = y - 38;

  for (const [etiqueta, valor] of filasResumen) {
    pagina.drawText(etiqueta, {
      x: xResumen + 14,
      y: yResumen,
      size: 8.5,
      font: fuenteNormal,
      color: GRIS,
    });

    pagina.drawText(valor, {
      x: xResumen + 132,
      y: yResumen,
      size: 8.5,
      font: fuenteNegrita,
      color: NEGRO,
    });

    yResumen -= 18;
  }

  pagina.drawLine({
    start: {
      x: xResumen + 14,
      y: yResumen + 5,
    },
    end: {
      x: xResumen + anchoResumen - 14,
      y: yResumen + 5,
    },
    thickness: 1,
    color: rgb(0.65, 0.72, 0.67),
  });

  pagina.drawText("TOTAL", {
    x: xResumen + 14,
    y: yResumen - 10,
    size: 11,
    font: fuenteNegrita,
    color: NEGRO,
  });

  pagina.drawText(dinero(cotizacion.total), {
    x: xResumen + 128,
    y: yResumen - 10,
    size: 11,
    font: fuenteNegrita,
    color: AZUL,
  });

  y -= 138;
  asegurarEspacio(200);

  pagina.drawText(
    "CONDICIONES DE PAGO Y ENTREGA",
    {
      x: MARGEN,
      y,
      size: 11,
      font: fuenteNegrita,
      color: AZUL,
    },
  );

  y -= 18;

  const condiciones =
    cotizacion.condicionesPago ||
    `- Cualquier trabajo adicional no contemplado sera cotizado por separado.
- El monto total ${cotizacion.incluyeIva ? "incluye" : "no incluye"} IVA.
- Forma de pago: ${cotizacion.porcentajeAnticipo}% de anticipo y ${cotizacion.porcentajeFinal}% al finalizar.
- La cotizacion tiene una vigencia de ${cotizacion.diasVigencia} dias.`;

  const lineasCondiciones = dividirTexto(
    condiciones,
    fuenteNormal,
    8.5,
    ANCHO_PAGINA - MARGEN * 2,
  );

  for (const linea of lineasCondiciones) {
    asegurarEspacio(16);

    pagina.drawText(linea, {
      x: MARGEN,
      y,
      size: 8.5,
      font: fuenteNormal,
      color: NEGRO,
    });

    y -= 12;
  }

  asegurarEspacio(95);
  y -= 18;

  pagina.drawLine({
    start: {
      x: MARGEN,
      y,
    },
    end: {
      x: MARGEN + 190,
      y,
    },
    thickness: 0.8,
    color: GRIS,
  });

  pagina.drawText(
    "Departamento Comercial - AC-911",
    {
      x: MARGEN,
      y: y - 15,
      size: 8.5,
      font: fuenteNegrita,
      color: NEGRO,
    },
  );

  pagina.drawText(
    "Telefono: 2267-4000  |  Email: proyectos@ac-911.com",
    {
      x: MARGEN,
      y: 35,
      size: 7.5,
      font: fuenteNormal,
      color: GRIS,
    },
  );

  pagina.drawText(
    "Guatemala, Zona 11, Col. Roosevelt",
    {
      x: ANCHO_PAGINA - MARGEN - 185,
      y: 35,
      size: 7.5,
      font: fuenteNormal,
      color: GRIS,
    },
  );

  const paginas = pdf.getPages();

  paginas.forEach((paginaActual, indice) => {
    paginaActual.drawText(
      `Pagina ${indice + 1} de ${paginas.length}`,
      {
        x: ANCHO_PAGINA - MARGEN - 64,
        y: 18,
        size: 7,
        font: fuenteNormal,
        color: GRIS,
      },
    );
  });

  const bytes = await pdf.save();
  const url = new URL(request.url);
  const descargar =
    url.searchParams.get("download") === "1";

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        descargar ? "attachment" : "inline"
      }; filename="${cotizacion.codigo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}