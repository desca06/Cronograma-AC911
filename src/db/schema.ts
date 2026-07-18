import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const empleados = sqliteTable("empleados", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),

  nombre: text("nombre").notNull(),

  telefono: text("telefono"),

  puesto: text("puesto")
    .notNull()
    .default("Técnico"),

  activo: integer("activo", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  creadoEn: text("creado_en")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const clientes = sqliteTable("clientes", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),

  nombre: text("nombre").notNull(),

  telefono: text("telefono"),

  direccion: text("direccion"),

  notas: text("notas"),

  activo: integer("activo", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  creadoEn: text("creado_en")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const vehiculos = sqliteTable("vehiculos", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),

  nombre: text("nombre").notNull(),

  placa: text("placa"),

  marca: text("marca"),

  modelo: text("modelo"),

  estado: text("estado")
    .notNull()
    .default("Disponible"),

  activo: integer("activo", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  creadoEn: text("creado_en")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const trabajos = sqliteTable("trabajos", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),

  fecha: text("fecha").notNull(),

  clienteId: integer("cliente_id")
    .notNull()
    .references(() => clientes.id),

  vehiculoId: integer("vehiculo_id")
    .references(() => vehiculos.id),

  tipo: text("tipo").notNull(),

  descripcion: text("descripcion").notNull(),

  direccion: text("direccion"),

  estado: text("estado")
    .notNull()
    .default("Pendiente"),

  horaInicio: text("hora_inicio"),

  horaFin: text("hora_fin"),

  /*
   * Indicaciones agregadas por el supervisor.
   * El técnico solamente puede leerlas.
   */
  observaciones: text("observaciones"),

  /*
   * Observaciones independientes escritas
   * por el técnico durante el trabajo.
   */
  observacionesTecnico: text(
    "observaciones_tecnico",
  ),

  creadoEn: text("creado_en")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const trabajoEmpleados = sqliteTable(
  "trabajo_empleados",
  {
    trabajoId: integer("trabajo_id")
      .notNull()
      .references(() => trabajos.id),

    empleadoId: integer("empleado_id")
      .notNull()
      .references(() => empleados.id),
  },
  (tabla) => [
    primaryKey({
      columns: [
        tabla.trabajoId,
        tabla.empleadoId,
      ],
    }),
  ],
);

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),

  empleadoId: integer("empleado_id")
    .references(() => empleados.id),

  nombre: text("nombre").notNull(),

  correo: text("correo")
    .notNull()
    .unique(),

  passwordHash: text(
    "password_hash",
  ).notNull(),

  rol: text("rol")
    .notNull()
    .default("TECNICO"),

  activo: integer("activo", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  creadoEn: text("creado_en")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const notificaciones = sqliteTable(
  "notificaciones",
  {
    id: integer("id").primaryKey({
      autoIncrement: true,
    }),

    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id, {
        onDelete: "cascade",
      }),

    trabajoId: integer("trabajo_id")
      .references(() => trabajos.id, {
        onDelete: "set null",
      }),

    titulo: text("titulo").notNull(),

    mensaje: text("mensaje").notNull(),

    tipo: text("tipo")
      .notNull()
      .default("ASIGNACION"),

    leida: integer("leida", {
      mode: "boolean",
    })
      .notNull()
      .default(false),

    creadoEn: text("creado_en")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
);

export type Notificacion =
  typeof notificaciones.$inferSelect;

export type NuevaNotificacion =
  typeof notificaciones.$inferInsert;

export const evidencias = sqliteTable("evidencias", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),

  trabajoId: integer("trabajo_id")
    .notNull()
    .references(() => trabajos.id, {
      onDelete: "cascade",
    }),

  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id),

  archivoUrl: text("archivo_url").notNull(),

  nombreOriginal: text(
    "nombre_original",
  ).notNull(),

  descripcion: text("descripcion"),

  creadoEn: text("creado_en")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Evidencia =
  typeof evidencias.$inferSelect;

export type NuevaEvidencia =
  typeof evidencias.$inferInsert;

export type Usuario =
  typeof usuarios.$inferSelect;

export type NuevoUsuario =
  typeof usuarios.$inferInsert;

export type Empleado =
  typeof empleados.$inferSelect;

export type NuevoEmpleado =
  typeof empleados.$inferInsert;

export type Cliente =
  typeof clientes.$inferSelect;

export type NuevoCliente =
  typeof clientes.$inferInsert;

export type Vehiculo =
  typeof vehiculos.$inferSelect;

export type NuevoVehiculo =
  typeof vehiculos.$inferInsert;

export type Trabajo =
  typeof trabajos.$inferSelect;

export type NuevoTrabajo =
  typeof trabajos.$inferInsert;