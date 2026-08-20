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
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const empleados = pgTable(
  "empleados",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    telefono: text("telefono"),
    puesto: text("puesto")
      .notNull()
      .default("Técnico"),
    activo: boolean("activo")
      .notNull()
      .default(true),


    limiteMinutosExtraMensuales: integer(
      "limite_minutos_extra_mensuales",
    )
      .notNull()
      .default(0),

    creadoEn: timestamp("creado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("empleados_activo_idx").on(
      tabla.activo,
    ),
  ],
);

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
  subtiendaId: integer("subtienda_id").references(
    () => clienteSubtiendas.id,
    { onDelete: "set null" },
  ),
  areaId: integer("area_id").references(
    () => clienteAreas.id,
    { onDelete: "set null" },
  ),
  vehiculoId: integer("vehiculo_id").references(() => vehiculos.id),
  tipo: text("tipo").notNull(),
  descripcion: text("descripcion").notNull(),
  direccion: text("direccion"),
  estado: text("estado").notNull().default("Pendiente"),
  horaInicio: text("hora_inicio"),
  horaFin: text("hora_fin"),
  observaciones: text("observaciones"),
  observacionesTecnico: text("observaciones_tecnico"),
  firmaClienteUrl: text("firma_cliente_url"),
  firmaClienteNombre: text("firma_cliente_nombre"),
  firmaClienteEn: timestamp("firma_cliente_en", {
    mode: "string",
  }),
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


export const trabajoObservacionesTecnico = pgTable(
  "trabajo_observaciones_tecnico",
  {
    id: serial("id").primaryKey(),

    trabajoId: integer("trabajo_id")
      .notNull()
      .references(() => trabajos.id, {
        onDelete: "cascade",
      }),

    usuarioId: integer("usuario_id")
      .references(() => usuarios.id, {
        onDelete: "set null",
      }),

    observacion: text("observacion")
      .notNull(),

    estadoTrabajo: text("estado_trabajo")
      .notNull(),

    creadoEn: timestamp("creado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index(
      "trabajo_obs_tecnico_trabajo_idx",
    ).on(tabla.trabajoId),

    index(
      "trabajo_obs_tecnico_usuario_idx",
    ).on(tabla.usuarioId),

    index(
      "trabajo_obs_tecnico_fecha_idx",
    ).on(tabla.creadoEn),
  ],
);

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

    fecha: date("fecha", {
      mode: "string",
    }).notNull(),

    horaEntrada: time("hora_entrada", {
      withTimezone: false,
    }),

    horaSalida: time("hora_salida", {
      withTimezone: false,
    }),

    estado: text("estado")
      .notNull()
      .default("PRESENTE"),


    minutosHoraExtra: integer(
      "minutos_hora_extra",
    )
      .notNull()
      .default(0),

    observacion: text("observacion"),

    creadoEn: timestamp("creado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    uniqueIndex(
      "asistencias_empleado_fecha_unique",
    ).on(
      tabla.empleadoId,
      tabla.fecha,
    ),

    index("asistencias_fecha_idx").on(
      tabla.fecha,
    ),

    index("asistencias_estado_idx").on(
      tabla.estado,
    ),

    index("asistencias_empleado_idx").on(
      tabla.empleadoId,
    ),
  ],
);

export const vacaciones = pgTable("vacaciones", {
  id: serial("id").primaryKey(),
  empleadoId: integer("empleado_id").notNull().references(() => empleados.id, { onDelete: "restrict" }),
  fechaInicio: date("fecha_inicio", { mode: "string" }).notNull(),
  fechaFin: date("fecha_fin", { mode: "string", }).notNull(),
  cantidadDias: integer("cantidad_dias").notNull(),
  estado: text("estado").notNull().default("PENDIENTE"),
  observacion: text("observacion"),
  autorizadoPor: integer("autorizado_por").references(() => usuarios.id, { onDelete: "set null" }),
  creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { mode: "string" }).notNull().defaultNow()
});

