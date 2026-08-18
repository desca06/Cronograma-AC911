"use client";

import { useRef, useEffect, useState, useCallback } from "react";

type PadFirmaProps = {
  onChange?: (dataUrl: string | null) => void;
  value?: string | null;
  height?: number;
  disabled?: boolean;
  label?: string;
};

export function PadFirma({
  onChange,
  value,
  height = 220,
  disabled = false,
  label = "Firma del cliente",
}: PadFirmaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    return ctx;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const heightPx = height;

    // Guardar contenido existente si hay
    const prevDataUrl = hasDrawn ? canvas.toDataURL() : null;

    canvas.width = width * dpr;
    canvas.height = heightPx * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${heightPx}px`;

    const ctx = getContext();
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;

    // Fondo blanco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, heightPx);

    // Restaurar trazo previo si existía
    if (prevDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, heightPx);
      };
      img.src = prevDataUrl;
    } else if (value) {
      // Cargar valor inicial
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, heightPx);
        setHasDrawn(true);
        setIsEmpty(false);
      };
      img.src = value;
    }

    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, [height, getContext, hasDrawn, value]);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resizeCanvas]);

  // Cargar firma inicial cuando cambia value externo
  useEffect(() => {
    if (!value || hasDrawn) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current || getContext();
    if (!canvas || !ctx || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.getBoundingClientRect().width;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      setHasDrawn(true);
      setIsEmpty(false);
    };
    img.src = value;
  }, [value, hasDrawn, height, getContext]);

  const getPos = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const t = (e as TouchEvent).touches[0] || (e as any).changedTouches?.[0];
      if (!t) return { x: 0, y: 0 };
      return {
        x: t.clientX - rect.left,
        y: t.clientY - rect.top,
      };
    } else {
      const me = e as MouseEvent | React.MouseEvent;
      return {
        x: (me as any).clientX - rect.left,
        y: (me as any).clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pos = getPos(e as any);
    const ctx = ctxRef.current || getContext();
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const pos = getPos(e as any);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
    if (isEmpty) setIsEmpty(false);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.closePath();
      // Verificar si realmente hay trazos (no canvas vacío blanco)
      const dataUrl = canvas.toDataURL("image/png");
      // Un canvas vacío blanco tiene longitud aproximada, pero con firma es más largo
      // Usamos hasDrawn flag + longitud
      if (hasDrawn) {
        onChange?.(dataUrl);
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current || getContext();
    if (!canvas || !ctx || !containerRef.current) return;
    const width = containerRef.current.getBoundingClientRect().width;
    ctxRef.current = ctx;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setHasDrawn(false);
    setIsEmpty(true);
    onChange?.(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <span className="text-xs text-slate-500">
          {isEmpty ? "Sin firma" : "Firma capturada"}
        </span>
      </div>

      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-xl border-2 bg-white shadow-inner ${
          disabled
            ? "border-slate-200 opacity-60"
            : isEmpty
              ? "border-amber-300 bg-amber-50/30"
              : "border-emerald-300 bg-emerald-50/20"
        }`}
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={height}
          className="block w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />

        {isEmpty && !disabled && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="text-sm font-medium text-slate-400">
              Firme aquí con el dedo o mouse
            </p>
          </div>
        )}

        {/* Línea guía para firma */}
        <div className="pointer-events-none absolute bottom-10 left-6 right-6 h-px bg-slate-300/60" />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          🧹 Limpiar firma
        </button>

        {value && !hasDrawn && (
          <div className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Firma cargada previamente
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Al firmar, el cliente confirma que el trabajo fue realizado a conformidad.
        Esta firma aparecerá en el PDF del reporte.
      </p>
    </div>
  );
}
