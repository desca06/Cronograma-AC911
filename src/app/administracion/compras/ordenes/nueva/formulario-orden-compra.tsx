"use client";

import {
  PackagePlus,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import { crearOrdenCompra } from "./../actions"

type Proveedor = {
  id: number;
  codigo: string;
  nombreComercial: string;
};

type ItemManual = {
  id: string;
  tipo: "PRODUCTO" | "SERVICIO";
  descripcion: string;
  cantidad: number;
  precioUnitario: string;
};

type Props = {
  proveedores: Proveedor[];
};

function nuevoItem(): ItemManual {
  return {
    id: crypto.randomUUID(),
    tipo: "PRODUCTO",
    descripcion: "",
    cantidad: 1,
    precioUnitario: "0",
  };
}

function fechaHoyGuatemala() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Guatemala",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date());
}

function numeroDinero(
  valor: string,
) {
  const numero = Number(
    valor.replace(",", "."),
  );

  return Number.isFinite(numero) &&
    numero >= 0
    ? numero
    : 0;
}

function formatoQuetzales(
  valor: number,
) {
  return new Intl.NumberFormat(
    "es-GT",
    {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
    },
  ).format(valor);
}

export function FormularioOrdenCompra({
  proveedores,
}: Props) {
  const [items, setItems] =
    useState<ItemManual[]>([
      nuevoItem(),
    ]);

  const total = useMemo(
    () =>
      items.reduce(
        (
          acumulado,
          item,
        ) =>
          acumulado +
          Math.max(
            item.cantidad,
            0,
          ) *
            numeroDinero(
              item.precioUnitario,
            ),
        0,
      ),
    [items],
  );

  function actualizarItem(
    id: string,
    cambios: Partial<ItemManual>,
  ) {
    setItems(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  ...cambios,
                }
              : item,
        ),
    );
  }

  function agregarLinea() {
    setItems(
      (actuales) => [
        ...actuales,
        nuevoItem(),
      ],
    );
  }

  function quitarLinea(
    id: string,
  ) {
    setItems(
      (actuales) =>
        actuales.length === 1
          ? actuales
          : actuales.filter(
              (item) =>
                item.id !== id,
            ),
    );
  }

  const itemsParaEnviar =
    JSON.stringify(
      items.map(
        (item) => ({
          tipo: item.tipo,
          descripcion:
            item.descripcion.trim(),
          cantidad:
            item.cantidad,
          precioUnitario:
            item.precioUnitario,
        }),
      ),
    );

  return (
    <form
      action={crearOrdenCompra}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="items"
        value={
          itemsParaEnviar
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-base font-bold text-slate-900">
          Información de la compra
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Proveedor *
            </span>

            <select
              name="proveedorId"
              required
              defaultValue=""
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option
                value=""
                disabled
              >
                Seleccioná un proveedor
              </option>

              {proveedores.map(
                (proveedor) => (
                  <option
                    key={
                      proveedor.id
                    }
                    value={
                      proveedor.id
                    }
                  >
                    {
                      proveedor.nombreComercial
                    }
                    {" · "}
                    {
                      proveedor.codigo
                    }
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Fecha de compra *
            </span>

            <input
              type="date"
              name="fechaCompra"
              required
              defaultValue={
                fechaHoyGuatemala()
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Factura / referencia
            </span>

            <input
              type="text"
              name="facturaReferencia"
              placeholder="Ej. FAC-45896"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Motivo de la compra *
            </span>

            <input
              type="text"
              name="motivo"
              required
              placeholder="Ej. Material para proyecto CEMACO"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Observaciones
          </span>

          <textarea
            name="observaciones"
            rows={3}
            placeholder="Información adicional de la compra."
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PackagePlus
                size={21}
                className="text-orange-600"
              />

              <h2 className="text-base font-bold text-slate-900">
                Productos y servicios
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Ingresá manualmente la descripción, cantidad y precio de cada línea.
            </p>
          </div>

          <button
            type="button"
            onClick={agregarLinea}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
          >
            <Plus size={17} />
            Agregar línea
          </button>
        </div>

        <div className="space-y-4 p-4 md:p-5">
          {items.map(
            (
              item,
              indice,
            ) => {
              const subtotal =
                Math.max(
                  item.cantidad,
                  0,
                ) *
                numeroDinero(
                  item.precioUnitario,
                );

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      Línea{" "}
                      {indice + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        quitarLinea(
                          item.id,
                        )
                      }
                      disabled={
                        items.length ===
                        1
                      }
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2
                        size={16}
                      />
                      Quitar
                    </button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[150px_minmax(280px,1fr)_120px_170px]">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Tipo
                      </span>

                      <select
                        value={
                          item.tipo
                        }
                        onChange={(
                          event,
                        ) =>
                          actualizarItem(
                            item.id,
                            {
                              tipo:
                                event
                                  .target
                                  .value ===
                                "SERVICIO"
                                  ? "SERVICIO"
                                  : "PRODUCTO",
                            },
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="PRODUCTO">
                          Producto
                        </option>
                        <option value="SERVICIO">
                          Servicio
                        </option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Descripción *
                      </span>

                      <input
                        type="text"
                        required
                        value={
                          item.descripcion
                        }
                        onChange={(
                          event,
                        ) =>
                          actualizarItem(
                            item.id,
                            {
                              descripcion:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        placeholder={
                          item.tipo ===
                          "PRODUCTO"
                            ? "Ej. Cable UTP Cat6, válvula, repuesto..."
                            : "Ej. Instalación, transporte, mantenimiento..."
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Cantidad *
                      </span>

                      <input
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={
                          item.cantidad
                        }
                        onChange={(
                          event,
                        ) =>
                          actualizarItem(
                            item.id,
                            {
                              cantidad:
                                Math.max(
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ) ||
                                    0,
                                  0,
                                ),
                            },
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Precio unitario (Q) *
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={
                          item.precioUnitario
                        }
                        onChange={(
                          event,
                        ) =>
                          actualizarItem(
                            item.id,
                            {
                              precioUnitario:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <div className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
                      <span className="text-slate-500">
                        Subtotal:
                      </span>{" "}
                      <strong className="text-slate-950">
                        {
                          formatoQuetzales(
                            subtotal,
                          )
                        }
                      </strong>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-orange-700">
            Total estimado de la orden
          </p>

          <p className="mt-1 text-3xl font-black text-slate-950">
            {
              formatoQuetzales(
                total,
              )
            }
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
        >
          <Save size={18} />
          Crear orden
        </button>
      </section>
    </form>
  );
}