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
  clientes,
  empleados,
  trabajos,
  trabajoEmpleados,
} from "@/db/schema";

export type FiltrosReporteTrabajos = {
  desde?: string;
  hasta?: string;
  estado?: string;
  empleadoId?: number | null;
  clienteId?: number | null;
};

export type TrabajoReporte = {
  id: number;
  fecha: string;
  clienteId: number;
  cliente: string;
  tipo: string;
  descripcion: string;
  direccion: string | null;
  estado: string;
  vehiculoId: number | null;
};

export type ReporteTrabajos = {
  filtros: FiltrosReporteTrabajos;
  empleadosDisponibles: Array<{
    id: number;
    nombre: string;
  }>;
  clientesDisponibles: Array<{
    id: number;
    nombre: string;
  }>;
  trabajos: TrabajoReporte[];
  resumen: {
    total: number;
    finalizados: number;
    pendientes: number;
    enProceso: number;
    reprogramados: number;
    cancelados: number;
    porcentajeFinalizados: number;
    tecnicoPrincipal: string;
    trabajosTecnicoPrincipal: number;
    clientePrincipal: string;
    trabajosClientePrincipal: number;
    tipoPrincipal: string;
    trabajosTipoPrincipal: number;
  };
  porEstado: Array<{
    estado: string;
    etiqueta: string;
    cantidad: number;
    porcentaje: number;
  }>;
  porTecnico: Array<{
    empleadoId: number;
    empleado: string;
    cantidad: number;
  }>;
  porCliente: Array<{
    clienteId: number;
    cliente: string;
    cantidad: number;
  }>;
  porTipo: Array<{
    tipo: string;
    cantidad: number;
  }>;
  porSemana: Array<{
    clave: string;
    etiqueta: string;
    cantidad: number;
  }>;
};

function hoyGuatemala() {
  return new Date().toLocaleDateString(
    "en-CA",
    {
      timeZone:
        "America/Guatemala",
    },
  );
}

export function rangoMesActual() {
  const hoy =
    hoyGuatemala();

  const [
    anio,
    mes,
  ] = hoy
    .split("-")
    .map(Number);

  const fin =
    new Date(
      Date.UTC(
        anio,
        mes,
        0,
      ),
    ).getUTCDate();

  return {
    desde:
      `${anio}-${String(
        mes,
      ).padStart(2, "0")}-01`,
    hasta:
      `${anio}-${String(
        mes,
      ).padStart(2, "0")}-${String(
        fin,
      ).padStart(2, "0")}`,
  };
}

export function formatearFechaTrabajo(
  fecha: string,
) {
  const [
    anio,
    mes,
    dia,
  ] = fecha
    .split("-")
    .map(Number);

  if (
    !anio ||
    !mes ||
    !dia
  ) {
    return fecha;
  }

  return new Intl.DateTimeFormat(
    "es-GT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(
        anio,
        mes - 1,
        dia,
      ),
    ),
  );
}

function normalizarEstado(
  estado: string,
) {
  return estado
    .trim()
    .toLowerCase();
}

function esFinalizado(
  estado: string,
) {
  return normalizarEstado(
    estado,
  ) === "finalizado";
}

function esPendiente(
  estado: string,
) {
  return normalizarEstado(
    estado,
  ) === "pendiente";
}

function esEnProceso(
  estado: string,
) {
  const valor =
    normalizarEstado(
      estado,
    );

  return (
    valor === "en proceso" ||
    valor === "en camino"
  );
}

function esReprogramado(
  estado: string,
) {
  return normalizarEstado(
    estado,
  ).includes(
    "reprogram",
  );
}

function esCancelado(
  estado: string,
) {
  return normalizarEstado(
    estado,
  ) === "cancelado";
}

function etiquetaEstado(
  estado: string,
) {
  if (
    esFinalizado(estado)
  ) {
    return "Finalizados";
  }

  if (
    esPendiente(estado)
  ) {
    return "Pendientes";
  }

  if (
    esEnProceso(estado)
  ) {
    return "En proceso";
  }

  if (
    esReprogramado(estado)
  ) {
    return "Reprogramados";
  }

  if (
    esCancelado(estado)
  ) {
    return "Cancelados";
  }

  return estado;
}

function semanaDelMes(
  fecha: string,
) {
  const dia =
    Number(
      fecha.slice(8, 10),
    );

  if (!dia) {
    return 1;
  }

  return Math.min(
    5,
    Math.ceil(
      dia / 7,
    ),
  );
}

