"use client";

import {
  CalendarPlus,
  Check,
  Eraser,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  eliminarNotaCalendario,
  guardarNotaCalendario,
} from "./actions";

type Importancia =
  | "CUMPLIDO"
  | "EN_PROCESO"
  | "PENDIENTE"
  | "URGENTE";

type NotaInicial = {
  id: number;
  fecha: string;
  contenido: string;
  importancia: string;
  actualizadoEn: string;
};

type TrabajoCalendario = {
  id: number;
  fecha: string;
  tipo: string;
  estado: string;
  clienteNombre: string;
};

type Props = {
  mes: string;
  diasMes: number;
  notasIniciales: NotaInicial[];
  trabajos: TrabajoCalendario[];
};

type EstadoNota = {
  contenido: string;
  importancia: Importancia;
};

type Celda = {
  fecha: string;
  numeroDia: number;
  perteneceAlMes: boolean;
};

const dias = [
  "DOM.",
  "LUN.",
  "MAR.",
  "MIÉ.",
  "JUE.",
  "VIE.",
  "SÁB.",
];

const estilos: Record<
  Importancia,
  {
    punto: string;
    fondo: string;
    borde: string;
    texto: string;
    etiqueta: string;
  }
> = {
  CUMPLIDO: {
    punto: "bg-emerald-500",
    fondo: "bg-emerald-50",
    borde: "border-emerald-200",
    texto: "text-emerald-800",
    etiqueta: "Cumplido",
  },
  EN_PROCESO: {
    punto: "bg-amber-500",
    fondo: "bg-amber-50",
    borde: "border-amber-200",
    texto: "text-amber-800",
    etiqueta: "En proceso",
  },
  PENDIENTE: {
    punto: "bg-blue-500",
    fondo: "bg-blue-50",
    borde: "border-blue-200",
    texto: "text-blue-800",
    etiqueta: "Pendiente",
  },
  URGENTE: {
    punto: "bg-red-500",
    fondo: "bg-red-50",
    borde: "border-red-200",
    texto: "text-red-800",
    etiqueta: "Urgente",
  },
};

function normalizar(
  valor: string,
): Importancia {
  if (
    valor === "CUMPLIDO" ||
    valor === "EN_PROCESO" ||
    valor === "URGENTE"
  ) {
    return valor;
  }

  return "PENDIENTE";
}

function fechaISO(
  anio: number,
  mes: number,
  dia: number,
) {
  return `${anio}-${String(
    mes,
  ).padStart(2, "0")}-${String(
    dia,
  ).padStart(2, "0")}`;
}

function crearCeldas(
  mes: string,
  diasMes: number,
): Celda[] {
  const [
    anio,
    numeroMes,
  ] = mes
    .split("-")
    .map(Number);

  const primerDia =
    new Date(
      Date.UTC(
        anio,
        numeroMes - 1,
        1,
      ),
    ).getUTCDay();

  const diasAnterior =
    new Date(
      Date.UTC(
        anio,
        numeroMes - 1,
        0,
      ),
    ).getUTCDate();

  const total =
    primerDia +
      diasMes <=
    35
      ? 35
      : 42;

  return Array.from(
    {
      length: total,
    },
    (_, indice) => {
      const posicion =
        indice -
        primerDia +
        1;

      if (posicion < 1) {
        const d =
          diasAnterior +
          posicion;

        const fecha =
          new Date(
            Date.UTC(
              anio,
              numeroMes - 2,
              d,
            ),
          );

        return {
          fecha: fechaISO(
            fecha.getUTCFullYear(),
            fecha.getUTCMonth() +
              1,
            fecha.getUTCDate(),
          ),
          numeroDia: d,
          perteneceAlMes:
            false,
        };
      }

      if (
        posicion >
        diasMes
      ) {
        const d =
          posicion -
          diasMes;

        const fecha =
          new Date(
            Date.UTC(
              anio,
              numeroMes,
              d,
            ),
          );

        return {
          fecha: fechaISO(
            fecha.getUTCFullYear(),
            fecha.getUTCMonth() +
              1,
            fecha.getUTCDate(),
          ),
          numeroDia: d,
          perteneceAlMes:
            false,
        };
      }

      return {
        fecha: fechaISO(
          anio,
          numeroMes,
          posicion,
        ),
        numeroDia:
          posicion,
        perteneceAlMes:
          true,
      };
    },
  );
}

function estiloTrabajo(
  estado: string,
) {
  if (
    estado === "Finalizado"
  ) {
    return {
      punto:
        "bg-emerald-500",
      texto:
        "text-emerald-800",
    };
  }

  if (
    estado ===
      "En proceso" ||
    estado === "En camino"
  ) {
    return {
      punto:
        "bg-amber-500",
      texto:
        "text-amber-800",
    };
  }

  if (
    estado === "Cancelado"
  ) {
    return {
      punto: "bg-red-500",
      texto: "text-red-800",
    };
  }

  return {
    punto: "bg-blue-500",
    texto: "text-blue-800",
  };
}

