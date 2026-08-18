import {
  asc,
  eq,
} from "drizzle-orm";
import {
  PDFDocument,
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
  navy: rgb(8 / 255, 47 / 255, 73 / 255),
  blue: rgb(2 / 255, 132 / 255, 199 / 255),
  sky: rgb(224 / 255, 242 / 255, 254 / 255),
  skyBorder: rgb(125 / 255, 211 / 255, 252 / 255),
  slate900: rgb(15 / 255, 23 / 255, 42 / 255),
  slate700: rgb(51 / 255, 65 / 255, 85 / 255),
  slate500: rgb(100 / 255, 116 / 255, 139 / 255),
  slate200: rgb(226 / 255, 232 / 255, 240 / 255),
  slate50: rgb(248 / 255, 250 / 255, 252 / 255),
  white: rgb(1, 1, 1),
  green: rgb(22 / 255, 163 / 255, 74 / 255),
};

function cortar(texto: string, limite: number) {
  if (texto.length <= limite) {
    return texto;
  }

  return `${texto.slice(0, Math.max(limite - 3, 1))}...`;
}

function formatearFechaHora(fecha: Date | string) {
  const valor = fecha instanceof Date ? fecha : new Date(fecha);

  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(valor);
}

function partirTexto(
  texto: string,
  maxWidth: number,
  font: any,
  size: number,
) {
  const palabras = texto
    .replace(/\r/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;

    if (font.widthOfTextAtSize(prueba, size) <= maxWidth) {
      actual = prueba;
    } else {
      if (actual) {
        lineas.push(actual);
      }

      actual = palabra;
    }
  }

  if (actual) {
    lineas.push(actual);
  }

  return lineas.length ? lineas : [""];
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
  const lineas = partirTexto(texto, maxWidth, font, size);
  let cursorY = y;

  for (const linea of lineas) {
    page.drawText(linea, {
      x,
      y: cursorY,
      size,
      font,
      color,
    });

    cursorY -= lineHeight;
  }

  return cursorY;
}

