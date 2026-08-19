import { headers } from "next/headers";

export type ResultadoValidacionRed =
  | { autorizado: true; ip: string | null; motivo: string }
  | { autorizado: false; ip: string | null; motivo: string };

function limpiarIp(valor: string | null) {
  if (!valor) return null;

  let ip = valor.split(",")[0]?.trim();
  if (!ip) return null;

  if (ip.startsWith("::ffff:")) ip = ip.slice(7);

  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  }

  const ipv4ConPuerto = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4ConPuerto?.[1]) ip = ipv4ConPuerto[1];

  return ip;
}

function obtenerIpCliente(request?: Request) {
  if (!request) return null;

  const vercelForwardedFor = limpiarIp(
    request.headers.get("x-vercel-forwarded-for"),
  );
  if (vercelForwardedFor) return vercelForwardedFor;

  const forwardedFor = limpiarIp(request.headers.get("x-forwarded-for"));
  if (forwardedFor) return forwardedFor;

  const realIp = limpiarIp(request.headers.get("x-real-ip"));
  if (realIp) return realIp;

  return null;
}

/*
 * Convierte una IPv4 a un número de 32 bits para poder
 * compararla contra un rango CIDR.
 */
function ipANumero(ip: string) {
  const partes = ip.split(".").map(Number);
  if (partes.length !== 4 || partes.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return (
    (partes[0] << 24) +
    (partes[1] << 16) +
    (partes[2] << 8) +
    partes[3]
  ) >>> 0;
}

/*
 * Revisa si una IP cae dentro de un rango CIDR, ej: "190.115.20.0/24".
 * Si la entrada no trae "/", se trata como IP exacta.
 */
function ipEnRango(ip: string, entrada: string) {
  if (!entrada.includes("/")) {
    return ip === entrada;
  }

  const [base, bitsTexto] = entrada.split("/");
  const bits = Number(bitsTexto);

  const ipNum = ipANumero(ip);
  const baseNum = ipANumero(base);

  if (ipNum === null || baseNum === null || Number.isNaN(bits)) {
    return false;
  }

  if (bits === 0) return true;

  const mascara = (~0 << (32 - bits)) >>> 0;

  return (ipNum & mascara) === (baseNum & mascara);
}

function obtenerIpsAutorizadas() {
  return (process.env.ASISTENCIA_IPS_AUTORIZADAS ?? "")
    .split(",")
    .map((valor) => valor.trim())
    .filter((valor): valor is string => Boolean(valor));
}

function esLocalhost(ip: string) {
  return ip === "127.0.0.1" || ip === "::1";
}

function esIpPrivada(ip: string) {
  // Si es un rango CIDR, chequeamos la base
  const base = ip.includes("/") ? ip.split("/")[0] : ip;

  if (base.startsWith("10.") || base.startsWith("192.168.")) {
    return true;
  }

  const partes = base.split(".").map(Number);
  return (
    partes.length === 4 &&
    partes[0] === 172 &&
    partes[1] >= 16 &&
    partes[1] <= 31
  );
}

export function rutaRetornoAsistencia(
  valor: string | null | undefined,
): string | null {
  if (!valor) {
    return null;
  }

  const ruta = valor.trim();

  if (!/^\/asistencia\/[a-f0-9]{32,128}$/i.test(ruta)) {
    return null;
  }

  return ruta;
}

export async function validarRedAsistencia(
  request?: Request,
): Promise<ResultadoValidacionRed> {
  const ip = obtenerIpCliente(request);
  const ipsAutorizadas = obtenerIpsAutorizadas();

  const esProduccion =
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

  if (!ip) {
    return {
      autorizado: false,
      ip: null,
      motivo:
        "No fue posible identificar la red desde la que estás intentando registrar asistencia.",
    };
  }

  if (!esProduccion && esLocalhost(ip)) {
    return { autorizado: true, ip, motivo: "Acceso local autorizado." };
  }

  if (ipsAutorizadas.length === 0) {
    return {
      autorizado: false,
      ip,
      motivo: "La red de asistencia todavía no está configurada en el servidor.",
    };
  }

  const coincide = ipsAutorizadas.some((entrada) => ipEnRango(ip, entrada));

  if (coincide) {
    return { autorizado: true, ip, motivo: "Red autorizada." };
  }

  if (esProduccion && ipsAutorizadas.some(esIpPrivada)) {
    return {
      autorizado: false,
      ip,
      motivo:
        "La configuración de asistencia todavía contiene una IP privada. En Vercel debes configurar la IP pública autorizada de AC-911.",
    };
  }

  return {
    autorizado: false,
    ip,
    motivo: "Debes estar conectado a la red autorizada de AC-911 para registrar tu asistencia.",
  };
}