export const permisos = pgTable(
  "permisos",
  {
    id: serial("id").primaryKey(),

    empleadoId: integer("empleado_id")
      .notNull()
      .references(() => empleados.id, {
        onDelete: "restrict",
      }),

    tipo: text("tipo").notNull(),

    /*
     * Se conserva "fecha" como fecha inicial para
     * compatibilidad con los permisos ya existentes.
     */
    fecha: date("fecha", {
      mode: "string",
    }).notNull(),

    /*
     * Los permisos nuevos pueden abarcar varios días.
     * Para registros antiguos puede ser NULL y el
     * sistema usará "fecha" como fecha final.
     */
    fechaFin: date("fecha_fin", {
      mode: "string",
    }),

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

    /*
     * Cantidad de días hábiles solicitados.
     * Los registros antiguos quedan en 1.
     */
    diasSolicitados: integer(
      "dias_solicitados",
    )
      .notNull()
      .default(1),

    /*
     * Cantidad de días que realmente afectaron
     * la bolsa de 15 días de vacaciones.
     *
     * Puede ser 0 cuando el empleado ya tenía
     * vacaciones aprobadas.
     */
    diasDescontadosVacaciones: integer(
      "dias_descontados_vacaciones",
    )
      .notNull()
      .default(0),

    /*
     * Permite distinguir rápidamente los permisos
     * que sí redujeron el saldo de vacaciones.
     */
    afectaVacaciones: boolean(
      "afecta_vacaciones",
    )
      .notNull()
      .default(false),

    autorizadoPor: integer(
      "autorizado_por",
    ).references(() => usuarios.id, {
      onDelete: "set null",
    }),

    creadoEn: timestamp("creado_en", {
      mode: "string",
    })
      .notNull()
      .defaultNow(),

    actualizadoEn: timestamp(
      "actualizado_en",
      {
        mode: "string",
      },
    )
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("permisos_empleado_idx").on(
      tabla.empleadoId,
    ),
    index("permisos_fecha_idx").on(
      tabla.fecha,
    ),
    index("permisos_estado_idx").on(
      tabla.estado,
    ),
  ],
);

