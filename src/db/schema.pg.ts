import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const empleados = pgTable("empleados", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  telefono: text("telefono"),
  puesto: text("puesto").notNull().default("Técnico"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  telefono: text("telefono"),
  direccion: text("direccion"),
  notas: text("notas"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
});

export const vehiculos = pgTable("vehiculos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  placa: text("placa"),
  marca: text("marca"),
  modelo: text("modelo"),
  estado: text("estado").notNull().default("Disponible"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
});

export const trabajos = pgTable("trabajos", {
  id: serial("id").primaryKey(),
  fecha: text("fecha").notNull(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  vehiculoId: integer("vehiculo_id").references(() => vehiculos.id),
  tipo: text("tipo").notNull(),
  descripcion: text("descripcion").notNull(),
  direccion: text("direccion"),
  estado: text("estado").notNull().default("Pendiente"),
  horaInicio: text("hora_inicio"),
  horaFin: text("hora_fin"),
  observaciones: text("observaciones"),
  observacionesTecnico: text("observaciones_tecnico"),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
});

export const trabajoEmpleados = pgTable(
  "trabajo_empleados",
  {
    trabajoId: integer("trabajo_id").notNull().references(() => trabajos.id),
    empleadoId: integer("empleado_id").notNull().references(() => empleados.id),
  },
  (tabla) => [
    primaryKey({
      columns: [tabla.trabajoId, tabla.empleadoId],
    }),
  ],
);

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  empleadoId: integer("empleado_id").references(() => empleados.id),
  nombre: text("nombre").notNull(),
  correo: text("correo").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol").notNull().default("TECNICO"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
});

export const notificaciones = pgTable("notificaciones", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  trabajoId: integer("trabajo_id")
    .references(() => trabajos.id, { onDelete: "set null" }),
  titulo: text("titulo").notNull(),
  mensaje: text("mensaje").notNull(),
  tipo: text("tipo").notNull().default("ASIGNACION"),
  leida: boolean("leida").notNull().default(false),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
});

export const suscripcionesPush = pgTable("suscripciones_push", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  navegador: text("navegador"),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { mode: "string" })
    .notNull()
    .defaultNow(),
});

export const evidencias = pgTable("evidencias", {
  id: serial("id").primaryKey(),
  trabajoId: integer("trabajo_id")
    .notNull()
    .references(() => trabajos.id, { onDelete: "cascade" }),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  archivoUrl: text("archivo_url").notNull(),
  nombreOriginal: text("nombre_original").notNull(),
  descripcion: text("descripcion"),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
});

export type Notificacion = typeof notificaciones.$inferSelect;
export type NuevaNotificacion = typeof notificaciones.$inferInsert;
export type Evidencia = typeof evidencias.$inferSelect;
export type NuevaEvidencia = typeof evidencias.$inferInsert;
export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type Empleado = typeof empleados.$inferSelect;
export type NuevoEmpleado = typeof empleados.$inferInsert;
export type Cliente = typeof clientes.$inferSelect;
export type NuevoCliente = typeof clientes.$inferInsert;
export type Vehiculo = typeof vehiculos.$inferSelect;
export type NuevoVehiculo = typeof vehiculos.$inferInsert;
export type Trabajo = typeof trabajos.$inferSelect;
export type NuevoTrabajo = typeof trabajos.$inferInsert;
export type SuscripcionPush = typeof suscripcionesPush.$inferSelect;
export type NuevaSuscripcionPush = typeof suscripcionesPush.$inferInsert;
