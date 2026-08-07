import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  ordenCompraItems,
  ordenesCompra,
  proveedores,
  type EstadoOrdenCompra,
} from "@/db/schema";

export type FiltrosReporteCompras = {
  desde?: string;
  hasta?: string;
  proveedorId?: number | null;
  estado?: EstadoOrdenCompra;
};

export type OrdenReporteCompra = {
  id: number;
  codigo: string;
  fechaCompra: string;
  creadoEn: Date;
  completadaEn: Date | null;
  proveedorId: number;
  proveedor: string;
  motivo: string;
  estado: EstadoOrdenCompra;
  total: number;
};

export type SerieMensualCompra = {
  clave: string;
  etiqueta: string;
  total: number;
  ordenes: number;
};

export type SerieProveedorCompra = {
  proveedorId: number;
  proveedor: string;
  total: number;
  ordenes: number;
};

export type SerieEstadoCompra = {
  estado: EstadoOrdenCompra;
  etiqueta: string;
  cantidad: number;
  porcentaje: number;
};

export type SerieArticuloCompra = {
  articuloId: number | null;
  descripcion: string;
  cantidad: number;
  total: number;
};

export type ReporteCompras = {
  filtros: FiltrosReporteCompras;
  proveedoresDisponibles: Array<{
    id: number;
    codigo: string;
    nombre: string;
  }>;
  ordenes: OrdenReporteCompra[];
  resumen: {
    totalOrdenes: number;
    gastoReal: number;
    promedioCompra: number;
    pendientes: number;
    aprobadas: number;
    completadas: number;
    canceladas: number;
    proveedorPrincipal: string;
    gastoProveedorPrincipal: number;
    compraMayor: number;
    codigoCompraMayor: string;
  };
  porMes: SerieMensualCompra[];
  porProveedor: SerieProveedorCompra[];
  porEstado: SerieEstadoCompra[];
  articulosMasComprados: SerieArticuloCompra[];
};

const ESTADOS: EstadoOrdenCompra[] = [
  "PENDIENTE",
  "APROBADA",
  "COMPLETADA",
  "CANCELADA",
];

export function esEstadoOrdenCompra(
  valor: string | null | undefined,
): valor is EstadoOrdenCompra {
  return ESTADOS.includes(
    valor as EstadoOrdenCompra,
  );
}

export function formatearDineroReporte(
  centavos: number,
) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(centavos / 100);
}

export function formatearFechaReporte(
  fecha: string,
) {
  const [anio, mes, dia] = fecha
    .split("-")
    .map(Number);

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(
      Date.UTC(anio, mes - 1, dia),
    ),
  );
}

export function formatearHoraGuatemala(
  fecha: Date,
) {
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(fecha);
}

