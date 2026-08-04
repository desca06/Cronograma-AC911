"use client";

import {
  CalendarPlus,
  Check,
  Eraser,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useTransition,
} from "react";

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

type CalendarioEditableProps = {
  mes: string;
  diasMes: number;
  notasIniciales: NotaInicial[];
  trabajos: TrabajoCalendario[];
};

type EstadoNota = {
  contenido: string;
  importancia: Importancia;
};

type CeldaCalendario = {
  fecha: string;
  numeroDia: number;
  perteneceAlMes: boolean;
};

const nombresDias = [
  "DOM.",
  "LUN.",
  "MAR.",
  "MIÉ.",
  "JUE.",
  "VIE.",
  "SÁB.",
];

const estilosImportancia: Record<
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

function normalizarImportancia(
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
  return `${anio}-${String(mes).padStart(2, "0")}-${String(
    dia,
  ).padStart(2, "0")}`;
}

function obtenerCeldasCalendario(
  mes: string,
  diasMes: number,
): CeldaCalendario[] {
  const [anio, numeroMes] = mes
    .split("-")
    .map(Number);

  const indicePrimerDia = new Date(
    Date.UTC(anio, numeroMes - 1, 1),
  ).getUTCDay();

  const diasMesAnterior = new Date(
    Date.UTC(anio, numeroMes - 1, 0),
  ).getUTCDate();

  const totalNecesario =
    indicePrimerDia + diasMes <= 35 ? 35 : 42;

  return Array.from(
    { length: totalNecesario },
    (_, indice) => {
      const posicionDia =
        indice - indicePrimerDia + 1;

      if (posicionDia < 1) {
        const diaAnterior =
          diasMesAnterior + posicionDia;
        const fechaAnterior = new Date(
          Date.UTC(
            anio,
            numeroMes - 2,
            diaAnterior,
          ),
        );

        return {
          fecha: fechaISO(
            fechaAnterior.getUTCFullYear(),
            fechaAnterior.getUTCMonth() + 1,
            fechaAnterior.getUTCDate(),
          ),
          numeroDia: diaAnterior,
          perteneceAlMes: false,
        };
      }

      if (posicionDia > diasMes) {
        const diaSiguiente =
          posicionDia - diasMes;
        const fechaSiguiente = new Date(
          Date.UTC(
            anio,
            numeroMes,
            diaSiguiente,
          ),
        );

        return {
          fecha: fechaISO(
            fechaSiguiente.getUTCFullYear(),
            fechaSiguiente.getUTCMonth() + 1,
            fechaSiguiente.getUTCDate(),
          ),
          numeroDia: diaSiguiente,
          perteneceAlMes: false,
        };
      }

      return {
        fecha: fechaISO(
          anio,
          numeroMes,
          posicionDia,
        ),
        numeroDia: posicionDia,
        perteneceAlMes: true,
      };
    },
  );
}

