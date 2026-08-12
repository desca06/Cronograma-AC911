import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import {
  cotizaciones,
  trabajos,
} from "@/db/schema";


export const cotizacionTrabajos =
  pgTable(
    "cotizacion_trabajos",
    {
      id: serial("id")
        .primaryKey(),

      cotizacionId: integer(
        "cotizacion_id",
      )
        .notNull()
        .references(
          () => cotizaciones.id,
          {
            onDelete: "restrict",
          },
        ),

      trabajoId: integer(
        "trabajo_id",
      )
        .notNull()
        .references(
          () => trabajos.id,
          {
            onDelete: "cascade",
          },
        ),

      creadoEn: timestamp(
        "creado_en",
        {
          mode: "date",
        },
      )
        .notNull()
        .defaultNow(),
    },
    (tabla) => [
      uniqueIndex(
        "cotizacion_trabajos_cotizacion_unique",
      ).on(
        tabla.cotizacionId,
      ),

      uniqueIndex(
        "cotizacion_trabajos_trabajo_unique",
      ).on(
        tabla.trabajoId,
      ),

      index(
        "cotizacion_trabajos_cotizacion_idx",
      ).on(
        tabla.cotizacionId,
      ),

      index(
        "cotizacion_trabajos_trabajo_idx",
      ).on(
        tabla.trabajoId,
      ),
    ],
  );

export type CotizacionTrabajo =
  typeof cotizacionTrabajos.$inferSelect;

export type NuevaCotizacionTrabajo =
  typeof cotizacionTrabajos.$inferInsert;