function fechaLarga(
  fecha: string,
) {
  return new Intl.DateTimeFormat(
    "es-GT",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      `${fecha}T00:00:00Z`,
    ),
  );
}

export function CalendarioEditable({
  mes,
  diasMes,
  notasIniciales,
  trabajos,
}: Props) {
  const router =
    useRouter();

  const notasBase =
    useMemo(
      () =>
        notasIniciales.reduce<
          Record<
            string,
            EstadoNota
          >
        >(
          (
            resultado,
            nota,
          ) => {
            resultado[
              nota.fecha
            ] = {
              contenido:
                nota.contenido,
              importancia:
                normalizar(
                  nota.importancia,
                ),
            };

            return resultado;
          },
          {},
        ),
      [notasIniciales],
    );

  const [
    notas,
    setNotas,
  ] = useState<
    Record<
      string,
      EstadoNota
    >
  >(notasBase);

  const [
    fechaEditor,
    setFechaEditor,
  ] = useState<
    string | null
  >(null);

  const [
    contenido,
    setContenido,
  ] = useState("");

  const [
    importancia,
    setImportancia,
  ] =
    useState<Importancia>(
      "PENDIENTE",
    );

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState(false);

  const [
    pendiente,
    iniciar,
  ] = useTransition();

  const celdas =
    useMemo(
      () =>
        crearCeldas(
          mes,
          diasMes,
        ),
      [
        mes,
        diasMes,
      ],
    );

  const trabajosPorFecha =
    useMemo(
      () =>
        trabajos.reduce<
          Record<
            string,
            TrabajoCalendario[]
          >
        >(
          (
            resultado,
            trabajo,
          ) => {
            if (
              !resultado[
                trabajo.fecha
              ]
            ) {
              resultado[
                trabajo.fecha
              ] = [];
            }

            resultado[
              trabajo.fecha
            ].push(trabajo);

            return resultado;
          },
          {},
        ),
      [trabajos],
    );

  const hoy =
    new Date()
      .toLocaleDateString(
        "en-CA",
        {
          timeZone:
            "America/Guatemala",
        },
      );

  function abrir(
    fecha: string,
  ) {
    const nota =
      notas[fecha];

    setFechaEditor(fecha);
    setContenido(
      nota?.contenido ??
        "",
    );
    setImportancia(
      nota?.importancia ??
        "PENDIENTE",
    );
    setMensaje("");
    setMensajeExito(
      false,
    );
  }

  function cerrar() {
    if (pendiente) {
      return;
    }

    setFechaEditor(null);
    setMensaje("");
  }

  function guardar() {
    if (!fechaEditor) {
      return;
    }

    if (
      !contenido.trim()
    ) {
      setMensaje(
        "Escribe al menos una actividad.",
      );
      setMensajeExito(
        false,
      );
      return;
    }

    iniciar(
      async () => {
        const data =
          new FormData();

        data.set(
          "fecha",
          fechaEditor,
        );
        data.set(
          "contenido",
          contenido.trim(),
        );
        data.set(
          "importancia",
          importancia,
        );

        const respuesta =
          await guardarNotaCalendario(
            data,
          );

        setMensaje(
          respuesta.mensaje,
        );
        setMensajeExito(
          respuesta.ok,
        );

        if (
          !respuesta.ok
        ) {
          return;
        }

        setNotas(
          (actuales) => ({
            ...actuales,
            [fechaEditor]: {
              contenido:
                contenido.trim(),
              importancia,
            },
          }),
        );

        router.refresh();
      },
    );
  }

  function eliminar() {
    if (!fechaEditor) {
      return;
    }

    iniciar(
      async () => {
        const data =
          new FormData();

        data.set(
          "fecha",
          fechaEditor,
        );

        const respuesta =
          await eliminarNotaCalendario(
            data,
          );

        setMensaje(
          respuesta.mensaje,
        );
        setMensajeExito(
          respuesta.ok,
        );

        if (
          !respuesta.ok
        ) {
          return;
        }

        setNotas(
          (actuales) => {
            const copia = {
              ...actuales,
            };

            delete copia[
              fechaEditor
            ];

            return copia;
          },
        );

        setContenido("");
        setImportancia(
          "PENDIENTE",
        );

        router.refresh();
      },
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Calendario editable
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Los trabajos azules, amarillos, verdes o rojos son clickeables y abren Trabajos asignados.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(
                estilos,
              ) as Importancia[]).map(
                (item) => {
                  const e =
                    estilos[
                      item
                    ];

                  return (
                    <span
                      key={
                        item
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${e.fondo} ${e.borde} ${e.texto}`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${e.punto}`}
                      />
                      {
                        e.etiqueta
                      }
                    </span>
                  );
                },
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100">
              {dias.map(
                (dia) => (
                  <div
                    key={
                      dia
                    }
                    className="border-r border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-400 last:border-r-0"
                  >
                    {dia}
                  </div>
                ),
              )}
            </div>

            <div className="grid grid-cols-7 border-l border-slate-200">
              {celdas.map(
                (celda) => {
                  const nota =
                    notas[
                      celda.fecha
                    ];

                  const trabajosDia =
                    trabajosPorFecha[
                      celda.fecha
                    ] ?? [];

                  const lineas =
                    nota?.contenido
                      .split(
                        "\n",
                      )
                      .map(
                        (
                          linea,
                        ) =>
                          linea.trim(),
                      )
                      .filter(
                        Boolean,
                      ) ?? [];

                  const esHoy =
                    celda.fecha ===
                    hoy;

                  const estiloNota =
                    nota
                      ? estilos[
                          nota
                            .importancia
                        ]
                      : null;

                  return (
                    <article
                      key={
                        celda.fecha
                      }
                      className={`group min-h-[185px] border-b border-r border-slate-200 p-2.5 ${
                        celda.perteneceAlMes
                          ? "bg-white hover:bg-slate-50"
                          : "bg-slate-50/80"
                      } ${
                        esHoy
                          ? "ring-2 ring-inset ring-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          disabled={
                            !celda.perteneceAlMes
                          }
                          onClick={() =>
                            abrir(
                              celda.fecha,
                            )
                          }
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full text-sm font-semibold ${
                            esHoy
                              ? "bg-blue-600 text-white"
                              : celda.perteneceAlMes
                                ? "text-slate-600 hover:bg-blue-50"
                                : "text-slate-300"
                          }`}
                        >
                          {
                            celda.numeroDia
                          }
                        </button>

                        {celda.perteneceAlMes && (
                          <button
                            type="button"
                            onClick={() =>
                              abrir(
                                celda.fecha,
                              )
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-0 hover:bg-blue-50 hover:text-blue-700 group-hover:opacity-100"
                          >
                            <CalendarPlus
                              size={15}
                            />
                          </button>
                        )}
                      </div>

                      <div className="mt-2 max-h-[140px] space-y-1 overflow-y-auto pr-1">
                        {trabajosDia.map(
                          (
                            trabajo,
                          ) => {
                            const e =
                              estiloTrabajo(
                                trabajo.estado,
                              );

                            return (
                              <Link
                                key={`trabajo-${trabajo.id}`}
                                href={`/trabajos-asignados?trabajoId=${trabajo.id}#trabajo-${trabajo.id}`}
                                title={`${trabajo.tipo} - ${trabajo.estado}`}
                                className="flex items-start gap-1.5 rounded px-1 py-0.5 text-[11px] leading-4 transition hover:bg-blue-50"
                              >
                                <span
                                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${e.punto}`}
                                />

                                <span
                                  className={`min-w-0 truncate font-medium ${e.texto}`}
                                >
                                  <strong>
                                    {
                                      trabajo.tipo
                                    }
                                  </strong>{" "}
                                  {
                                    trabajo.clienteNombre
                                  }
                                </span>
                              </Link>
                            );
                          },
                        )}

                        {lineas.map(
                          (
                            linea,
                            indice,
                          ) => (
                            <button
                              key={`nota-${celda.fecha}-${indice}`}
                              type="button"
                              onClick={() =>
                                abrir(
                                  celda.fecha,
                                )
                              }
                              className="flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left text-[11px] leading-4 hover:bg-white"
                            >
                              <span
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                  estiloNota?.punto ??
                                  "bg-blue-500"
                                }`}
                              />

                              <span
                                className={`min-w-0 truncate font-medium ${
                                  estiloNota?.texto ??
                                  "text-blue-800"
                                }`}
                              >
                                {
                                  linea
                                }
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </section>

      {fechaEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Actividades del día
                </h3>

                <p className="mt-1 text-sm capitalize text-slate-500">
                  {fechaLarga(
                    fechaEditor,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  cerrar
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <textarea
              rows={7}
              value={
                contenido
              }
              onChange={(
                evento,
              ) =>
                setContenido(
                  evento
                    .target
                    .value,
                )
              }
              placeholder="Una actividad por línea..."
              className="mt-5 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <select
              value={
                importancia
              }
              onChange={(
                evento,
              ) =>
                setImportancia(
                  evento
                    .target
                    .value as Importancia,
                )
              }
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="CUMPLIDO">
                Cumplido
              </option>
              <option value="EN_PROCESO">
                En proceso
              </option>
              <option value="PENDIENTE">
                Pendiente
              </option>
              <option value="URGENTE">
                Urgente
              </option>
            </select>

            {mensaje && (
              <div
                className={`mt-4 rounded-xl p-3 text-sm font-semibold ${
                  mensajeExito
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {mensaje}
              </div>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={
                  eliminar
                }
                disabled={
                  pendiente
                }
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <Eraser
                  size={17}
                />
                Eliminar
              </button>

              <button
                type="button"
                onClick={
                  guardar
                }
                disabled={
                  pendiente
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {mensajeExito ? (
                  <Check
                    size={17}
                  />
                ) : (
                  <Save
                    size={17}
                  />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}