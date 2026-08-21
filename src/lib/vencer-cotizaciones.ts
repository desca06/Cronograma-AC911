import { sql } from "drizzle-orm";

import { db } from "@/db";

export function fechaHoyGuatemala() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
  });
}

export async function vencerCotizacionesCaducadas() {
  const hoy = fechaHoyGuatemala();

  await db.execute(sql`
    UPDATE cotizaciones AS c
    SET
      estado = 'VENCIDA',
      actualizado_en = now()
    WHERE c.estado IN ('PENDIENTE', 'APROBADA')
      AND c.valida_hasta IS NOT NULL
      AND c.valida_hasta::date < ${hoy}::date
      AND NOT EXISTS (
        SELECT 1
        FROM cotizacion_trabajos AS ct
        WHERE ct.cotizacion_id = c.id
      )
  `);
}