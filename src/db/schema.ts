import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  date,
  time,
  uniqueIndex,
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

export const asistencias = pgTable(
  "asistencias",
  {
    id: serial("id").primaryKey(),

    empleadoId: integer("empleado_id")
      .notNull()
      .references(() => empleados.id, {
        onDelete: "restrict",
      }),

    fecha: date("fecha", { mode: "string" }).notNull(),

    horaEntrada: time("hora_entrada", {
      withTimezone: false,
    }),

    horaSalida: time("hora_salida", {
      withTimezone: false,
    }),

    estado: text("estado").notNull().default("PRESENTE"),

    observacion: text("observacion"),

    creadoEn: timestamp("creado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
  (tabla) => ({
    empleadoFechaUnica: uniqueIndex(
      "asistencias_empleado_fecha_unique",
    ).on(tabla.empleadoId, tabla.fecha),
  }),
);

export const vacaciones = pgTable("vacaciones", {
  id: serial("id").primaryKey(),

  empleadoId: integer("empleado_id")
    .notNull()
    .references(() => empleados.id, {
      onDelete: "restrict",
    }),

  fechaInicio: date("fecha_inicio", {
    mode: "string",
  }).notNull(),

  fechaFin: date("fecha_fin", {
    mode: "string",
  }).notNull(),

  cantidadDias: integer("cantidad_dias").notNull(),

  estado: text("estado")
    .notNull()
    .default("PENDIENTE"),

  observacion: text("observacion"),

  autorizadoPor: integer("autorizado_por").references(
    () => usuarios.id,
    {
      onDelete: "set null",
    },
  ),

  creadoEn: timestamp("creado_en", {
    mode: "string",
  })
    .notNull()
    .defaultNow(),

  actualizadoEn: timestamp("actualizado_en", {
    mode: "string",
  })
    .notNull()
    .defaultNow(),
});

export const permisos = pgTable("permisos", {
  id: serial("id").primaryKey(),

  empleadoId: integer("empleado_id")
    .notNull()
    .references(() => empleados.id, {
      onDelete: "restrict",
    }),

  tipo: text("tipo").notNull(),

  fecha: date("fecha", {
    mode: "string",
  }).notNull(),

  horaInicio: time("hora_inicio", {
    withTimezone: false,
  }).notNull(),

  horaFin: time("hora_fin", {
    withTimezone: false,
  }).notNull(),

  motivo: text("motivo").notNull(),

  observacion: text("observacion"),

  estado: text("estado")
    .notNull()
    .default("PENDIENTE"),

  autorizadoPor: integer("autorizado_por").references(
    () => usuarios.id,
    {
      onDelete: "set null",
    },
  ),

  creadoEn: timestamp("creado_en", {
    mode: "string",
  })
    .notNull()
    .defaultNow(),

  actualizadoEn: timestamp("actualizado_en", {
    mode: "string",
  })
    .notNull()
    .defaultNow(),
});

export const expedientes = pgTable("expedientes", {
  id: serial("id").primaryKey(),

  empleadoId: integer("empleado_id")
    .notNull()
    .unique()
    .references(() => empleados.id, {
      onDelete: "restrict",
    }),

  codigo: text("codigo").unique(),

  dpi: text("dpi").notNull(),

  nit: text("nit"),

  igss: text("igss"),

  fechaIngreso: date("fecha_ingreso", {
    mode: "string",
  }).notNull(),

  contactoEmergencia: text(
    "contacto_emergencia",
  ).notNull(),

  telefonoEmergencia: text(
    "telefono_emergencia",
  ).notNull(),

  direccion: text("direccion").notNull(),

  observaciones: text("observaciones"),

  estado: text("estado")
    .notNull()
    .default("ACTIVO"),

  creadoEn: timestamp("creado_en", {
    mode: "string",
  })
    .notNull()
    .defaultNow(),

  actualizadoEn: timestamp("actualizado_en", {
    mode: "string",
  })
    .notNull()
    .defaultNow(),
});

export const categoriasInventario = pgTable(
  "categorias_inventario",
  {
    id: serial("id").primaryKey(),

    nombre: text("nombre")
      .notNull()
      .unique(),

    descripcion: text("descripcion"),

    estado: text("estado")
      .notNull()
      .default("ACTIVO"),

    creadoEn: timestamp("creado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),

    actualizadoEn: timestamp("actualizado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
);

export const articulosInventario = pgTable(
  "articulos_inventario",
  {
    id: serial("id").primaryKey(),

    codigo: text("codigo").unique(),

    nombre: text("nombre").notNull(),

    descripcion: text("descripcion"),

    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categoriasInventario.id, {
        onDelete: "restrict",
      }),

    tipo: text("tipo").notNull(),

    unidadMedida: text("unidad_medida")
      .notNull(),

    marca: text("marca"),

    modelo: text("modelo"),

    capacidad: text("capacidad"),

    costoReferencia: integer(
      "costo_referencia",
    )
      .notNull()
      .default(0),

    stockMinimo: integer("stock_minimo")
      .notNull()
      .default(0),

    controlaStock: boolean("controla_stock")
      .notNull()
      .default(true),

    estado: text("estado")
      .notNull()
      .default("ACTIVO"),

    creadoEn: timestamp("creado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),

    actualizadoEn: timestamp("actualizado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
);

export const existenciasInventario = pgTable(
  "existencias_inventario",
  {
    id: serial("id").primaryKey(),

    articuloId: integer("articulo_id")
      .notNull()
      .unique()
      .references(() => articulosInventario.id, {
        onDelete: "cascade",
      }),

    cantidadActual: integer("cantidad_actual")
      .notNull()
      .default(0),

    cantidadReservada: integer(
      "cantidad_reservada",
    )
      .notNull()
      .default(0),

    ultimaEntrada: timestamp("ultima_entrada", {
      mode: "string",
    }),

    ultimaSalida: timestamp("ultima_salida", {
      mode: "string",
    }),

    actualizadoEn: timestamp("actualizado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
);


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
export type Asistencia = typeof asistencias.$inferSelect;
export type NuevaAsistencia = typeof asistencias.$inferInsert;
export type Vacacion = typeof vacaciones.$inferSelect;
export type NuevaVacacion = typeof vacaciones.$inferInsert;
export type Permiso = typeof permisos.$inferSelect;
export type NuevoPermiso = typeof permisos.$inferInsert;
export type Expediente = typeof expedientes.$inferSelect;
export type NuevoExpediente = typeof expedientes.$inferInsert;
export type CategoriaInventario = typeof categoriasInventario.$inferSelect;
export type NuevaCategoriaInventario = typeof categoriasInventario.$inferInsert;
export type ArticuloInventario = typeof articulosInventario.$inferSelect;
export type NuevoArticuloInventario = typeof articulosInventario.$inferInsert;
export type ExistenciaInventario = typeof existenciasInventario.$inferSelect;
export type NuevaExistenciaInventario = typeof existenciasInventario.$inferInsert;