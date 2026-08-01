"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  clientes,
  cotizaciones,
  cotizacionItems,
  type EstadoCotizacion,
  type TipoItemCotizacion,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

const RUTA_COTIZACIONES =
  "/administracion/compras/cotizaciones";

type ItemFormulario = {
  tipo: TipoItemCotizacion;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precioUnitario: number;
};

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

function entero(
  formData: FormData,
  campo: string,
  valorPredeterminado = 0,
) {
  const valor = Number(formData.get(campo));

  return Number.isInteger(valor)
    ? valor
    : valorPredeterminado;
}

function fecha(formData: FormData, campo: string) {
  const valor = texto(formData, campo);

  if (!valor) return null;

  const resultado = new Date(`${valor}T12:00:00`);

  return Number.isNaN(resultado.getTime())
    ? null
    : resultado;
}

function obtenerItems(
  formData: FormData,
): ItemFormulario[] {
  const contenido = texto(formData, "itemsJson");

  if (!contenido) return [];

  try {
    const datos: unknown = JSON.parse(contenido);

    if (!Array.isArray(datos)) return [];

    return datos
      .map((item): ItemFormulario | null => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const registro = item as Record<
          string,
          unknown
        >;

        const tipo = String(
          registro.tipo ?? "",
        ) as TipoItemCotizacion;

        const nombre = String(
          registro.nombre ?? "",
        ).trim();

        const descripcion =
          String(
            registro.descripcion ?? "",
          ).trim() || undefined;

        const cantidad = Number(
          registro.cantidad,
        );

        const precioEnQuetzales = Number(
          registro.precioUnitario,
        );

        if (
          ![
            "PRODUCTO",
            "SERVICIO",
            "COSTO_ADICIONAL",
          ].includes(tipo) ||
          !nombre ||
          !Number.isInteger(cantidad) ||
          cantidad <= 0 ||
          !Number.isFinite(precioEnQuetzales) ||
          precioEnQuetzales < 0
        ) {
          return null;
        }

        return {
          tipo,
          nombre,
          descripcion,
          cantidad,
          precioUnitario: Math.round(
            precioEnQuetzales * 100,
          ),
        };
      })
      .filter(
        (item): item is ItemFormulario =>
          item !== null,
      );
  } catch {
    return [];
  }
}

function calcularTotales(
  items: ItemFormulario[],
) {
  let subtotalProductos = 0;
  let subtotalServicios = 0;
  let subtotalCostosAdicionales = 0;

  const itemsCalculados = items.map(
    (item, indice) => {
      const subtotal =
        item.cantidad * item.precioUnitario;

      if (item.tipo === "PRODUCTO") {
        subtotalProductos += subtotal;
      }

      if (item.tipo === "SERVICIO") {
        subtotalServicios += subtotal;
      }

      if (
        item.tipo === "COSTO_ADICIONAL"
      ) {
        subtotalCostosAdicionales +=
          subtotal;
      }

      return {
        ...item,
        subtotal,
        orden: indice + 1,
      };
    },
  );

  return {
    itemsCalculados,
    subtotalProductos,
    subtotalServicios,
    subtotalCostosAdicionales,
    total:
      subtotalProductos +
      subtotalServicios +
      subtotalCostosAdicionales,
  };
}

function generarCodigo(numero: number) {
  return `COT-${String(numero).padStart(
    6,
    "0",
  )}`;
}

