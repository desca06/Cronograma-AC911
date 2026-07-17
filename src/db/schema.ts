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

  observaciones: text("observaciones"),

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
      columns: [tabla.trabajoId, tabla.empleadoId],
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

  passwordHash: text("password_hash").notNull(),

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