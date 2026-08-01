"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calculator,
  CircleDollarSign,
  FileText,
  PackagePlus,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";

import { crearCotizacion } from "../actions";

type Cliente = {
  id: number;
  nombre: string;
};

type TipoItem =
  | "PRODUCTO"
  | "SERVICIO"
  | "COSTO_ADICIONAL";

type ItemCotizacion = {
  idTemporal: string;
  tipo: TipoItem;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

type Props = {
  clientes: Cliente[];
  fechaInicial: string;
};

function crearItem(tipo: TipoItem): ItemCotizacion {
  return {
    idTemporal: crypto.randomUUID(),
    tipo,
    nombre: "",
    descripcion: "",
    cantidad: 1,
    precioUnitario: 0,
  };
}

function formatearDinero(valor: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(valor);
}

function obtenerNombreTipo(tipo: TipoItem) {
  if (tipo === "PRODUCTO") return "Producto";
  if (tipo === "SERVICIO") return "Servicio";

  return "Costo adicional";
}

export function FormularioCotizacion({
  clientes,
  fechaInicial,
}: Props) {
  const [items, setItems] = useState<ItemCotizacion[]>([
    crearItem("PRODUCTO"),
  ]);

  const [porcentajeAnticipo, setPorcentajeAnticipo] =
    useState(70);

  const porcentajeFinal = Math.max(
    100 - porcentajeAnticipo,
    0,
  );

  const totales = useMemo(() => {
    let productos = 0;
    let servicios = 0;
    let costosAdicionales = 0;

    for (const item of items) {
      const subtotal =
        Number(item.cantidad || 0) *
        Number(item.precioUnitario || 0);

      if (item.tipo === "PRODUCTO") {
        productos += subtotal;
      } else if (item.tipo === "SERVICIO") {
        servicios += subtotal;
      } else {
        costosAdicionales += subtotal;
      }
    }

    return {
      productos,
      servicios,
      costosAdicionales,
      total:
        productos +
        servicios +
        costosAdicionales,
    };
  }, [items]);

  function agregarItem(tipo: TipoItem) {
    setItems((actuales) => [
      ...actuales,
      crearItem(tipo),
    ]);
  }

  function actualizarItem<K extends keyof ItemCotizacion>(
    idTemporal: string,
    campo: K,
    valor: ItemCotizacion[K],
  ) {
    setItems((actuales) =>
      actuales.map((item) =>
        item.idTemporal === idTemporal
          ? {
              ...item,
              [campo]: valor,
            }
          : item,
      ),
    );
  }

  function eliminarItem(idTemporal: string) {
    setItems((actuales) =>
      actuales.filter(
        (item) => item.idTemporal !== idTemporal,
      ),
    );
  }

  const itemsJson = JSON.stringify(
    items.map((item) => ({
      tipo: item.tipo,
      nombre: item.nombre.trim(),
      descripcion: item.descripcion.trim(),
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
    })),
  );

  return (
    <form action={crearCotizacion} className="space-y-6">
      <input
        type="hidden"
        name="itemsJson"
        value={itemsJson}
      />

      <input
        type="hidden"
        name="porcentajeFinal"
        value={porcentajeFinal}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <FileText size={24} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Información de la cotización
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Datos principales que aparecerán en el documento.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="clienteId"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Cliente
                </label>

                <select
                  id="clienteId"
                  name="clienteId"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Selecciona un cliente
                  </option>

                  {clientes.map((cliente) => (
                    <option
                      key={cliente.id}
                      value={cliente.id}
                    >
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="colaborador"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Colaborador o área
                </label>

                <input
                  id="colaborador"
                  name="colaborador"
                  required
                  defaultValue="PROYECTOS"
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="titulo"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Título del trabajo
                </label>

                <input
                  id="titulo"
                  name="titulo"
                  required
                  maxLength={250}
                  placeholder="Ejemplo: Instalación de equipo de 18,000 BTU"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="fechaSolicitud"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Fecha de solicitud
                </label>

                <input
                  id="fechaSolicitud"
                  name="fechaSolicitud"
                  type="date"
                  required
                  defaultValue={fechaInicial}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="diasVigencia"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Días de vigencia
                </label>

                <input
                  id="diasVigencia"
                  name="diasVigencia"
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={5}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="observaciones"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Observaciones generales
                </label>

                <textarea
                  id="observaciones"
                  name="observaciones"
                  rows={3}
                  placeholder="Información adicional relacionada con el trabajo"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                  <PackagePlus size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Ítems de la cotización
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Agrega productos, servicios y costos adicionales.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => agregarItem("PRODUCTO")}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={15} />
                  Producto
                </button>

                <button
                  type="button"
                  onClick={() => agregarItem("SERVICIO")}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700"
                >
                  <Plus size={15} />
                  Servicio
                </button>

                <button
                  type="button"
                  onClick={() =>
                    agregarItem("COSTO_ADICIONAL")
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
                >
                  <Plus size={15} />
                  Costo adicional
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <p className="font-semibold text-slate-700">
                    No hay ítems agregados
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Agrega por lo menos un producto, servicio o costo adicional.
                  </p>
                </div>
              ) : (
                items.map((item, indice) => {
                  const subtotal =
                    Number(item.cantidad || 0) *
                    Number(item.precioUnitario || 0);

                  return (
                    <div
                      key={item.idTemporal}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Ítem {indice + 1}
                          </p>

                          <p className="mt-1 font-bold text-slate-900">
                            {obtenerNombreTipo(item.tipo)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            eliminarItem(item.idTemporal)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                        >
                          <Trash2 size={15} />
                          Quitar
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Tipo
                          </label>

                          <select
                            value={item.tipo}
                            onChange={(evento) =>
                              actualizarItem(
                                item.idTemporal,
                                "tipo",
                                evento.target
                                  .value as TipoItem,
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                          >
                            <option value="PRODUCTO">
                              Producto
                            </option>
                            <option value="SERVICIO">
                              Servicio
                            </option>
                            <option value="COSTO_ADICIONAL">
                              Costo adicional
                            </option>
                          </select>
                        </div>

                        <div className="md:col-span-1 xl:col-span-3">
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Nombre
                          </label>

                          <input
                            value={item.nombre}
                            onChange={(evento) =>
                              actualizarItem(
                                item.idTemporal,
                                "nombre",
                                evento.target.value,
                              )
                            }
                            required
                            placeholder="Nombre del producto o servicio"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2 xl:col-span-4">
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Descripción
                          </label>

                          <textarea
                            value={item.descripcion}
                            onChange={(evento) =>
                              actualizarItem(
                                item.idTemporal,
                                "descripcion",
                                evento.target.value,
                              )
                            }
                            rows={3}
                            placeholder="Alcance, materiales incluidos, características o notas"
                            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Cantidad
                          </label>

                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={item.cantidad}
                            onChange={(evento) =>
                              actualizarItem(
                                item.idTemporal,
                                "cantidad",
                                Number(
                                  evento.target.value,
                                ),
                              )
                            }
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Valor unitario
                          </label>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                              Q
                            </span>

                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.precioUnitario}
                              onChange={(evento) =>
                                actualizarItem(
                                  item.idTemporal,
                                  "precioUnitario",
                                  Number(
                                    evento.target.value,
                                  ),
                                )
                              }
                              required
                              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            Subtotal
                          </label>

                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">
                            {formatearDinero(subtotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Settings2 size={24} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Condiciones comerciales
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pago, IVA y condiciones del documento.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="porcentajeAnticipo"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Porcentaje de anticipo
                </label>

                <input
                  id="porcentajeAnticipo"
                  name="porcentajeAnticipo"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={porcentajeAnticipo}
                  onChange={(evento) =>
                    setPorcentajeAnticipo(
                      Math.min(
                        Math.max(
                          Number(evento.target.value),
                          0,
                        ),
                        100,
                      ),
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Pago final calculado: {porcentajeFinal}%
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  name="incluyeIva"
                  type="checkbox"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    El total incluye IVA
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Esta condición aparecerá en la cotización.
                  </span>
                </span>
              </label>

              <div>
                <label
                  htmlFor="condicionesPago"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Condiciones de pago y entrega
                </label>

                <textarea
                  id="condicionesPago"
                  name="condicionesPago"
                  rows={10}
                  defaultValue={`• Cualquier trabajo adicional no contemplado en esta cotización será cotizado por separado.
• El monto total incluye el impuesto al valor agregado IVA.
• Forma de pago: 70% de anticipo y 30% al finalizar el trabajo.
• Banco Industrial, cuenta monetaria No. 006-019951-0.
• La cotización tiene una vigencia de 5 días.`}
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6"
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-purple-700">
                <Calculator size={24} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Resumen
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Totales calculados automáticamente.
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-slate-600">
                  Productos
                </dt>
                <dd className="font-semibold text-slate-900">
                  {formatearDinero(totales.productos)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-slate-600">
                  Servicios
                </dt>
                <dd className="font-semibold text-slate-900">
                  {formatearDinero(totales.servicios)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-slate-600">
                  Costos adicionales
                </dt>
                <dd className="font-semibold text-slate-900">
                  {formatearDinero(
                    totales.costosAdicionales,
                  )}
                </dd>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 font-bold text-slate-900">
                    <CircleDollarSign size={18} />
                    Total
                  </dt>

                  <dd className="text-2xl font-bold text-purple-700">
                    {formatearDinero(totales.total)}
                  </dd>
                </div>
              </div>
            </dl>
          </article>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-end">
        <Link
          href="/administracion/compras/cotizaciones"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={items.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Save size={18} />
          Guardar cotización
        </button>
      </div>
    </form>
  );
}