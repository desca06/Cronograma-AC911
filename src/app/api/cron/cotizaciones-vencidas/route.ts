import { NextResponse } from "next/server";

import { vencerCotizacionesCaducadas } from "@/lib/vencer-cotizaciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cronAutorizado(request: Request) {
  const secreto = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");

  if (secreto) {
    return auth === `Bearer ${secreto}`;
  }

  return vercelCron === "1";
}

export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 401 },
    );
  }

  await vencerCotizacionesCaducadas();

  return NextResponse.json({
    ok: true,
    mensaje: "Cotizaciones vencidas actualizadas.",
  });
}