export async function obtenerReporteTrabajos(
  filtros: FiltrosReporteTrabajos = {},
): Promise<ReporteTrabajos> {
  const rango =
    rangoMesActual();

  const filtrosFinales = {
    ...filtros,
    desde:
      filtros.desde ||
      rango.desde,
    hasta:
      filtros.hasta ||
      rango.hasta,
  };

  const condiciones: SQL[] = [];

  if (
    filtrosFinales.desde
  ) {
    condiciones.push(
      gte(
        trabajos.fecha,
        filtrosFinales.desde,
      ),
    );
  }

  if (
    filtrosFinales.hasta
  ) {
    condiciones.push(
      lte(
        trabajos.fecha,
        filtrosFinales.hasta,
      ),
    );
  }

  if (
    filtrosFinales.estado
  ) {
    condiciones.push(
      eq(
        trabajos.estado,
        filtrosFinales.estado,
      ),
    );
  }

  if (
    filtrosFinales.clienteId &&
    filtrosFinales.clienteId >
      0
  ) {
    condiciones.push(
      eq(
        trabajos.clienteId,
        filtrosFinales.clienteId,
      ),
    );
  }

  if (
    filtrosFinales.empleadoId &&
    filtrosFinales.empleadoId >
      0
  ) {
    const ids =
      await db
        .select({
          trabajoId:
            trabajoEmpleados.trabajoId,
        })
        .from(
          trabajoEmpleados,
        )
        .where(
          eq(
            trabajoEmpleados.empleadoId,
            filtrosFinales.empleadoId,
          ),
        );

    const trabajoIds =
      ids.map(
        (item) =>
          item.trabajoId,
      );

    if (
      trabajoIds.length ===
      0
    ) {
      condiciones.push(
        eq(
          trabajos.id,
          -1,
        ),
      );
    } else {
      condiciones.push(
        inArray(
          trabajos.id,
          trabajoIds,
        ),
      );
    }
  }

  const where =
    condiciones.length > 0
      ? and(
          ...condiciones
        )
      : undefined;

  const [
    listaTrabajos,
    empleadosDisponibles,
    clientesDisponibles,
  ] = await Promise.all([
    db
      .select({
        id:
          trabajos.id,
        fecha:
          trabajos.fecha,
        clienteId:
          clientes.id,
        cliente:
          clientes.nombre,
        tipo:
          trabajos.tipo,
        descripcion:
          trabajos.descripcion,
        direccion:
          trabajos.direccion,
        estado:
          trabajos.estado,
        vehiculoId:
          trabajos.vehiculoId,
      })
      .from(trabajos)
      .innerJoin(
        clientes,
        eq(
          trabajos.clienteId,
          clientes.id,
        ),
      )
      .where(where)
      .orderBy(
        desc(
          trabajos.fecha,
        ),
        desc(
          trabajos.id,
        ),
      ),

    db
      .select({
        id:
          empleados.id,
        nombre:
          empleados.nombre,
      })
      .from(empleados)
      .where(
        eq(
          empleados.activo,
          true,
        ),
      )
      .orderBy(
        asc(
          empleados.nombre,
        ),
      ),

    db
      .select({
        id:
          clientes.id,
        nombre:
          clientes.nombre,
      })
      .from(clientes)
      .where(
        eq(
          clientes.activo,
          true,
        ),
      )
      .orderBy(
        asc(
          clientes.nombre,
        ),
      ),
  ]);

  const trabajoIds =
    listaTrabajos.map(
      (item) => item.id,
    );

  const asignaciones =
    trabajoIds.length > 0
      ? await db
          .select({
            trabajoId:
              trabajoEmpleados.trabajoId,
            empleadoId:
              empleados.id,
            empleado:
              empleados.nombre,
          })
          .from(
            trabajoEmpleados,
          )
          .innerJoin(
            empleados,
            eq(
              trabajoEmpleados.empleadoId,
              empleados.id,
            ),
          )
          .where(
            inArray(
              trabajoEmpleados.trabajoId,
              trabajoIds,
            ),
          )
      : [];

  const total =
    listaTrabajos.length;

  const finalizados =
    listaTrabajos.filter(
      (item) =>
        esFinalizado(
          item.estado,
        ),
    ).length;

  const pendientes =
    listaTrabajos.filter(
      (item) =>
        esPendiente(
          item.estado,
        ),
    ).length;

  const enProceso =
    listaTrabajos.filter(
      (item) =>
        esEnProceso(
          item.estado,
        ),
    ).length;

  const reprogramados =
    listaTrabajos.filter(
      (item) =>
        esReprogramado(
          item.estado,
        ),
    ).length;

  const cancelados =
    listaTrabajos.filter(
      (item) =>
        esCancelado(
          item.estado,
        ),
    ).length;

  const porcentajeFinalizados =
    total > 0
      ? Math.round(
          (finalizados /
            total) *
            100,
        )
      : 0;

  const tecnicoMap =
    new Map<
      number,
      {
        empleadoId: number;
        empleado: string;
        cantidad: number;
      }
    >();

  for (
    const asignacion
    of asignaciones
  ) {
    const actual =
      tecnicoMap.get(
        asignacion.empleadoId,
      ) ?? {
        empleadoId:
          asignacion.empleadoId,
        empleado:
          asignacion.empleado,
        cantidad: 0,
      };

    actual.cantidad += 1;

    tecnicoMap.set(
      asignacion.empleadoId,
      actual,
    );
  }

  const porTecnico =
    Array.from(
      tecnicoMap.values(),
    )
      .sort(
        (a, b) =>
          b.cantidad -
          a.cantidad,
      )
      .slice(0, 10);

  const clienteMap =
    new Map<
      number,
      {
        clienteId: number;
        cliente: string;
        cantidad: number;
      }
    >();

  for (
    const trabajo
    of listaTrabajos
  ) {
    const actual =
      clienteMap.get(
        trabajo.clienteId,
      ) ?? {
        clienteId:
          trabajo.clienteId,
        cliente:
          trabajo.cliente,
        cantidad: 0,
      };

    actual.cantidad += 1;

    clienteMap.set(
      trabajo.clienteId,
      actual,
    );
  }

  const porCliente =
    Array.from(
      clienteMap.values(),
    )
      .sort(
        (a, b) =>
          b.cantidad -
          a.cantidad,
      )
      .slice(0, 10);

  const tipoMap =
    new Map<
      string,
      number
    >();

  for (
    const trabajo
    of listaTrabajos
  ) {
    tipoMap.set(
      trabajo.tipo,
      (
        tipoMap.get(
          trabajo.tipo,
        ) ?? 0
      ) + 1,
    );
  }

  const porTipo =
    Array.from(
      tipoMap.entries(),
    )
      .map(
        ([
          tipo,
          cantidad,
        ]) => ({
          tipo,
          cantidad,
        }),
      )
      .sort(
        (a, b) =>
          b.cantidad -
          a.cantidad,
      )
      .slice(0, 10);

  const semanas =
    new Map<
      number,
      number
    >();

  for (
    const trabajo
    of listaTrabajos
  ) {
    const semana =
      semanaDelMes(
        trabajo.fecha,
      );

    semanas.set(
      semana,
      (
        semanas.get(
          semana,
        ) ?? 0
      ) + 1,
    );
  }

  const porSemana =
    Array.from(
      {
        length: 5,
      },
      (
        _,
        index,
      ) => ({
        clave:
          String(
            index + 1,
          ),
        etiqueta:
          `Semana ${
            index + 1
          }`,
        cantidad:
          semanas.get(
            index + 1,
          ) ?? 0,
      }),
    );

  const estados = [
    "Finalizado",
    "Pendiente",
    "En proceso",
    "Reprogramado",
    "Cancelado",
  ];

  const porEstado =
    estados.map(
      (estado) => {
        const cantidad =
          listaTrabajos.filter(
            (item) =>
              etiquetaEstado(
                item.estado,
              ) ===
              etiquetaEstado(
                estado,
              ),
          ).length;

        return {
          estado,
          etiqueta:
            etiquetaEstado(
              estado,
            ),
          cantidad,
          porcentaje:
            total > 0
              ? Math.round(
                  (cantidad /
                    total) *
                    100,
                )
              : 0,
        };
      },
    );

  return {
    filtros:
      filtrosFinales,
    empleadosDisponibles,
    clientesDisponibles,
    trabajos:
      listaTrabajos,
    resumen: {
      total,
      finalizados,
      pendientes,
      enProceso,
      reprogramados,
      cancelados,
      porcentajeFinalizados,
      tecnicoPrincipal:
        porTecnico[0]
          ?.empleado ??
        "Sin datos",
      trabajosTecnicoPrincipal:
        porTecnico[0]
          ?.cantidad ?? 0,
      clientePrincipal:
        porCliente[0]
          ?.cliente ??
        "Sin datos",
      trabajosClientePrincipal:
        porCliente[0]
          ?.cantidad ?? 0,
      tipoPrincipal:
        porTipo[0]
          ?.tipo ??
        "Sin datos",
      trabajosTipoPrincipal:
        porTipo[0]
          ?.cantidad ?? 0,
    },
    porEstado,
    porTecnico,
    porCliente,
    porTipo,
    porSemana,
  };
}