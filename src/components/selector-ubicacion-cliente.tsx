"use client";

import { useEffect, useMemo, useState } from "react";

export type ClienteOpcion = {
  id: number;
  nombre: string;
};

export type SubtiendaOpcion = {
  id: number;
  clienteId: number;
  nombre: string;
};

export type AreaOpcion = {
  id: number;
  subtiendaId: number;
  nombre: string;
};

type SelectorUbicacionClienteProps = {
  clientes: ClienteOpcion[];
  subtiendas: SubtiendaOpcion[];
  areas: AreaOpcion[];
  clienteId: string;
  onClienteIdChange: (valor: string) => void;
  clienteDeshabilitado?: boolean;
  subtiendaInicial?: string;
  areaInicial?: string;
};

export function CamposUbicacionTrabajo({
  clienteInicial,
  subtiendaInicial = "",
  areaInicial = "",
  ...resto
}: Omit<
  SelectorUbicacionClienteProps,
  "clienteId" | "onClienteIdChange"
> & {
  clienteInicial: string;
}) {
  const [clienteId, setClienteId] = useState(
    clienteInicial,
  );

  return (
    <SelectorUbicacionCliente
      {...resto}
      clienteId={clienteId}
      onClienteIdChange={setClienteId}
      subtiendaInicial={subtiendaInicial}
      areaInicial={areaInicial}
    />
  );
}

export function SelectorUbicacionCliente({
  clientes,
  subtiendas,
  areas,
  clienteId,
  onClienteIdChange,
  clienteDeshabilitado = false,
  subtiendaInicial = "",
  areaInicial = "",
}: SelectorUbicacionClienteProps) {
  const [subtiendaId, setSubtiendaId] = useState(
    subtiendaInicial,
  );
  const [areaId, setAreaId] = useState(areaInicial);

  const subtiendasCliente = useMemo(
    () =>
      subtiendas.filter(
        (subtienda) =>
          String(subtienda.clienteId) === clienteId,
      ),
    [subtiendas, clienteId],
  );

  const areasSubtienda = useMemo(
    () =>
      areas.filter(
        (area) => String(area.subtiendaId) === subtiendaId,
      ),
    [areas, subtiendaId],
  );

  useEffect(() => {
    const sigueValida = subtiendasCliente.some(
      (subtienda) => String(subtienda.id) === subtiendaId,
    );

    if (subtiendaId && !sigueValida) {
      setSubtiendaId("");
      setAreaId("");
    }
  }, [clienteId, subtiendaId, subtiendasCliente]);

  function cambiarCliente(valor: string) {
    onClienteIdChange(valor);
    setSubtiendaId("");
    setAreaId("");
  }

  function cambiarSubtienda(valor: string) {
    setSubtiendaId(valor);
    setAreaId("");
  }

  const hayCliente = Boolean(clienteId);
  const haySubtienda = Boolean(subtiendaId);

  return (
    <>
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
          value={clienteId}
          onChange={(evento) =>
            cambiarCliente(evento.target.value)
          }
          disabled={clienteDeshabilitado}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
        >
          <option value="" disabled>
            Selecciona un cliente
          </option>

          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>

        {clienteDeshabilitado && (
          <input
            type="hidden"
            name="clienteId"
            value={clienteId}
          />
        )}
      </div>

      {hayCliente && (
        <div>
          <label
            htmlFor="subtiendaId"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Subtienda
          </label>

          <select
            id="subtiendaId"
            name="subtiendaId"
            value={subtiendaId}
            onChange={(evento) =>
              cambiarSubtienda(evento.target.value)
            }
            required={subtiendasCliente.length > 0}
            disabled={subtiendasCliente.length === 0}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
          >
            <option value="">
              {subtiendasCliente.length === 0
                ? "Este cliente no tiene subtiendas"
                : "Selecciona una subtienda"}
            </option>

            {subtiendasCliente.map((subtienda) => (
              <option
                key={subtienda.id}
                value={subtienda.id}
              >
                {subtienda.nombre}
              </option>
            ))}
          </select>

          {subtiendasCliente.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Agregá subtiendas en Clientes → Subtiendas y
              áreas.
            </p>
          )}
        </div>
      )}

      {hayCliente && haySubtienda && (
        <div>
          <label
            htmlFor="areaId"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Área
          </label>

          <select
            id="areaId"
            name="areaId"
            value={areaId}
            onChange={(evento) =>
              setAreaId(evento.target.value)
            }
            required={areasSubtienda.length > 0}
            disabled={areasSubtienda.length === 0}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
          >
            <option value="">
              {areasSubtienda.length === 0
                ? "Esta subtienda no tiene áreas"
                : "Selecciona un área"}
            </option>

            {areasSubtienda.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}