export const expedientes = pgTable("expedientes", {
  id: serial("id").primaryKey(),
  empleadoId: integer("empleado_id")
    .notNull()
    .unique()
    .references(() => empleados.id, {
      onDelete: "restrict",
    }),
  codigo: text("codigo").unique(),

  // Ruta pública de la fotografía del empleado.
  fotoUrl: text("foto_url"),

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
    tipo: varchar("tipo", { length: 20 })
      .$type<"ACTIVO" | "CONSUMIBLE">()
      .notNull(),
    unidadMedida: text("unidad_medida")
      .notNull(),
    marca: text("marca"),
    modelo: text("modelo"),
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
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    actualizadoEn: timestamp("actualizado_en", {
      mode: "date",
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
      mode: "date",
    }),
    ultimaSalida: timestamp("ultima_salida", {
      mode: "date",
    }),
    actualizadoEn: timestamp("actualizado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
);

export const movimientosInventario = pgTable("movimientos_inventario", {
  id: serial("id").primaryKey(),
  articuloId: integer("articulo_id")
    .notNull()
    .references(() => articulosInventario.id, { onDelete: "restrict" }),
  usuarioId: integer("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  tipoMovimiento: varchar("tipo_movimiento", { length: 30 })
    .$type<
      | "ENTRADA"
      | "SALIDA"
      | "AJUSTE_POSITIVO"
      | "AJUSTE_NEGATIVO"
    >()
    .notNull(),
  cantidad: integer("cantidad").notNull(),
  existenciaAnterior: integer(
    "existencia_anterior",
  ).notNull(),
  existenciaNueva: integer(
    "existencia_nueva",
  ).notNull(),
  motivo: text("motivo").notNull(),
  observaciones: text("observaciones"),
  documentoReferencia: text(
    "documento_referencia",
  ),
  creadoEn: timestamp("creado_en", { mode: "date" })
    .notNull()
    .defaultNow(),
},
  (tabla) => [
    index("movimientos_inventario_articulo_idx").on(
      tabla.articuloId,
    ),
    index("movimientos_inventario_usuario_idx").on(
      tabla.usuarioId,
    ),
    index("movimientos_inventario_tipo_idx").on(
      tabla.tipoMovimiento,
    ),
    index("movimientos_inventario_fecha_idx").on(
      tabla.creadoEn,
    ),
  ],
);

export const cotizaciones = pgTable(
  "cotizaciones",
  {
    id: serial("id").primaryKey(),

    codigo: text("codigo")
      .notNull()
      .unique(),

    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id, {
        onDelete: "restrict",
      }),

    subtiendaId: integer("subtienda_id").references(
      () => clienteSubtiendas.id,
      { onDelete: "set null" },
    ),

    areaId: integer("area_id").references(
      () => clienteAreas.id,
      { onDelete: "set null" },
    ),

    creadoPorId: integer("creado_por_id")
      .references(() => usuarios.id, {
        onDelete: "set null",
      }),

    colaborador: text("colaborador")
      .notNull()
      .default("PROYECTOS"),

    titulo: text("titulo")
      .notNull(),

    fechaSolicitud: timestamp("fecha_solicitud", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),

    validaHasta: timestamp("valida_hasta", {
      mode: "date",
    }),

    diasVigencia: integer("dias_vigencia")
      .notNull()
      .default(5),

    estado: varchar("estado", {
      length: 20,
    })
      .$type<EstadoCotizacion>()
      .notNull()
      .default("PENDIENTE"),

    observaciones: text("observaciones"),

    condicionesPago: text("condiciones_pago"),

    porcentajeAnticipo: integer(
      "porcentaje_anticipo",
    )
      .notNull()
      .default(70),

    porcentajeFinal: integer(
      "porcentaje_final",
    )
      .notNull()
      .default(30),

    incluyeIva: boolean("incluye_iva")
      .notNull()
      .default(true),

    subtotalProductos: integer(
      "subtotal_productos",
    )
      .notNull()
      .default(0),

    subtotalServicios: integer(
      "subtotal_servicios",
    )
      .notNull()
      .default(0),

    subtotalCostosAdicionales: integer(
      "subtotal_costos_adicionales",
    )
      .notNull()
      .default(0),

    total: integer("total")
      .notNull()
      .default(0),

    creadoEn: timestamp("creado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),

    actualizadoEn: timestamp("actualizado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("cotizaciones_cliente_idx").on(
      tabla.clienteId,
    ),

    index("cotizaciones_estado_idx").on(
      tabla.estado,
    ),

    index("cotizaciones_fecha_idx").on(
      tabla.fechaSolicitud,
    ),
  ],
);

export const cotizacionItems = pgTable(
  "cotizacion_items",
  {
    id: serial("id").primaryKey(),

    cotizacionId: integer("cotizacion_id")
      .notNull()
      .references(() => cotizaciones.id, {
        onDelete: "cascade",
      }),

    tipo: varchar("tipo", {
      length: 25,
    })
      .$type<TipoItemCotizacion>()
      .notNull(),

    nombre: text("nombre")
      .notNull(),

    descripcion: text("descripcion"),

    cantidad: integer("cantidad")
      .notNull()
      .default(1),

    precioUnitario: integer(
      "precio_unitario",
    )
      .notNull()
      .default(0),

    subtotal: integer("subtotal")
      .notNull()
      .default(0),

    orden: integer("orden")
      .notNull()
      .default(0),

    creadoEn: timestamp("creado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("cotizacion_items_cotizacion_idx").on(
      tabla.cotizacionId,
    ),

    index("cotizacion_items_tipo_idx").on(
      tabla.tipo,
    ),
  ],
);

export const proveedores = pgTable("proveedores",
  {
    id: serial("id").primaryKey(),
    codigo: text("codigo").notNull().unique(),
    nombreComercial: text("nombre_comercial").notNull(),
    razonSocial: text("razon_social"),
    nit: text("nit").notNull().unique(),
    telefono: text("telefono"),
    correo: text("correo"),
    direccion: text("direccion"),
    contactoPrincipal: text("contacto_principal"),
    telefonoContacto: text("telefono_contacto"),
    tipo: varchar("tipo", { length: 20, })
      .$type<TipoProveedor>()
      .notNull()
      .default("PRODUCTOS"),
    observaciones: text("observaciones"),
    creadoEn: timestamp("creado_en", { mode: "date", }).notNull().defaultNow(),
    actualizadoEn: timestamp("actualizado_en", { mode: "date", },).notNull().defaultNow(),
  },
  (tabla) => [
    index("proveedores_codigo_idx").on(
      tabla.codigo,
    ),

    index("proveedores_nombre_idx").on(
      tabla.nombreComercial,
    ),

    index("proveedores_nit_idx").on(
      tabla.nit,
    ),
    index("proveedores_tipo_idx").on(
      tabla.tipo,
    ),
  ],
);

export const cronogramaNotas = pgTable(
  "cronograma_notas",
  {
    id: serial("id").primaryKey(),

    fecha: date("fecha", {
      mode: "string",
    })
      .notNull()
      .unique(),

    contenido: text("contenido")
      .notNull()
      .default(""),

    importancia: varchar("importancia", {
      length: 20,
    })
      .notNull()
      .default("PENDIENTE"),

    creadoEn: timestamp("creado_en", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),

    actualizadoEn: timestamp(
      "actualizado_en",
      {
        withTimezone: true,
        mode: "string",
      },
    )
      .notNull()
      .defaultNow(),
  },
);

export const empleadoQr = pgTable(
  "empleado_qr",
  {
    id: serial("id").primaryKey(),

    empleadoId: integer("empleado_id")
      .notNull()
      .unique()
      .references(() => empleados.id, {
        onDelete: "cascade",
      }),

    token: text("token")
      .notNull()
      .unique(),

    generadoEn: timestamp("generado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),

    actualizadoEn: timestamp("actualizado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),

    dispositivoToken: text("dispositivo_token"),

    dispositivoRegistradoEn: timestamp(
      "dispositivo_registrado_en",
      {
        mode: "date",
      },
    ),
  },
  (tabla) => [
    index("empleado_qr_empleado_idx").on(
      tabla.empleadoId,
    ),

    index("empleado_qr_token_idx").on(
      tabla.token,
    ),
  ],
);

export const cronogramaNotasCemaco = pgTable(
  "cronograma_notas_cemaco",
  {
    id: serial("id").primaryKey(),

    fecha: date("fecha", {
      mode: "string",
    })
      .notNull()
      .unique(),

    contenido: text("contenido")
      .notNull()
      .default(""),

    importancia: varchar("importancia", {
      length: 20,
    })
      .notNull()
      .default("PENDIENTE"),

    creadoEn: timestamp("creado_en", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),

    actualizadoEn: timestamp(
      "actualizado_en",
      {
        withTimezone: true,
        mode: "string",
      },
    )
      .notNull()
      .defaultNow(),
  },
);


export type EstadoOrdenCompra =
  | "PENDIENTE"
  | "APROBADA"
  | "COMPLETADA"
  | "CANCELADA";

export type TipoItemOrdenCompra =
  | "PRODUCTO"
  | "SERVICIO";

export type TipoEventoOrdenCompra =
  | "CREADA"
  | "APROBADA"
  | "COMPLETADA"
  | "CANCELADA";

export const ordenesCompra = pgTable(
  "ordenes_compra",
  {
    id: serial("id").primaryKey(),

    codigo: text("codigo")
      .notNull()
      .unique(),

    proveedorId: integer("proveedor_id")
      .notNull()
      .references(() => proveedores.id, {
        onDelete: "restrict",
      }),

    fechaCompra: date("fecha_compra", {
      mode: "string",
    }).notNull(),

    motivo: text("motivo").notNull(),

    facturaReferencia: text(
      "factura_referencia",
    ),

    observaciones: text("observaciones"),

    estado: varchar("estado", {
      length: 20,
    })
      .$type<EstadoOrdenCompra>()
      .notNull()
      .default("PENDIENTE"),

    subtotal: integer("subtotal")
      .notNull()
      .default(0),

    total: integer("total")
      .notNull()
      .default(0),

    completadaEn: timestamp(
      "completada_en",
      {
        mode: "date",
      },
    ),

    creadoEn: timestamp("creado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),

    actualizadoEn: timestamp(
      "actualizado_en",
      {
        mode: "date",
      },
    )
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("ordenes_compra_proveedor_idx").on(
      tabla.proveedorId,
    ),
    index("ordenes_compra_estado_idx").on(
      tabla.estado,
    ),
    index("ordenes_compra_fecha_idx").on(
      tabla.fechaCompra,
    ),
  ],
);

export const ordenCompraItems = pgTable(
  "orden_compra_items",
  {
    id: serial("id").primaryKey(),

    ordenCompraId: integer(
      "orden_compra_id",
    )
      .notNull()
      .references(() => ordenesCompra.id, {
        onDelete: "cascade",
      }),

    tipo: varchar("tipo", {
      length: 20,
    })
      .$type<TipoItemOrdenCompra>()
      .notNull(),

    articuloId: integer("articulo_id")
      .references(() => articulosInventario.id, {
        onDelete: "restrict",
      }),

    descripcion: text("descripcion")
      .notNull(),

    cantidad: integer("cantidad")
      .notNull()
      .default(1),

    precioUnitario: integer(
      "precio_unitario",
    )
      .notNull()
      .default(0),

    subtotal: integer("subtotal")
      .notNull()
      .default(0),

    orden: integer("orden")
      .notNull()
      .default(0),

    creadoEn: timestamp("creado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("orden_items_orden_idx").on(
      tabla.ordenCompraId,
    ),
    index("orden_items_articulo_idx").on(
      tabla.articuloId,
    ),
  ],
);

export const ordenCompraEventos = pgTable(
  "orden_compra_eventos",
  {
    id: serial("id").primaryKey(),

    ordenCompraId: integer(
      "orden_compra_id",
    )
      .notNull()
      .references(() => ordenesCompra.id, {
        onDelete: "cascade",
      }),

    usuarioId: integer("usuario_id")
      .references(() => usuarios.id, {
        onDelete: "set null",
      }),

    tipo: varchar("tipo", {
      length: 20,
    })
      .$type<TipoEventoOrdenCompra>()
      .notNull(),

    estadoAnterior: varchar(
      "estado_anterior",
      {
        length: 20,
      },
    ).$type<EstadoOrdenCompra>(),

    estadoNuevo: varchar("estado_nuevo", {
      length: 20,
    }).$type<EstadoOrdenCompra>(),

    descripcion: text("descripcion"),

    creadoEn: timestamp("creado_en", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    index("orden_eventos_orden_idx").on(
      tabla.ordenCompraId,
    ),
    index("orden_eventos_usuario_idx").on(
      tabla.usuarioId,
    ),
    index("orden_eventos_tipo_idx").on(
      tabla.tipo,
    ),
    index("orden_eventos_fecha_idx").on(
      tabla.creadoEn,
    ),
  ],
);

export const clienteSubtiendas = pgTable(
  "cliente_subtiendas",
  {
    id: serial("id").primaryKey(),
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
  },
  (tabla) => [
    index("cliente_subtiendas_cliente_idx").on(tabla.clienteId),
  ],
);

export const clienteAreas = pgTable(
  "cliente_areas",
  {
    id: serial("id").primaryKey(),
    subtiendaId: integer("subtienda_id")
      .notNull()
      .references(() => clienteSubtiendas.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en", { mode: "string" }).notNull().defaultNow(),
  },
  (tabla) => [
    index("cliente_areas_subtienda_idx").on(tabla.subtiendaId),
  ],
);


export type ClienteSubtienda =
  typeof clienteSubtiendas.$inferSelect;
export type NuevaClienteSubtienda =
  typeof clienteSubtiendas.$inferInsert;

export type ClienteArea = typeof clienteAreas.$inferSelect;
export type NuevaClienteArea = typeof clienteAreas.$inferInsert;
export type OrdenCompra =
  typeof ordenesCompra.$inferSelect;

export type NuevaOrdenCompra =
  typeof ordenesCompra.$inferInsert;

export type OrdenCompraItem =
  typeof ordenCompraItems.$inferSelect;

export type NuevoOrdenCompraItem =
  typeof ordenCompraItems.$inferInsert;

export type OrdenCompraEvento =
  typeof ordenCompraEventos.$inferSelect;

export type NuevoOrdenCompraEvento =
  typeof ordenCompraEventos.$inferInsert;

export type CronogramaNotaCemaco =
  typeof cronogramaNotasCemaco.$inferSelect;

export type NuevaCronogramaNotaCemaco =
  typeof cronogramaNotasCemaco.$inferInsert;

export type EmpleadoQr = typeof empleadoQr.$inferSelect;
export type NuevoEmpleadoQr = typeof empleadoQr.$inferInsert;

export type Notificacion = typeof notificaciones.$inferSelect;
export type NuevaNotificacion = typeof notificaciones.$inferInsert;

export type Evidencia = typeof evidencias.$inferSelect;
export type NuevaEvidencia = typeof evidencias.$inferInsert;

export type TrabajoObservacionTecnico =
  typeof trabajoObservacionesTecnico.$inferSelect;
export type NuevaTrabajoObservacionTecnico =
  typeof trabajoObservacionesTecnico.$inferInsert;

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

export type CronogramaNota = typeof cronogramaNotas.$inferSelect;
export type NuevaCronogramaNota = typeof cronogramaNotas.$inferInsert;

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

export type MovimientoInventario = typeof movimientosInventario.$inferSelect;
export type NuevoMovimientoInventario = typeof movimientosInventario.$inferInsert;

export type TipoMovimientoInventario = | "ENTRADA" | "SALIDA" | "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO";

export type EstadoCotizacion = | "PENDIENTE" | "APROBADA" | "RECHAZADA" | "VENCIDA";

export type TipoItemCotizacion = | "PRODUCTO" | "SERVICIO" | "COSTO_ADICIONAL";

export type TipoProveedor = | "PRODUCTOS" | "SERVICIOS" | "MIXTO";