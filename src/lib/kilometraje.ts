import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  vehiculoKilometraje,
  vehiculos,
} from "@/db/schema";

type Transaccion = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export function leerKm(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  if (!/^\d+$/.test(texto)) {
    throw new Error("KM_INVALIDO");
  }

  const numero = Number(texto);

  if (!Number.isInteger(numero) || numero < 0) {
    throw new Error("KM_INVALIDO");
  }

  return numero;
}

export async function registrarKilometrajeTrabajo(
  tx: Transaccion,
  datos: {
    vehiculoId: number;
    trabajoId: number;
    usuarioId: number | null;
    kmSalida: number;
    kmLlegada: number;
  },
) {
  const [vehiculo] = await tx
    .select({
      id: vehiculos.id,
      kmActual: vehiculos.kmActual,
    })
    .from(vehiculos)
    .where(eq(vehiculos.id, datos.vehiculoId))
    .limit(1);

  if (!vehiculo) {
    throw new Error("VEHICULO_NO_ENCONTRADO");
  }

  if (datos.kmSalida < vehiculo.kmActual) {
    throw new Error("KM_SALIDA_BAJO");
  }

  if (datos.kmLlegada < datos.kmSalida) {
    throw new Error("KM_LLEGADA_BAJO");
  }

  const kmRecorridos = datos.kmLlegada - datos.kmSalida;

  await tx
    .update(vehiculos)
    .set({
      kmActual: datos.kmLlegada,
    })
    .where(eq(vehiculos.id, datos.vehiculoId));

  await tx.insert(vehiculoKilometraje).values({
    vehiculoId: datos.vehiculoId,
    trabajoId: datos.trabajoId,
    usuarioId: datos.usuarioId,
    kmAnterior: vehiculo.kmActual,
    kmSalida: datos.kmSalida,
    kmLlegada: datos.kmLlegada,
    kmRecorridos,
    tipo: "TRABAJO",
    nota: null,
  });
}