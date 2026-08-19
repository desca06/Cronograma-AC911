"use client";

import { useEffect, useRef, useState } from "react";

type PadFirmaProps = {
  nombreCampo?: string;
};

export function PadFirma({
  nombreCampo = "firmaCliente",
}: PadFirmaProps) {
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const dibujandoRef = useRef(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const [imagen, setImagen] = useState("");

  function prepararLienzo() {
    const lienzo = lienzoRef.current;

    if (!lienzo) {
      return;
    }

    const recuadro = lienzo.getBoundingClientRect();
    const escala = window.devicePixelRatio || 1;

    lienzo.width = Math.max(1, Math.floor(recuadro.width * escala));
    lienzo.height = Math.max(1, Math.floor(recuadro.height * escala));

    const contexto = lienzo.getContext("2d");

    if (!contexto) {
      return;
    }

    contexto.setTransform(escala, 0, 0, escala, 0, 0);
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, recuadro.width, recuadro.height);
    contexto.lineWidth = 2.4;
    contexto.lineCap = "round";
    contexto.lineJoin = "round";
    contexto.strokeStyle = "#0f172a";
  }

  useEffect(() => {
    prepararLienzo();
  }, []);

  function punto(
    evento: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const recuadro = evento.currentTarget.getBoundingClientRect();

    return {
      x: evento.clientX - recuadro.left,
      y: evento.clientY - recuadro.top,
    };
  }

  function guardarImagen() {
    const lienzo = lienzoRef.current;

    if (!lienzo) {
      return;
    }

    setImagen(lienzo.toDataURL("image/png"));
  }

  function iniciar(
    evento: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const contexto = lienzoRef.current?.getContext("2d");

    if (!contexto) {
      return;
    }

    evento.preventDefault();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    dibujandoRef.current = true;

    const { x, y } = punto(evento);
    contexto.beginPath();
    contexto.moveTo(x, y);
  }

  function mover(
    evento: React.PointerEvent<HTMLCanvasElement>,
  ) {
    if (!dibujandoRef.current) {
      return;
    }

    const contexto = lienzoRef.current?.getContext("2d");

    if (!contexto) {
      return;
    }

    evento.preventDefault();

    const { x, y } = punto(evento);
    contexto.lineTo(x, y);
    contexto.stroke();
    setTieneTrazo(true);
  }

  function terminar() {
    if (!dibujandoRef.current) {
      return;
    }

    dibujandoRef.current = false;
    guardarImagen();
  }

  function limpiar() {
    prepararLienzo();
    setTieneTrazo(false);
    setImagen("");
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
        <canvas
          ref={lienzoRef}
          className="h-40 w-full touch-none bg-white"
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          onPointerLeave={terminar}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {tieneTrazo
            ? "Firma capturada. Si se equivocó, puede limpiarla."
            : "Pida al cliente que firme con el dedo dentro del recuadro."}
        </p>

        <button
          type="button"
          onClick={limpiar}
          className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      <input
        type="hidden"
        name={nombreCampo}
        value={imagen}
      />
    </div>
  );
}