function dibujarEncabezado(
  page: PDFPage,
  codigo: string,
  estado: string,
  regular: any,
  bold: any,
) {
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 82,
    width: PAGE_WIDTH,
    height: 82,
    color: COLOR.navy,
  });

  page.drawText("AC-911 · REPORTE TÉCNICO DE TRABAJO", {
    x: MARGIN,
    y: PAGE_HEIGHT - 38,
    size: 18,
    font: bold,
    color: COLOR.white,
  });

  page.drawText(codigo, {
    x: MARGIN,
    y: PAGE_HEIGHT - 58,
    size: 8,
    font: regular,
    color: rgb(186 / 255, 230 / 255, 253 / 255),
  });

  const badgeWidth = 118;

  page.drawRectangle({
    x: PAGE_WIDTH - MARGIN - badgeWidth,
    y: PAGE_HEIGHT - 62,
    width: badgeWidth,
    height: 28,
    color: COLOR.blue,
  });

  const textoEstado = cortar(estado.toUpperCase(), 20);
  const ancho = bold.widthOfTextAtSize(textoEstado, 8);

  page.drawText(textoEstado, {
    x: PAGE_WIDTH - MARGIN - badgeWidth / 2 - ancho / 2,
    y: PAGE_HEIGHT - 51,
    size: 8,
    font: bold,
    color: COLOR.white,
  });
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

  if (!Number.isInteger(trabajoId) || trabajoId <= 0) {
    return new Response("Trabajo inválido.", { status: 400 });
  }

  const [trabajo] = await db
    .select({
      id: trabajos.id,
      fecha: trabajos.fecha,
      tipo: trabajos.tipo,
      descripcion: trabajos.descripcion,
      direccion: trabajos.direccion,
      estado: trabajos.estado,
      horaInicio: trabajos.horaInicio,
      horaFin: trabajos.horaFin,
      observacionesSupervisor: trabajos.observaciones,
      clienteNombre: clientes.nombre,
      clienteTelefono: clientes.telefono,
      vehiculoNombre: vehiculos.nombre,
      vehiculoPlaca: vehiculos.placa,
    })
    .from(trabajos)
    .innerJoin(clientes, eq(trabajos.clienteId, clientes.id))
    .leftJoin(vehiculos, eq(trabajos.vehiculoId, vehiculos.id))
    .where(eq(trabajos.id, trabajoId))
    .limit(1);

  if (!trabajo) {
    return new Response("Trabajo no encontrado.", { status: 404 });
  }

  const tecnicos = await db
    .select({
      nombre: empleados.nombre,
      puesto: empleados.puesto,
    })
    .from(trabajoEmpleados)
    .innerJoin(
      empleados,
      eq(trabajoEmpleados.empleadoId, empleados.id),
    )
    .where(eq(trabajoEmpleados.trabajoId, trabajoId))
    .orderBy(asc(empleados.nombre));

  const historial = await db
    .select({
      observacion: trabajoObservacionesTecnico.observacion,
      estadoTrabajo: trabajoObservacionesTecnico.estadoTrabajo,
      creadoEn: trabajoObservacionesTecnico.creadoEn,
      autor: usuarios.nombre,
    })
    .from(trabajoObservacionesTecnico)
    .leftJoin(
      usuarios,
      eq(trabajoObservacionesTecnico.usuarioId, usuarios.id),
    )
    .where(eq(trabajoObservacionesTecnico.trabajoId, trabajoId))
    .orderBy(asc(trabajoObservacionesTecnico.creadoEn));

  const listaEvidencias = await db
    .select({
      archivoUrl: evidencias.archivoUrl,
      nombreOriginal: evidencias.nombreOriginal,
      descripcion: evidencias.descripcion,
      creadoEn: evidencias.creadoEn,
    })
    .from(evidencias)
    .where(eq(evidencias.trabajoId, trabajoId))
    .orderBy(asc(evidencias.creadoEn));

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let numeroPagina = 0;

  const nuevaPagina = () => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    numeroPagina += 1;

    dibujarEncabezado(
      page,
      `TR-${String(trabajo.id).padStart(5, "0")}`,
      trabajo.estado,
      regular,
      bold,
    );

    dibujarPie(page, numeroPagina, regular);

    return page;
  };

  let page = nuevaPagina();

  const panelX = 36;
  const panelY = 115;
  const panelW = 250;
  const rightX = 315;
  const rightW = PAGE_WIDTH - rightX - MARGIN;

  page.drawRectangle({
    x: panelX,
    y: panelY,
    width: panelW,
    height: 360,
    color: COLOR.white,
    borderColor: COLOR.skyBorder,
    borderWidth: 1,
  });

  page.drawText("DATOS DEL SERVICIO", {
    x: panelX + 16,
    y: 445,
    size: 9,
    font: bold,
    color: COLOR.blue,
  });

  const personal = tecnicos.length
    ? tecnicos
        .map((item) => `${item.nombre} (${item.puesto})`)
        .join(", ")
    : "Sin personal asignado";

  const datos = [
    ["Cliente", trabajo.clienteNombre],
    ["Teléfono", trabajo.clienteTelefono || "No registrado"],
    ["Dirección", trabajo.direccion || "Sin dirección"],
    ["Fecha", trabajo.fecha],
    ["Tipo", trabajo.tipo],
    [
      "Vehículo",
      trabajo.vehiculoNombre
        ? `${trabajo.vehiculoNombre}${trabajo.vehiculoPlaca ? ` · ${trabajo.vehiculoPlaca}` : ""}`
        : "Sin vehículo",
    ],
    ["Técnicos", personal],
    [
      "Horario",
      trabajo.horaInicio
        ? `${trabajo.horaInicio}${trabajo.horaFin ? ` - ${trabajo.horaFin}` : ""}`
        : "Sin definir",
    ],
  ] as const;

  let infoY = 418;

  for (const [label, value] of datos) {
    page.drawText(label.toUpperCase(), {
      x: panelX + 16,
      y: infoY,
      size: 6.2,
      font: bold,
      color: COLOR.slate500,
    });

    const lineas = partirTexto(value, panelW - 32, bold, 8).slice(0, 2);
    let valorY = infoY - 13;

    for (const linea of lineas) {
      page.drawText(linea, {
        x: panelX + 16,
        y: valorY,
        size: 8,
        font: bold,
        color: COLOR.slate900,
      });

      valorY -= 10;
    }

    infoY -= lineas.length > 1 ? 43 : 34;
  }

  page.drawText("RESUMEN DEL TRABAJO", {
    x: rightX,
    y: 454,
    size: 10,
    font: bold,
    color: COLOR.navy,
  });

  page.drawRectangle({
    x: rightX,
    y: 374,
    width: rightW,
    height: 62,
    color: COLOR.sky,
    borderColor: COLOR.skyBorder,
    borderWidth: 1,
  });

  dibujarTextoEnvuelto(
    page,
    trabajo.descripcion,
    rightX + 14,
    414,
    rightW - 28,
    regular,
    8.4,
    COLOR.slate700,
    11,
  );

  page.drawText("INDICACIONES DEL SUPERVISOR", {
    x: rightX,
    y: 345,
    size: 10,
    font: bold,
    color: COLOR.navy,
  });

  page.drawRectangle({
    x: rightX,
    y: 282,
    width: rightW,
    height: 48,
    color: COLOR.white,
    borderColor: COLOR.skyBorder,
    borderWidth: 1,
  });

  dibujarTextoEnvuelto(
    page,
    trabajo.observacionesSupervisor ||
      "El supervisor no agregó indicaciones.",
    rightX + 14,
    311,
    rightW - 28,
    regular,
    8,
    COLOR.slate700,
    10,
  );

  page.drawText("HISTORIAL DE OBSERVACIONES TÉCNICAS", {
    x: rightX,
    y: 255,
    size: 10,
    font: bold,
    color: COLOR.navy,
  });

  let obsY = 231;
  const historialPaginaUno = historial.slice(0, 4);

  if (historialPaginaUno.length === 0) {
    page.drawText("Sin observaciones técnicas registradas.", {
      x: rightX,
      y: obsY,
      size: 8,
      font: regular,
      color: COLOR.slate500,
    });
  } else {
    for (let i = 0; i < historialPaginaUno.length; i += 1) {
      const item = historialPaginaUno[i];

      page.drawCircle({
        x: rightX + 7,
        y: obsY + 3,
        size: 7,
        color: COLOR.blue,
      });

      page.drawText(String(i + 1), {
        x: rightX + (i + 1 >= 10 ? 3 : 4.8),
        y: obsY,
        size: 6,
        font: bold,
        color: COLOR.white,
      });

      const encabezado = `${item.autor || "Técnico"} · ${item.estadoTrabajo} · ${formatearFechaHora(item.creadoEn)}`;

      page.drawText(cortar(encabezado, 72), {
        x: rightX + 22,
        y: obsY + 1,
        size: 6.6,
        font: bold,
        color: COLOR.slate500,
      });

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

  const restantes = historial.slice(historialPaginaUno.length);

  if (restantes.length > 0 || listaEvidencias.length > 0) {
    page = nuevaPagina();

    let y = PAGE_HEIGHT - 112;

    if (restantes.length > 0) {
      page.drawText("HISTORIAL DE OBSERVACIONES TÉCNICAS", {
        x: MARGIN,
        y,
        size: 11,
        font: bold,
        color: COLOR.navy,
      });

      y -= 24;

      for (let i = 0; i < restantes.length; i += 1) {
        const item = restantes[i];
        const encabezado = `${item.autor || "Técnico"} · ${item.estadoTrabajo} · ${formatearFechaHora(item.creadoEn)}`;
        const lineas = partirTexto(
          item.observacion,
          PAGE_WIDTH - MARGIN * 2 - 24,
          regular,
          8,
        );
        const altura = 42 + lineas.length * 10;

        if (y - altura < 58) {
          page = nuevaPagina();
          y = PAGE_HEIGHT - 112;

          page.drawText("HISTORIAL DE OBSERVACIONES TÉCNICAS (CONT.)", {
            x: MARGIN,
            y,
            size: 11,
            font: bold,
            color: COLOR.navy,
          });

          y -= 24;
        }

        page.drawRectangle({
          x: MARGIN,
          y: y - altura + 10,
          width: PAGE_WIDTH - MARGIN * 2,
          height: altura - 4,
          color: COLOR.slate50,
          borderColor: COLOR.slate200,
          borderWidth: 1,
        });

        page.drawText(cortar(encabezado, 100), {
          x: MARGIN + 12,
          y: y - 7,
          size: 7,
          font: bold,
          color: COLOR.blue,
        });

        let textoY = y - 23;

        for (const linea of lineas) {
          page.drawText(linea, {
            x: MARGIN + 12,
            y: textoY,
            size: 8,
            font: regular,
            color: COLOR.slate700,
          });

          textoY -= 10;
        }

        y -= altura + 8;
      }
    }

    if (listaEvidencias.length > 0) {
      const gap = 12;
      const columnas = 3;
      const anchoDisponible = PAGE_WIDTH - MARGIN * 2;
      const anchoTarjeta =
        (anchoDisponible - gap * (columnas - 1)) / columnas;
      const altoImagen = 118;
      const altoInfo = 43;
      const altoTarjeta = altoImagen + altoInfo;
      const espacioEntreFilas = 14;
      const limiteInferior = 38;

      if (y - altoTarjeta < limiteInferior) {
        page = nuevaPagina();
        y = PAGE_HEIGHT - 112;
      }

      page.drawText("EVIDENCIAS REGISTRADAS", {
        x: MARGIN,
        y,
        size: 11,
        font: bold,
        color: COLOR.navy,
      });

      y -= 22;

      let columna = 0;

      for (let indice = 0; indice < listaEvidencias.length; indice += 1) {
        const evidencia = listaEvidencias[indice];

        if (columna === 0 && y - altoTarjeta < limiteInferior) {
          page = nuevaPagina();
          y = PAGE_HEIGHT - 112;

          page.drawText("EVIDENCIAS REGISTRADAS (CONT.)", {
            x: MARGIN,
            y,
            size: 11,
            font: bold,
            color: COLOR.navy,
          });

          y -= 22;
        }

        const x = MARGIN + columna * (anchoTarjeta + gap);
        const tarjetaY = y - altoTarjeta;

        let imagenInsertada = false;

        try {
          const cargada = await cargarImagenEvidencia(
            evidencia.archivoUrl,
          );

          let imagen;

          if (cargada?.tipo === "png") {
            imagen = await pdf.embedPng(cargada.bytes);
          } else if (cargada?.tipo === "jpg") {
            imagen = await pdf.embedJpg(cargada.bytes);
          }

          if (imagen) {
            const escala = Math.min(
              (anchoTarjeta - 8) / imagen.width,
              (altoImagen - 6) / imagen.height,
            );

            const anchoImagen = imagen.width * escala;
            const altoImagenFinal = imagen.height * escala;

            page.drawImage(imagen, {
              x: x + (anchoTarjeta - anchoImagen) / 2,
              y:
                tarjetaY +
                altoInfo +
                (altoImagen - altoImagenFinal) / 2,
              width: anchoImagen,
              height: altoImagenFinal,
            });

            imagenInsertada = true;
          }
        } catch {
          imagenInsertada = false;
        }

        if (!imagenInsertada) {
          page.drawRectangle({
            x: x + 4,
            y: tarjetaY + altoInfo + 4,
            width: anchoTarjeta - 8,
            height: altoImagen - 8,
            color: COLOR.slate50,
          });

          const aviso = "Vista previa no disponible";
          const anchoAviso = bold.widthOfTextAtSize(aviso, 7);

          page.drawText(aviso, {
            x: x + (anchoTarjeta - anchoAviso) / 2,
            y: tarjetaY + altoInfo + altoImagen / 2,
            size: 7,
            font: bold,
            color: COLOR.slate500,
          });
        }

        page.drawText(cortar(evidencia.nombreOriginal, 32), {
          x: x + 4,
          y: tarjetaY + 29,
          size: 7,
          font: bold,
          color: COLOR.slate900,
        });

        page.drawText(
          cortar(evidencia.descripcion || "Sin descripción", 36),
          {
            x: x + 4,
            y: tarjetaY + 17,
            size: 6.2,
            font: regular,
            color: COLOR.slate700,
          },
        );

        page.drawText(formatearFechaHora(evidencia.creadoEn), {
          x: x + 4,
          y: tarjetaY + 5,
          size: 5.7,
          font: regular,
          color: COLOR.slate500,
        });

        columna += 1;

        if (columna === columnas) {
          columna = 0;
          y -= altoTarjeta + espacioEntreFilas;
        }
      }

      if (columna !== 0) {
        y -= altoTarjeta + espacioEntreFilas;
      }
    }
  }

  const ultimaPagina = pdf.getPages()[pdf.getPageCount() - 1];

  ultimaPagina.drawLine({
    start: { x: 80, y: 52 },
    end: { x: 280, y: 52 },
    thickness: 0.7,
    color: COLOR.slate500,
  });

  ultimaPagina.drawLine({
    start: { x: PAGE_WIDTH - 280, y: 52 },
    end: { x: PAGE_WIDTH - 80, y: 52 },
    thickness: 0.7,
    color: COLOR.slate500,
  });

  ultimaPagina.drawText("Firma técnico AC-911", {
    x: 134,
    y: 38,
    size: 7,
    font: bold,
    color: COLOR.slate500,
  });

  ultimaPagina.drawText("Firma cliente / responsable", {
    x: PAGE_WIDTH - 232,
    y: 38,
    size: 7,
    font: bold,
    color: COLOR.slate500,
  });

  const bytes = await pdf.save();
  const cuerpoPdf = Buffer.from(bytes);
  const url = new URL(request.url);
  const descargar = url.searchParams.get("download") === "1";
  const nombreArchivo = `reporte-trabajo-${trabajo.id}.pdf`;

  return new Response(cuerpoPdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename="${nombreArchivo}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}