function etiquetaMes(
  clave: string,
) {
  const [anio, mes] = clave
    .split("-")
    .map(Number);

  if (!anio || !mes) {
    return clave;
  }

  const texto =
    new Intl.DateTimeFormat("es-GT", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(
      new Date(
        Date.UTC(anio, mes - 1, 1),
      ),
    );

  return texto
    .replace(".", "")
    .replace(/^./, (letra) =>
      letra.toUpperCase(),
    );
}

function etiquetaEstado(
  estado: EstadoOrdenCompra,
) {
  switch (estado) {
    case "PENDIENTE":
      return "Pendientes";
    case "APROBADA":
      return "Aprobadas";
    case "COMPLETADA":
      return "Completadas";
    case "CANCELADA":
      return "Canceladas";
  }
}

export async function obtenerReporteCompras(
  filtros: FiltrosReporteCompras = {},
): Promise<ReporteCompras> {
  const condiciones: SQL[] = [];

  if (filtros.desde) {
    condiciones.push(
      gte(
        ordenesCompra.fechaCompra,
        filtros.desde,
      ),
    );
  }

  if (filtros.hasta) {
    condiciones.push(
      lte(
        ordenesCompra.fechaCompra,
        filtros.hasta,
      ),
    );
  }

  if (
    filtros.proveedorId &&
    filtros.proveedorId > 0
  ) {
    condiciones.push(
      eq(
        ordenesCompra.proveedorId,
        filtros.proveedorId,
      ),
    );
  }

  if (filtros.estado) {
    condiciones.push(
      eq(
        ordenesCompra.estado,
        filtros.estado,
      ),
    );
  }

  const where =
    condiciones.length > 0
      ? and(...condiciones)
      : undefined;

  const [
    ordenes,
    proveedoresDisponibles,
  ] = await Promise.all([
    db
      .select({
        id: ordenesCompra.id,
        codigo: ordenesCompra.codigo,
        fechaCompra:
          ordenesCompra.fechaCompra,
        creadoEn:
          ordenesCompra.creadoEn,
        completadaEn:
          ordenesCompra.completadaEn,
        proveedorId:
          proveedores.id,
        proveedor:
          proveedores.nombreComercial,
        motivo:
          ordenesCompra.motivo,
        estado:
          ordenesCompra.estado,
        total:
          ordenesCompra.total,
      })
      .from(ordenesCompra)
      .innerJoin(
        proveedores,
        eq(
          ordenesCompra.proveedorId,
          proveedores.id,
        ),
      )
      .where(where)
      .orderBy(
        desc(
          ordenesCompra.fechaCompra,
        ),
        desc(
          ordenesCompra.creadoEn,
        ),
      ),

    db
      .select({
        id: proveedores.id,
        codigo: proveedores.codigo,
        nombre:
          proveedores.nombreComercial,
      })
      .from(proveedores)
      .orderBy(
        asc(
          proveedores.nombreComercial,
        ),
      ),
  ]);

  const ordenIds =
    ordenes.map(
      (orden) => orden.id,
    );

  const items =
    ordenIds.length > 0
      ? await db
          .select({
            ordenCompraId:
              ordenCompraItems.ordenCompraId,
            tipo:
              ordenCompraItems.tipo,
            articuloId:
              ordenCompraItems.articuloId,
            descripcion:
              ordenCompraItems.descripcion,
            cantidad:
              ordenCompraItems.cantidad,
            subtotal:
              ordenCompraItems.subtotal,
          })
          .from(ordenCompraItems)
          .where(
            inArray(
              ordenCompraItems.ordenCompraId,
              ordenIds,
            ),
          )
      : [];

  const ordenesCompletadas =
    ordenes.filter(
      (orden) =>
        orden.estado === "COMPLETADA",
    );

  const idsCompletadas =
    new Set(
      ordenesCompletadas.map(
        (orden) => orden.id,
      ),
    );

  const gastoReal =
    ordenesCompletadas.reduce(
      (total, orden) =>
        total + orden.total,
      0,
    );

  const pendientes =
    ordenes.filter(
      (orden) =>
        orden.estado === "PENDIENTE",
    ).length;

  const aprobadas =
    ordenes.filter(
      (orden) =>
        orden.estado === "APROBADA",
    ).length;

  const completadas =
    ordenesCompletadas.length;

  const canceladas =
    ordenes.filter(
      (orden) =>
        orden.estado === "CANCELADA",
    ).length;

  const promedioCompra =
    completadas > 0
      ? Math.round(
          gastoReal / completadas,
        )
      : 0;

  const proveedorMap =
    new Map<
      number,
      SerieProveedorCompra
    >();

  for (
    const orden of
    ordenesCompletadas
  ) {
    const actual =
      proveedorMap.get(
        orden.proveedorId,
      ) ?? {
        proveedorId:
          orden.proveedorId,
        proveedor:
          orden.proveedor,
        total: 0,
        ordenes: 0,
      };

    actual.total += orden.total;
    actual.ordenes += 1;

    proveedorMap.set(
      orden.proveedorId,
      actual,
    );
  }

  const porProveedor =
    Array.from(
      proveedorMap.values(),
    )
      .sort(
        (a, b) =>
          b.total - a.total,
      )
      .slice(0, 8);

  const proveedorPrincipal =
    porProveedor[0];

  const compraMayor =
    [...ordenesCompletadas].sort(
      (a, b) =>
        b.total - a.total,
    )[0];

  const meses =
    new Map<
      string,
      {
        total: number;
        ordenes: number;
      }
    >();

  for (
    const orden of
    ordenesCompletadas
  ) {
    const clave =
      orden.fechaCompra.slice(0, 7);

    const actual =
      meses.get(clave) ?? {
        total: 0,
        ordenes: 0,
      };

    actual.total += orden.total;
    actual.ordenes += 1;

    meses.set(clave, actual);
  }

  const porMes =
    Array.from(
      meses.entries(),
    )
      .sort(
        ([a], [b]) =>
          a.localeCompare(b),
      )
      .slice(-12)
      .map(
        ([clave, dato]) => ({
          clave,
          etiqueta:
            etiquetaMes(clave),
          total: dato.total,
          ordenes: dato.ordenes,
        }),
      );

  const totalOrdenes =
    ordenes.length;

  const cantidadesEstado:
    Record<
      EstadoOrdenCompra,
      number
    > = {
      PENDIENTE: pendientes,
      APROBADA: aprobadas,
      COMPLETADA: completadas,
      CANCELADA: canceladas,
    };

  const porEstado =
    ESTADOS.map(
      (estado) => ({
        estado,
        etiqueta:
          etiquetaEstado(estado),
        cantidad:
          cantidadesEstado[estado],
        porcentaje:
          totalOrdenes > 0
            ? Math.round(
                (cantidadesEstado[
                  estado
                ] /
                  totalOrdenes) *
                  100,
              )
            : 0,
      }),
    );

  const articulosMap =
    new Map<
      string,
      SerieArticuloCompra
    >();

  for (const item of items) {
    if (
      item.tipo !== "PRODUCTO" ||
      !idsCompletadas.has(
        item.ordenCompraId,
      )
    ) {
      continue;
    }

    const clave =
      item.articuloId
        ? `id:${item.articuloId}`
        : `desc:${item.descripcion.toLowerCase()}`;

    const actual =
      articulosMap.get(clave) ?? {
        articuloId:
          item.articuloId,
        descripcion:
          item.descripcion,
        cantidad: 0,
        total: 0,
      };

    actual.cantidad +=
      item.cantidad;
    actual.total +=
      item.subtotal;

    articulosMap.set(
      clave,
      actual,
    );
  }

  const articulosMasComprados =
    Array.from(
      articulosMap.values(),
    )
      .sort((a, b) => {
        if (
          b.cantidad !==
          a.cantidad
        ) {
          return (
            b.cantidad -
            a.cantidad
          );
        }

        return b.total - a.total;
      })
      .slice(0, 10);

  return {
    filtros,
    proveedoresDisponibles,
    ordenes,
    resumen: {
      totalOrdenes,
      gastoReal,
      promedioCompra,
      pendientes,
      aprobadas,
      completadas,
      canceladas,
      proveedorPrincipal:
        proveedorPrincipal?.proveedor ??
        "Sin datos",
      gastoProveedorPrincipal:
        proveedorPrincipal?.total ?? 0,
      compraMayor:
        compraMayor?.total ?? 0,
      codigoCompraMayor:
        compraMayor?.codigo ??
        "Sin datos",
    },
    porMes,
    porProveedor,
    porEstado,
    articulosMasComprados,
  };
}