export async function crearCotizacion(
  formData: FormData,
) {
  const sesion = await requerirAdmin();

  const clienteId = Number(
    formData.get("clienteId"),
  );

  const titulo = texto(formData, "titulo");
  const colaborador =
    texto(formData, "colaborador") ||
    "PROYECTOS";

  const fechaSolicitud = fecha(
    formData,
    "fechaSolicitud",
  );

  const diasVigencia = entero(
    formData,
    "diasVigencia",
    5,
  );

  const porcentajeAnticipo = entero(
    formData,
    "porcentajeAnticipo",
    70,
  );

  const porcentajeFinal = entero(
    formData,
    "porcentajeFinal",
    30,
  );

  const observaciones =
    texto(formData, "observaciones") || null;

  const condicionesPago =
    texto(formData, "condicionesPago") ||
    null;

  const incluyeIva =
    formData.get("incluyeIva") === "on";

  const items = obtenerItems(formData);

  if (
    !Number.isInteger(clienteId) ||
    clienteId <= 0
  ) {
    redirect(
      `${RUTA_COTIZACIONES}/nueva?error=cliente`,
    );
  }

  if (!titulo) {
    redirect(
      `${RUTA_COTIZACIONES}/nueva?error=titulo`,
    );
  }

  if (!fechaSolicitud) {
    redirect(
      `${RUTA_COTIZACIONES}/nueva?error=fecha`,
    );
  }

  if (
    diasVigencia <= 0 ||
    porcentajeAnticipo < 0 ||
    porcentajeFinal < 0 ||
    porcentajeAnticipo +
      porcentajeFinal !==
      100
  ) {
    redirect(
      `${RUTA_COTIZACIONES}/nueva?error=datos`,
    );
  }

  if (items.length === 0) {
    redirect(
      `${RUTA_COTIZACIONES}/nueva?error=items`,
    );
  }

  const [cliente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.id, clienteId))
    .limit(1);

  if (!cliente) {
    redirect(
      `${RUTA_COTIZACIONES}/nueva?error=cliente`,
    );
  }

  const validaHasta = new Date(
    fechaSolicitud,
  );

  validaHasta.setDate(
    validaHasta.getDate() + diasVigencia,
  );

  const totales = calcularTotales(items);

  const cotizacionId =
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(911717)`,
      );

      const [numero] = await tx
        .select({
          siguiente:
            sql<number>`coalesce(max(${cotizaciones.id}), 0) + 1`,
        })
        .from(cotizaciones);

      const codigo = generarCodigo(
        Number(numero?.siguiente ?? 1),
      );

      const [creada] = await tx
        .insert(cotizaciones)
        .values({
          codigo,
          clienteId,
          creadoPorId: sesion.usuarioId,
          colaborador,
          titulo,
          fechaSolicitud,
          validaHasta,
          diasVigencia,
          estado: "PENDIENTE",
          observaciones,
          condicionesPago,
          porcentajeAnticipo,
          porcentajeFinal,
          incluyeIva,
          subtotalProductos:
            totales.subtotalProductos,
          subtotalServicios:
            totales.subtotalServicios,
          subtotalCostosAdicionales:
            totales.subtotalCostosAdicionales,
          total: totales.total,
          actualizadoEn: new Date(),
        })
        .returning({
          id: cotizaciones.id,
        });

      if (!creada) {
        throw new Error(
          "No fue posible crear la cotización.",
        );
      }

      await tx
        .insert(cotizacionItems)
        .values(
          totales.itemsCalculados.map(
            (item) => ({
              cotizacionId: creada.id,
              tipo: item.tipo,
              nombre: item.nombre,
              descripcion:
                item.descripcion ?? null,
              cantidad: item.cantidad,
              precioUnitario:
                item.precioUnitario,
              subtotal: item.subtotal,
              orden: item.orden,
            }),
          ),
        );

      return creada.id;
    });

  revalidatePath(RUTA_COTIZACIONES);

  redirect(
    `${RUTA_COTIZACIONES}/${cotizacionId}?creada=1`,
  );
}

export async function cambiarEstadoCotizacion(
  cotizacionId: number,
  nuevoEstado: EstadoCotizacion,
) {
  await requerirAdmin();

  const permitidos: EstadoCotizacion[] = [
    "PENDIENTE",
    "APROBADA",
    "RECHAZADA",
    "VENCIDA",
  ];

  if (
    !Number.isInteger(cotizacionId) ||
    cotizacionId <= 0 ||
    !permitidos.includes(nuevoEstado)
  ) {
    redirect(
      `${RUTA_COTIZACIONES}?error=id`,
    );
  }

  await db
    .update(cotizaciones)
    .set({
      estado: nuevoEstado,
      actualizadoEn: new Date(),
    })
    .where(eq(cotizaciones.id, cotizacionId));

  revalidatePath(RUTA_COTIZACIONES);
  revalidatePath(
    `${RUTA_COTIZACIONES}/${cotizacionId}`,
  );

  redirect(
    `${RUTA_COTIZACIONES}/${cotizacionId}?estado=1`,
  );
}

export async function eliminarCotizacion(
  cotizacionId: number,
) {
  await requerirAdmin();

  const [cotizacion] = await db
    .select({
      id: cotizaciones.id,
      estado: cotizaciones.estado,
    })
    .from(cotizaciones)
    .where(eq(cotizaciones.id, cotizacionId))
    .limit(1);

  if (!cotizacion) {
    redirect(
      `${RUTA_COTIZACIONES}?error=id`,
    );
  }

  if (cotizacion.estado !== "PENDIENTE") {
    redirect(
      `${RUTA_COTIZACIONES}/${cotizacionId}?error=estado-eliminar`,
    );
  }

  await db
    .delete(cotizaciones)
    .where(eq(cotizaciones.id, cotizacionId));

  revalidatePath(RUTA_COTIZACIONES);

  redirect(
    `${RUTA_COTIZACIONES}?eliminada=1`,
  );
}