function obtenerEstiloTrabajo(estado: string) {
  if (estado === "Finalizado") {
    return {
      punto: "bg-emerald-500",
      texto: "text-emerald-800",
    };
  }

  if (
    estado === "En proceso" ||
    estado === "En camino"
  ) {
    return {
      punto: "bg-amber-500",
      texto: "text-amber-800",
    };
  }

  if (estado === "Cancelado") {
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

function formatearFechaEditor(fecha: string) {
  return new Intl.DateTimeFormat("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

export function CalendarioEditable({
  mes,
  diasMes,
  notasIniciales,
  trabajos,
}: CalendarioEditableProps) {
  const router = useRouter();

  const notasBase = useMemo(() => {
    return notasIniciales.reduce<
      Record<string, EstadoNota>
    >((resultado, nota) => {
      resultado[nota.fecha] = {
        contenido: nota.contenido,
        importancia: normalizarImportancia(
          nota.importancia,
        ),
      };

      return resultado;
    }, {});
  }, [notasIniciales]);

  const [notas, setNotas] = useState<
    Record<string, EstadoNota>
  >(notasBase);

  const [fechaEditor, setFechaEditor] =
    useState<string | null>(null);

  const [contenidoEditor, setContenidoEditor] =
    useState("");

  const [importanciaEditor, setImportanciaEditor] =
    useState<Importancia>("PENDIENTE");

  const [mensaje, setMensaje] = useState("");
  const [mensajeExito, setMensajeExito] =
    useState(false);
  const [pendiente, iniciarTransicion] =
    useTransition();

  const celdas = useMemo(
    () => obtenerCeldasCalendario(mes, diasMes),
    [mes, diasMes],
  );

  const trabajosPorFecha = useMemo(() => {
    return trabajos.reduce<
      Record<string, TrabajoCalendario[]>
    >((resultado, trabajo) => {
      if (!resultado[trabajo.fecha]) {
        resultado[trabajo.fecha] = [];
      }

      resultado[trabajo.fecha].push(trabajo);
      return resultado;
    }, {});
  }, [trabajos]);

  const fechaHoy = new Date().toLocaleDateString(
    "en-CA",
    {
      timeZone: "America/Guatemala",
    },
  );

  const abrirEditor = (fecha: string) => {
    const nota = notas[fecha];

    setFechaEditor(fecha);
    setContenidoEditor(nota?.contenido ?? "");
    setImportanciaEditor(
      nota?.importancia ?? "PENDIENTE",
    );
    setMensaje("");
    setMensajeExito(false);
  };

  const cerrarEditor = () => {
    if (pendiente) {
      return;
    }

    setFechaEditor(null);
    setMensaje("");
    setMensajeExito(false);
  };

  const guardar = () => {
    if (!fechaEditor) {
      return;
    }

    const fecha = fechaEditor;
    const contenido = contenidoEditor.trim();
    const importancia = importanciaEditor;

    if (!contenido) {
      setMensaje(
        "Escribe al menos una actividad antes de guardar.",
      );
      setMensajeExito(false);
      return;
    }

    iniciarTransicion(async () => {
      try {
        const formData = new FormData();
        formData.set("fecha", fecha);
        formData.set("contenido", contenido);
        formData.set("importancia", importancia);

        const respuesta =
          await guardarNotaCalendario(formData);

        setMensaje(respuesta.mensaje);
        setMensajeExito(respuesta.ok);

        if (!respuesta.ok) {
          return;
        }

        setNotas((actuales) => ({
          ...actuales,
          [fecha]: {
            contenido,
            importancia,
          },
        }));

        router.refresh();

        window.setTimeout(() => {
          setFechaEditor(null);
          setMensaje("");
          setMensajeExito(false);
        }, 650);
      } catch (error) {
        console.error(
          "Error al guardar la nota del cronograma:",
          error,
        );

        setMensaje(
          "No fue posible guardar la actividad en la base de datos.",
        );
        setMensajeExito(false);
      }
    });
  };

  const eliminar = () => {
    if (!fechaEditor) {
      return;
    }

    const fecha = fechaEditor;

    iniciarTransicion(async () => {
      try {
        const formData = new FormData();
        formData.set("fecha", fecha);

        const respuesta =
          await eliminarNotaCalendario(formData);

        setMensaje(respuesta.mensaje);
        setMensajeExito(respuesta.ok);

        if (!respuesta.ok) {
          return;
        }

        setNotas((actuales) => {
          const nuevasNotas = { ...actuales };
          delete nuevasNotas[fecha];
          return nuevasNotas;
        });

        setContenidoEditor("");
        setImportanciaEditor("PENDIENTE");

        router.refresh();

        window.setTimeout(() => {
          setFechaEditor(null);
          setMensaje("");
          setMensajeExito(false);
        }, 650);
      } catch (error) {
        console.error(
          "Error al eliminar la nota del cronograma:",
          error,
        );

        setMensaje(
          "No fue posible eliminar la actividad de la base de datos.",
        );
        setMensajeExito(false);
      }
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Calendario editable
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona un día para agregar o editar
              actividades. Cada línea se mostrará como una
              entrada distinta.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {(Object.keys(
              estilosImportancia,
            ) as Importancia[]).map(
              (importancia) => {
                const estilo =
                  estilosImportancia[importancia];

                return (
                  <span
                    key={importancia}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${estilo.fondo} ${estilo.borde} ${estilo.texto}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${estilo.punto}`}
                    />
                    {estilo.etiqueta}
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
            {nombresDias.map((nombre) => (
              <div
                key={nombre}
                className="border-r border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-400 last:border-r-0"
              >
                {nombre}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-slate-200">
            {celdas.map((celda) => {
              const nota = notas[celda.fecha];
              const trabajosDia =
                trabajosPorFecha[celda.fecha] ?? [];

              const lineasNota =
                nota?.contenido
                  .split("\n")
                  .map((linea) => linea.trim())
                  .filter(Boolean) ?? [];

              const esHoy = celda.fecha === fechaHoy;
              const estiloNota = nota
                ? estilosImportancia[
                    nota.importancia
                  ]
                : null;

              return (
                <article
                  key={celda.fecha}
                  className={`group relative min-h-[185px] border-b border-r border-slate-200 p-2.5 transition ${
                    celda.perteneceAlMes
                      ? "bg-white hover:bg-slate-50"
                      : "bg-slate-50/80"
                  } ${
                    esHoy
                      ? "z-10 ring-2 ring-inset ring-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={!celda.perteneceAlMes}
                      onClick={() =>
                        abrirEditor(celda.fecha)
                      }
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-semibold transition ${
                        esHoy
                          ? "bg-blue-600 text-white"
                          : celda.perteneceAlMes
                            ? "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                            : "cursor-default text-slate-300"
                      }`}
                    >
                      {celda.numeroDia}
                    </button>

                    {celda.perteneceAlMes && (
                      <button
                        type="button"
                        onClick={() =>
                          abrirEditor(celda.fecha)
                        }
                        title="Agregar o editar actividad"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-blue-50 hover:text-blue-700 group-hover:opacity-100"
                      >
                        <CalendarPlus size={15} />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 max-h-[140px] space-y-1 overflow-y-auto pr-1">
                    {trabajosDia.map((trabajo) => {
                      const estiloTrabajo =
                        obtenerEstiloTrabajo(
                          trabajo.estado,
                        );

                      return (
                        <div
                          key={`trabajo-${trabajo.id}`}
                          className="flex items-start gap-1.5 rounded px-1 py-0.5 text-[11px] leading-4 hover:bg-white"
                          title={`${trabajo.tipo} - ${trabajo.estado}`}
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${estiloTrabajo.punto}`}
                          />

                          <p
                            className={`min-w-0 truncate font-medium ${estiloTrabajo.texto}`}
                          >
                            <span className="font-bold">
                              {trabajo.tipo}
                            </span>{" "}
                            {trabajo.clienteNombre}
                          </p>
                        </div>
                      );
                    })}

                    {lineasNota.map(
                      (linea, indice) => (
                        <button
                          key={`nota-${celda.fecha}-${indice}`}
                          type="button"
                          onClick={() =>
                            abrirEditor(celda.fecha)
                          }
                          className="flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left text-[11px] leading-4 transition hover:bg-white"
                          title={linea}
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${estiloNota?.punto ?? "bg-blue-500"}`}
                          />

                          <span
                            className={`min-w-0 truncate font-medium ${estiloNota?.texto ?? "text-blue-800"}`}
                          >
                            {linea}
                          </span>
                        </button>
                      ),
                    )}

                    {celda.perteneceAlMes &&
                      trabajosDia.length === 0 &&
                      lineasNota.length === 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            abrirEditor(celda.fecha)
                          }
                          className="mt-3 hidden w-full rounded-lg border border-dashed border-slate-200 px-2 py-2 text-center text-[11px] font-medium text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 group-hover:block"
                        >
                          Agregar actividad
                        </button>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {fechaEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-editor-calendario"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Actividad del cronograma
                </p>

                <h3
                  id="titulo-editor-calendario"
                  className="mt-1 text-lg font-bold capitalize text-slate-900"
                >
                  {formatearFechaEditor(fechaEditor)}
                </h3>
              </div>

              <button
                type="button"
                disabled={pendiente}
                onClick={cerrarEditor}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label
                  htmlFor="importancia-editor"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Estado o importancia
                </label>

                <select
                  id="importancia-editor"
                  value={importanciaEditor}
                  onChange={(evento) =>
                    setImportanciaEditor(
                      evento.target
                        .value as Importancia,
                    )
                  }
                  className="form-select w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="CUMPLIDO">
                    Verde — Cumplido
                  </option>
                  <option value="EN_PROCESO">
                    Amarillo — En proceso
                  </option>
                  <option value="PENDIENTE">
                    Azul — Pendiente
                  </option>
                  <option value="URGENTE">
                    Rojo — Urgente
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contenido-editor"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Actividades del día
                </label>

                <textarea
                  id="contenido-editor"
                  value={contenidoEditor}
                  onChange={(evento) =>
                    setContenidoEditor(
                      evento.target.value,
                    )
                  }
                  rows={7}
                  maxLength={1000}
                  placeholder={
                    "Escribe una actividad por línea.\nEjemplo:\nVisita técnica Cemaco\nInstalación de cámaras\nLlamar al cliente"
                  }
                  className="form-control w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Cada línea aparecerá como una entrada
                  separada dentro del día.
                </p>
              </div>

              {mensaje && (
                <p
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${
                    mensajeExito
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  <Check size={16} />
                  {mensaje}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                disabled={pendiente}
                onClick={eliminar}
                className="btn btn-outline-danger inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eraser size={17} />
                Limpiar día
              </button>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={cerrarEditor}
                  className="btn btn-outline-secondary rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={pendiente}
                  onClick={guardar}
                  className="btn btn-primary inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {pendiente
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}