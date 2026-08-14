import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function limpiarIp(valor: string | null) {
  if (!valor) {
    return null;
  }

  let ip = valor.split(",")[0]?.trim();

  if (!ip) {
    return null;
  }

  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  return ip;
}

export async function GET(request: Request) {
  const vercelForwardedFor = limpiarIp(
    request.headers.get("x-vercel-forwarded-for"),
  );

  const forwardedFor = limpiarIp(
    request.headers.get("x-forwarded-for"),
  );

  const realIp = limpiarIp(
    request.headers.get("x-real-ip"),
  );

  const ip =
    vercelForwardedFor ??
    forwardedFor ??
    realIp ??
    "NO_DETECTADA";

  return NextResponse.json(
    {
      mensaje: "Diagnóstico de red AC-911",
      ipDetectada: ip,
      xVercelForwardedFor: vercelForwardedFor,
      xForwardedFor: forwardedFor,
      xRealIp: realIp,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}