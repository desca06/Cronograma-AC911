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
export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  await requerirAdmin();

  const { id } = await params;
  const trabajoId = Number(id);

  if (
    !Number.isInteger(
      trabajoId,
    ) ||
    trabajoId <= 0
  ) {
    return new Response(
      "Trabajo inválido.",
      {
        status: 400,
      },
    );
  }

  const [trabajo] = await db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion:
        trabajos.descripcion,
      direccion:
        trabajos.direccion,
      estado: trabajos.estado,
      horaInicio:
        trabajos.horaInicio,
      horaFin:
        trabajos.horaFin,
      observacionesSupervisor:
        trabajos.observaciones,
      clienteNombre:
        clientes.nombre,
      clienteTelefono:
        clientes.telefono,
      vehiculoNombre:
        vehiculos.nombre,
      vehiculoPlaca:
        vehiculos.placa,
      firmaClienteUrl:
        trabajos.firmaClienteUrl,
      firmaClienteNombre:
        trabajos.firmaClienteNombre,
    })
    .from(trabajos)
    .innerJoin(
      clientes,
      eq(
        trabajos.clienteId,
        clientes.id,
      ),
    )
    .leftJoin(
      vehiculos,
      eq(
        trabajos.vehiculoId,
        vehiculos.id,
      ),
    )
    .where(
      eq(
        trabajos.id,
        trabajoId,
      ),
    )
    .limit(1);

  if (!trabajo) {
    return new Response(
      "Trabajo no encontrado.",
      {
        status: 404,
      },
    );
  }

  const tecnicos = await db
    .select({
      nombre: empleados.nombre,
      puesto: empleados.puesto,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      empleados,
      eq(
        trabajoEmpleados.empleadoId,
        empleados.id,
      ),
    )
    .where(
      eq(
        trabajoEmpleados.trabajoId,
        trabajoId,
      ),
    )
    .orderBy(
      asc(
        empleados.nombre,
      ),
    );

  const historial =
    await db
      .select({
        observacion:
          trabajoObservacionesTecnico.observacion,
        estadoTrabajo:
          trabajoObservacionesTecnico.estadoTrabajo,
        creadoEn:
          trabajoObservacionesTecnico.creadoEn,
        autor:
          usuarios.nombre,
      })
      .from(
        trabajoObservacionesTecnico,
      )
      .leftJoin(
        usuarios,
        eq(
          trabajoObservacionesTecnico.usuarioId,
          usuarios.id,
        ),
      )
      .where(
        eq(
          trabajoObservacionesTecnico.trabajoId,
          trabajoId,
        ),
      )
      .orderBy(
        asc(
          trabajoObservacionesTecnico.creadoEn,
        ),
      );

  const listaEvidencias =
    await db
      .select({
        archivoUrl:
          evidencias.archivoUrl,
        nombreOriginal:
          evidencias.nombreOriginal,
        descripcion:
          evidencias.descripcion,
        creadoEn:
          evidencias.creadoEn,
      })
      .from(evidencias)
      .where(
        eq(
          evidencias.trabajoId,
          trabajoId,
        ),
      )
      .orderBy(
        asc(
          evidencias.creadoEn,
        ),
      );

  const pdf =
    await PDFDocument.create();

  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica,
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold,
    );

  const logo = await cargarLogo(pdf);
  const codigoTrabajo = `TR-${String(trabajo.id).padStart(5, "0")}`;

  let numeroPagina = 0;
  let inicioContenido = PAGE_HEIGHT - 140;

  const nuevaPagina = () => {
    const page =
      pdf.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

    numeroPagina += 1;

    inicioContenido = dibujarEncabezado(
      page,
      logo,
      codigoTrabajo,
      trabajo.estado,
      regular,
      bold,
    );

    dibujarPie(
      page,
      numeroPagina,
      regular,
    );

    return page;
  };

  let page =
    nuevaPagina();

  const panelX = 36;
  const panelY = 108;
  const panelW = 250;
  const panelAlto =
    Math.max(
      inicioContenido - 8 - panelY,
      220,
    );
  const rightX = 315;
  const rightW =
    PAGE_WIDTH -
    rightX -
    MARGIN;

  page.drawRectangle({
    x: panelX,
    y: panelY,
    width: panelW,
    height: panelAlto,
    color: COLOR.white,
    borderColor:
      COLOR.skyBorder,
    borderWidth: 1,
  });

  page.drawText(
    "DATOS DEL SERVICIO",
    {
      x: panelX + 16,
      y: inicioContenido - 22,
      size: 9,
      font: bold,
      color: COLOR.blue,
    },
  );

  const personal =
    tecnicos.length
      ? tecnicos
          .map(
            (item) =>
              `${item.nombre} (${item.puesto})`,
          )
          .join(", ")
      : "Sin personal asignado";

  const datos = [
    [
      "Cliente",
      trabajo.clienteNombre,
    ],
    [
      "Teléfono",
      trabajo.clienteTelefono ||
        "No registrado",
    ],
    [
      "Dirección",
      trabajo.direccion ||
        "Sin dirección",
    ],
    [
      "Fecha",
      trabajo.fecha,
    ],
    [
      "Tipo",
      trabajo.tipo,
    ],
    [
      "Vehículo",
      trabajo.vehiculoNombre
        ? `${trabajo.vehiculoNombre}${trabajo.vehiculoPlaca ? ` · ${trabajo.vehiculoPlaca}` : ""}`
        : "Sin vehículo",
    ],
    [
      "Técnicos",
      personal,
    ],
    [
      "Horario",
      trabajo.horaInicio
        ? `${trabajo.horaInicio}${trabajo.horaFin ? ` - ${trabajo.horaFin}` : ""}`
        : "Sin definir",
    ],
  ] as const;

  let infoY = inicioContenido - 48;

  for (
    const [label, value]
    of datos
  ) {
    page.drawText(
      label.toUpperCase(),
      {
        x: panelX + 16,
        y: infoY,
        size: 6.2,
        font: bold,
        color:
          COLOR.slate500,
      },
    );

    const lineas =
      partirTexto(
        value,
        panelW - 32,
        bold,
        8,
      ).slice(0, 2);

    let valorY =
      infoY - 13;

    for (const linea of lineas) {
      page.drawText(
        linea,
        {
          x: panelX + 16,
          y: valorY,
          size: 8,
          font: bold,
          color:
            COLOR.slate900,
        },
      );

      valorY -= 10;
    }

    infoY -=
      lineas.length > 1
        ? 43
        : 34;
  }

  page.drawText(
    "RESUMEN DEL TRABAJO",
    {
      x: rightX,
      y: inicioContenido - 14,
      size: 10,
      font: bold,
      color: COLOR.navy,
    },
  );

  page.drawRectangle({
    x: rightX,
    y: inicioContenido - 94,
    width: rightW,
    height: 62,
    color: COLOR.sky,
    borderColor:
      COLOR.skyBorder,
    borderWidth: 1,
  });

  dibujarTextoEnvuelto(
    page,
    trabajo.descripcion,
    rightX + 14,
    inicioContenido - 54,
    rightW - 28,
    regular,
    8.4,
    COLOR.slate700,
    11,
  );

  page.drawText(
    "INDICACIONES DEL SUPERVISOR",
    {
      x: rightX,
      y: inicioContenido - 123,
      size: 10,
      font: bold,
      color: COLOR.navy,
    },
  );

  page.drawRectangle({
    x: rightX,
    y: inicioContenido - 186,
    width: rightW,
    height: 48,
    color: COLOR.white,
    borderColor:
      COLOR.skyBorder,
    borderWidth: 1,
  });

  dibujarTextoEnvuelto(
    page,
    trabajo.observacionesSupervisor ||
      "El supervisor no agregó indicaciones.",
    rightX + 14,
    inicioContenido - 157,
    rightW - 28,
    regular,
    8,
    COLOR.slate700,
    10,
  );

  page.drawText(
    "HISTORIAL DE OBSERVACIONES TÉCNICAS",
    {
      x: rightX,
      y: inicioContenido - 213,
      size: 10,
      font: bold,
      color: COLOR.navy,
    },
  );

  let obsY = inicioContenido - 237;

  const historialPaginaUno =
    historial.slice(0, 4);

  if (
    historialPaginaUno.length ===
    0
  ) {
    page.drawText(
      "Sin observaciones técnicas registradas.",
      {
        x: rightX,
        y: obsY,
        size: 8,
        font: regular,
        color:
          COLOR.slate500,
      },
    );
  } else {
    for (
      let i = 0;
      i <
      historialPaginaUno.length;
      i += 1
    ) {
      const item =
        historialPaginaUno[i];

      page.drawCircle({
        x: rightX + 7,
        y: obsY + 3,
        size: 7,
        color: COLOR.blue,
      });

      page.drawText(
        String(i + 1),
        {
          x:
            rightX +
            (i + 1 >= 10
              ? 3
              : 4.8),
          y: obsY,
          size: 6,
          font: bold,
          color: COLOR.white,
        },
      );

      const encabezado =
        `${item.autor || "Técnico"} · ${item.estadoTrabajo} · ${formatearFechaHora(item.creadoEn)}`;

      page.drawText(
        cortar(
          encabezado,
          72,
        ),
        {
          x: rightX + 22,
          y: obsY + 1,
          size: 6.6,
          font: bold,
          color:
            COLOR.slate500,
        },
      );

      obsY =
        dibujarTextoEnvuelto(
          page,
          item.observacion,
          rightX + 22,
          obsY - 11,
          rightW - 22,
          regular,
          7.6,
          COLOR.slate700,
          9,
        ) - 9;

      if (obsY < 74) {
        break;
      }
    }
  }

  const restantes =
    historial.slice(
      historialPaginaUno.length,
    );

  if (
    restantes.length > 0 ||
    listaEvidencias.length >
      0
  ) {
    page =
      nuevaPagina();

    let y =
      inicioContenido;

    if (
      restantes.length >
      0
    ) {
      page.drawText(
        "HISTORIAL DE OBSERVACIONES TÉCNICAS",
        {
          x: MARGIN,
          y,
          size: 11,
          font: bold,
          color: COLOR.navy,
        },
      );

      y -= 24;

      for (
        let i = 0;
        i <
        restantes.length;
        i += 1
      ) {
        const item =
          restantes[i];

        const encabezado =
          `${item.autor || "Técnico"} · ${item.estadoTrabajo} · ${formatearFechaHora(item.creadoEn)}`;

        const lineas =
          partirTexto(
            item.observacion,
            PAGE_WIDTH -
              MARGIN * 2 -
              24,
            regular,
            8,
          );

        const altura =
          42 +
          lineas.length *
            10;

        if (
          y - altura < 58
        ) {
          page =
            nuevaPagina();

          y =
            inicioContenido;

          page.drawText(
            "HISTORIAL DE OBSERVACIONES TÉCNICAS (CONT.)",
            {
              x: MARGIN,
              y,
              size: 11,
              font: bold,
              color:
                COLOR.navy,
            },
          );

          y -= 24;
        }

        page.drawRectangle({
          x: MARGIN,
          y:
            y -
            altura +
            10,
          width:
            PAGE_WIDTH -
            MARGIN * 2,
          height:
            altura -
            4,
          color:
            COLOR.slate50,
          borderColor:
            COLOR.slate200,
          borderWidth: 1,
        });

        page.drawText(
          cortar(
            encabezado,
            100,
          ),
          {
            x: MARGIN + 12,
            y: y - 7,
            size: 7,
            font: bold,
            color:
              COLOR.blue,
          },
        );

        let textoY =
          y - 23;

        for (
          const linea of lineas
        ) {
          page.drawText(
            linea,
            {
              x:
                MARGIN +
                12,
              y: textoY,
              size: 8,
              font: regular,
              color:
                COLOR.slate700,
            },
          );

          textoY -= 10;
        }

        y -=
          altura + 8;
      }
    }

    if (
      listaEvidencias.length >
      0
    ) {
      /*
       * Las evidencias se acomodan de forma compacta
       * para aprovechar mejor cada página.
       *
       * - Sin marco celeste alrededor de la tarjeta.
       * - 3 columnas por fila.
       * - Se crea otra página únicamente cuando
       *   la siguiente FILA completa ya no cabe.
       */
      const gap = 12;
      const columnas = 3;

      const anchoDisponible =
        PAGE_WIDTH -
        MARGIN * 2;

      const anchoTarjeta =
        (anchoDisponible -
          gap *
            (columnas - 1)) /
        columnas;

      const altoImagen = 118;
      const altoInfo = 43;
      const altoTarjeta =
        altoImagen +
        altoInfo;

      const espacioEntreFilas = 14;
      const limiteInferior = 118;

      /*
       * Si todavía queda espacio suficiente en la
       * página actual, empezamos aquí mismo.
       * Solo saltamos si ni siquiera cabe una fila.
       */
      if (
        y -
          altoTarjeta <
        limiteInferior
      ) {
        page =
          nuevaPagina();

        y =
          inicioContenido;
      }

      page.drawText(
        "EVIDENCIAS REGISTRADAS",
        {
          x: MARGIN,
          y,
          size: 11,
          font: bold,
          color: COLOR.navy,
        },
      );

      y -= 22;

      let columna = 0;

      for (
        let indice = 0;
        indice <
        listaEvidencias.length;
        indice += 1
      ) {
        const evidencia =
          listaEvidencias[
            indice
          ];

        /*
         * El salto se evalúa únicamente al iniciar
         * una nueva fila. Así no se manda una imagen
         * a otra página si todavía cabe junto a las
         * demás en la fila actual.
         */
        if (
          columna === 0 &&
          y -
            altoTarjeta <
            limiteInferior
        ) {
          page =
            nuevaPagina();

          y =
            inicioContenido;

          page.drawText(
            "EVIDENCIAS REGISTRADAS (CONT.)",
            {
              x: MARGIN,
              y,
              size: 11,
              font: bold,
              color:
                COLOR.navy,
            },
          );

          y -= 22;
        }

        const x =
          MARGIN +
          columna *
            (anchoTarjeta +
              gap);

        const tarjetaY =
          y -
          altoTarjeta;

        /*
         * Ya NO dibujamos un rectángulo/borde
         * alrededor de toda la evidencia.
         */

        let imagenInsertada =
          false;

        try {
          const cargada =
            await cargarImagenEvidencia(
              evidencia.archivoUrl,
            );

          let imagen;

          if (cargada?.tipo === "png") {
            imagen =
              await pdf.embedPng(
                cargada.bytes,
              );
          } else if (cargada?.tipo === "jpg") {
            imagen =
              await pdf.embedJpg(
                cargada.bytes,
              );
          }

          if (imagen) {
            const escala =
              Math.min(
                (anchoTarjeta -
                  8) /
                  imagen.width,
                (altoImagen -
                  6) /
                  imagen.height,
              );

            const anchoImagen =
              imagen.width *
              escala;

            const altoImagenFinal =
              imagen.height *
              escala;

            const imagenX =
              x +
              (anchoTarjeta -
                anchoImagen) /
                2;

            const imagenY =
              tarjetaY +
              altoInfo +
              (altoImagen -
                altoImagenFinal) /
                2;

            page.drawImage(
              imagen,
              {
                x: imagenX,
                y: imagenY,
                width:
                  anchoImagen,
                height:
                  altoImagenFinal,
              },
            );

            imagenInsertada =
              true;
          }
        } catch {
          imagenInsertada =
            false;
        }

        if (
          !imagenInsertada
        ) {
          page.drawRectangle({
            x: x + 4,
            y:
              tarjetaY +
              altoInfo +
              4,
            width:
              anchoTarjeta -
              8,
            height:
              altoImagen -
              8,
            color:
              COLOR.slate50,
          });

          const aviso =
            "Vista previa no disponible";

          const anchoAviso =
            bold.widthOfTextAtSize(
              aviso,
              7,
            );

          page.drawText(
            aviso,
            {
              x:
                x +
                (anchoTarjeta -
                  anchoAviso) /
                  2,
              y:
                tarjetaY +
                altoInfo +
                altoImagen /
                  2,
              size: 7,
              font: bold,
              color:
                COLOR.slate500,
            },
          );
        }

        page.drawText(
          cortar(
            evidencia.nombreOriginal,
            32,
          ),
          {
            x: x + 4,
            y:
              tarjetaY +
              29,
            size: 7,
            font: bold,
            color:
              COLOR.slate900,
          },
        );

        page.drawText(
          cortar(
            evidencia.descripcion ||
              "Sin descripción",
            36,
          ),
          {
            x: x + 4,
            y:
              tarjetaY +
              17,
            size: 6.2,
            font: regular,
            color:
              COLOR.slate700,
          },
        );

        page.drawText(
          formatearFechaHora(
            evidencia.creadoEn,
          ),
          {
            x: x + 4,
            y:
              tarjetaY +
              5,
            size: 5.7,
            font: regular,
            color:
              COLOR.slate500,
          },
        );

        columna += 1;

        if (
          columna === columnas
        ) {
          columna = 0;

          y -=
            altoTarjeta +
            espacioEntreFilas;
        }
      }

      if (
        columna !== 0
      ) {
        y -=
          altoTarjeta +
          espacioEntreFilas;
      }
    }
  }

  const ultimaPagina =
    pdf.getPages()[
      pdf.getPageCount() - 1
    ];

  ultimaPagina.drawLine({
    start: {
      x: 80,
      y: 52,
    },
    end: {
      x: 280,
      y: 52,
    },
    thickness: 0.7,
    color: COLOR.slate500,
  });

  ultimaPagina.drawLine({
    start: {
      x:
        PAGE_WIDTH -
        280,
      y: 52,
    },
    end: {
      x:
        PAGE_WIDTH -
        80,
      y: 52,
    },
    thickness: 0.7,
    color: COLOR.slate500,
  });

  if (trabajo.firmaClienteUrl) {
    try {
      const firmaCargada = await cargarImagenEvidencia(
        trabajo.firmaClienteUrl,
      );

      if (firmaCargada) {
        const imagenFirma =
          firmaCargada.tipo === "png"
            ? await pdf.embedPng(firmaCargada.bytes)
            : await pdf.embedJpg(firmaCargada.bytes);

        const anchoMaximo = 170;
        const altoMaximo = 46;
        const escalaFirma = Math.min(
          anchoMaximo / imagenFirma.width,
          altoMaximo / imagenFirma.height,
        );

        ultimaPagina.drawImage(imagenFirma, {
          x: PAGE_WIDTH - 280 + (200 - imagenFirma.width * escalaFirma) / 2,
          y: 56,
          width: imagenFirma.width * escalaFirma,
          height: imagenFirma.height * escalaFirma,
        });
      }
    } catch {
      // Si no se puede incrustar, queda la línea vacía.
    }
  }

  ultimaPagina.drawText(
    "Firma técnico AC-911",
    {
      x: 134,
      y: 38,
      size: 7,
      font: bold,
      color: COLOR.slate500,
    },
  );

  ultimaPagina.drawText(
    trabajo.firmaClienteNombre
      ? `Firma cliente · ${trabajo.firmaClienteNombre}`
      : "Firma cliente / responsable",
    {
      x:
        PAGE_WIDTH -
        232,
      y: 38,
      size: 7,
      font: bold,
      color: COLOR.slate500,
    },
  );

  const bytes =
    await pdf.save();

  const cuerpoPdf =
    Buffer.from(bytes);

  const url =
    new URL(request.url);

  const descargar =
    url.searchParams.get(
      "download",
    ) === "1";

  const nombreArchivo =
    `reporte-trabajo-${trabajo.id}.pdf`;

  return new Response(
    cuerpoPdf,
    {
      headers: {
        "Content-Type":
          "application/pdf",
        "Content-Disposition":
          `${descargar ? "attachment" : "inline"}; filename="${nombreArchivo}"`,
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );
}