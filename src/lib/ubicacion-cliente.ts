import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  clienteAreas,
  clienteSubtiendas,
} from "@/db/schema";

type Transaccion = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export function leerIdOpcional(
  valor: FormDataEntryValue | null,
) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    return null;
  }

  return numero;
}

export async function validarUbicacionCliente(
  tx: Transaccion,
  datos: {
    clienteId: number;
    subtiendaId: number | null;
    areaId: number | null;
  },
) {
  if (!datos.subtiendaId) {
    return {
      subtiendaId: null,
      areaId: null,
    };
  }

  const [subtienda] = await tx
    .select({
      id: clienteSubtiendas.id,
    })
    .from(clienteSubtiendas)
    .where(
      and(
        eq(clienteSubtiendas.id, datos.subtiendaId),
        eq(clienteSubtiendas.clienteId, datos.clienteId),
        eq(clienteSubtiendas.activo, true),
      ),
    )
    .limit(1);

  if (!subtienda) {
    throw new Error("UBICACION_INVALIDA");
  }

  if (!datos.areaId) {
    return {
      subtiendaId: datos.subtiendaId,
      areaId: null,
    };
  }

  const [area] = await tx
    .select({
      id: clienteAreas.id,
    })
    .from(clienteAreas)
    .where(
      and(
        eq(clienteAreas.id, datos.areaId),
        eq(clienteAreas.subtiendaId, datos.subtiendaId),
        eq(clienteAreas.activo, true),
      ),
    )
    .limit(1);

  if (!area) {
    throw new Error("UBICACION_INVALIDA");
  }

  return {
    subtiendaId: datos.subtiendaId,
    areaId: datos.areaId,
  };
}