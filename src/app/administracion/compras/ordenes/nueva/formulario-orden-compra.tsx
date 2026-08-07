"use client";

import {
  CirclePlus,
  LoaderCircle,
  Package,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { crearOrdenCompra } from "../actions";

type Proveedor = {
  id: number;
  codigo: string;
  nombreComercial: string;
};

type Articulo = {
  id: number;
  codigo: string | null;
  nombre: string;
  unidadMedida: string;
};

type Item = {
  idLocal: string;
  tipo: "PRODUCTO" | "SERVICIO";
  articuloId: string;
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
};

type Props = {
  proveedores: Proveedor[];
  articulos: Articulo[];
};

function crearItem(): Item {
  return {
    idLocal: crypto.randomUUID(),
    tipo: "PRODUCTO",
    articuloId: "",
    descripcion: "",
    cantidad: "1",
    precioUnitario: "0",
  };
}

function BotonGuardar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle size={18} className="animate-spin" />
      ) : (
        <Save size={18} />
      )}
      {pending ? "Guardando..." : "Crear orden"}
    </button>
  );
}

export function FormularioOrdenCompra({
  proveedores,
  articulos,
}: Props) {
  const [items, setItems] = useState<Item[]>([
    crearItem(),
  ]);

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const cantidad = Number(item.cantidad) || 0;
        const precio = Number(item.precioUnitario) || 0;
        return total + cantidad * precio;
      }, 0),
    [items],
  );

  function actualizarItem(
    idLocal: string,
    campo: keyof Item,
    valor: string,
  ) {
    setItems((actuales) =>
      actuales.map((item) =>
        item.idLocal === idLocal
          ? { ...item, [campo]: valor }
          : item,
      ),
    );
  }

  function cambiarTipo(
    idLocal: string,
    tipo: "PRODUCTO" | "SERVICIO",
  ) {
    setItems((actuales) =>
      actuales.map((item) =>
        item.idLocal === idLocal
          ? {
              ...item,
              tipo,
              articuloId: "",
              descripcion: "",
            }
          : item,
      ),
    );
  }

  function eliminarItem(idLocal: string) {
    setItems((actuales) => {
      if (actuales.length === 1) {
        return actuales;
      }

      return actuales.filter(
        (item) => item.idLocal !== idLocal,
      );
    });
  }

  const itemsParaServidor = items.map((item) => ({
    tipo: item.tipo,
    articuloId:
      item.tipo === "PRODUCTO"
        ? item.articuloId
        : null,
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
  }));

  const fechaHoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
  }).format(new Date());

  return (
    <form
      action={crearOrdenCompra}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(itemsParaServidor)}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Información de la compra
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="proveedorId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Proveedor *
            </label>

            <select
              id="proveedorId"
              name="proveedorId"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            >
              <option value="" disabled>
                Seleccioná un proveedor
              </option>
              {proveedores.map((proveedor) => (
                <option
                  key={proveedor.id}
                  value={proveedor.id}
                >
                  {proveedor.codigo} ·{" "}
                  {proveedor.nombreComercial}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="fechaCompra"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Fecha de compra *
            </label>

            <input
              id="fechaCompra"
              name="fechaCompra"
              type="date"
              required
              defaultValue={fechaHoy}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="facturaReferencia"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Factura / referencia
            </label>

            <input
              id="facturaReferencia"
              name="facturaReferencia"
              placeholder="Ej. FAC-45896"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="motivo"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Motivo de la compra *
            </label>

            <input
              id="motivo"
              name="motivo"
              required
              placeholder="Ej. Material para proyecto CEMACO"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="observaciones"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Observaciones
          </label>

          <textarea
            id="observaciones"
            name="observaciones"
            rows={3}
            placeholder="Información adicional de la compra."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Productos y servicios
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Los productos vinculados al inventario entrarán
              automáticamente cuando la orden se complete.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setItems((actuales) => [
                ...actuales,
                crearItem(),
              ])
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
          >
            <CirclePlus size={18} />
            Agregar línea
          </button>
        </div>

        <div className="space-y-4 p-5">
          {items.map((item, indice) => (
            <div
              key={item.idLocal}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-bold text-slate-900">
                  Línea {indice + 1}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    eliminarItem(item.idLocal)
                  }
                  disabled={items.length === 1}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={16} />
                  Quitar
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[180px_1fr_130px_170px]">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tipo
                  </label>

                  <select
                    value={item.tipo}
                    onChange={(evento) =>
                      cambiarTipo(
                        item.idLocal,
                        evento.target.value as
                          | "PRODUCTO"
                          | "SERVICIO",
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                  >
                    <option value="PRODUCTO">
                      Producto
                    </option>
                    <option value="SERVICIO">
                      Servicio
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {item.tipo === "PRODUCTO"
                      ? "Artículo de inventario"
                      : "Descripción del servicio"}
                  </label>

                  {item.tipo === "PRODUCTO" ? (
                    <select
                      value={item.articuloId}
                      onChange={(evento) =>
                        actualizarItem(
                          item.idLocal,
                          "articuloId",
                          evento.target.value,
                        )
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                    >
                      <option value="">
                        Seleccioná un artículo
                      </option>
                      {articulos.map((articulo) => (
                        <option
                          key={articulo.id}
                          value={articulo.id}
                        >
                          {articulo.codigo
                            ? `${articulo.codigo} · `
                            : ""}
                          {articulo.nombre} ·{" "}
                          {articulo.unidadMedida}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <Wrench
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={item.descripcion}
                        onChange={(evento) =>
                          actualizarItem(
                            item.idLocal,
                            "descripcion",
                            evento.target.value,
                          )
                        }
                        required
                        placeholder="Ej. Instalación especializada"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cantidad
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.cantidad}
                    onChange={(evento) =>
                      actualizarItem(
                        item.idLocal,
                        "cantidad",
                        evento.target.value,
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Precio unitario (Q)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.precioUnitario}
                    onChange={(evento) =>
                      actualizarItem(
                        item.idLocal,
                        "precioUnitario",
                        evento.target.value,
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 text-sm">
                {item.tipo === "PRODUCTO" ? (
                  <Package
                    size={17}
                    className="text-blue-600"
                  />
                ) : (
                  <Wrench
                    size={17}
                    className="text-purple-600"
                  />
                )}

                <span className="font-medium text-slate-500">
                  Subtotal:
                </span>
                <span className="font-bold text-slate-900">
                  Q{" "}
                  {(
                    (Number(item.cantidad) || 0) *
                    (Number(item.precioUnitario) || 0)
                  ).toLocaleString("es-GT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-orange-700">
            Total estimado de la orden
          </p>
          <p className="mt-1 text-3xl font-bold text-orange-900">
            Q{" "}
            {subtotal.toLocaleString("es-GT", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <BotonGuardar />
      </div>
    </form>
  );
}