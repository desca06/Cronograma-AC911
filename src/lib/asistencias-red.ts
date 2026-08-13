import { headers } from "next/headers";

export type ResultadoValidacionRed =
  | {
      autorizado: true;
      ip: string | null;
      motivo: string;
    }
  | {
      autorizado: false;
      ip: string | null;
      motivo: string;
    };

function limpiarIp(
  valor: string | null,
) {
  if (!valor) {
    return null;
  }

  let ip = valor
    .split(",")[0]
    ?.trim();

  if (!ip) {
    return null;
  }

  if (
    ip.startsWith(
      "::ffff:",
    )
  ) {
    ip = ip.slice(7);
  }

  if (
    ip.startsWith("[") &&
    ip.includes("]")
  ) {
    ip = ip.slice(
      1,
      ip.indexOf("]"),
    );
  }

  const ipv4ConPuerto =
    ip.match(
      /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/,
    );

  if (
    ipv4ConPuerto?.[1]
  ) {
    ip =
      ipv4ConPuerto[1];
  }

  return ip;
}

function obtenerIpCliente(
  request?: Request,
) {
  if (!request) {
    return null;
  }

  const vercelForwardedFor =
    limpiarIp(
      request.headers.get(
        "x-vercel-forwarded-for",
      ),
    );

  if (
    vercelForwardedFor
  ) {
    return vercelForwardedFor;
  }

  const forwardedFor =
    limpiarIp(
      request.headers.get(
        "x-forwarded-for",
      ),
    );

  if (forwardedFor) {
    return forwardedFor;
  }

  const realIp =
    limpiarIp(
      request.headers.get(
        "x-real-ip",
      ),
    );

  if (realIp) {
    return realIp;
  }

  return null;
}

function obtenerIpsAutorizadas() {
  return (
    process.env
      .ASISTENCIA_IPS_AUTORIZADAS ??
    ""
  )
    .split(",")
    .map((valor) =>
      limpiarIp(valor),
    )
    .filter(
      (
        valor,
      ): valor is string =>
        Boolean(valor),
    );
}

function esLocalhost(
  ip: string,
) {
  return (
    ip ===
      "127.0.0.1" ||
    ip === "::1"
  );
}

function esIpPrivada(
  ip: string,
) {
  if (
    ip.startsWith(
      "10.",
    ) ||
    ip.startsWith(
      "192.168.",
    )
  ) {
    return true;
  }

  const partes =
    ip
      .split(".")
      .map(Number);

  return (
    partes.length === 4 &&
    partes[0] === 172 &&
    partes[1] >= 16 &&
    partes[1] <= 31
  );
}

export async function validarRedAsistencia(
  request?: Request,
): Promise<ResultadoValidacionRed> {
  const ip =
    obtenerIpCliente(
      request,
    );

  const ipsAutorizadas =
    obtenerIpsAutorizadas();

  const esProduccion =
    process.env
      .NODE_ENV ===
      "production" ||
    Boolean(
      process.env.VERCEL,
    );

  if (!ip) {
    return {
      autorizado: false,
      ip: null,
      motivo:
        "No fue posible identificar la red desde la que estás intentando registrar asistencia.",
    };
  }

  if (
    !esProduccion &&
    esLocalhost(ip)
  ) {
    return {
      autorizado: true,
      ip,
      motivo:
        "Acceso local autorizado.",
    };
  }

  if (
    ipsAutorizadas.length ===
    0
  ) {
    return {
      autorizado: false,
      ip,
      motivo:
        "La red de asistencia todavía no está configurada en el servidor.",
    };
  }

  if (
    ipsAutorizadas.includes(
      ip,
    )
  ) {
    return {
      autorizado: true,
      ip,
      motivo:
        "Red autorizada.",
    };
  }

  if (
    esProduccion &&
    ipsAutorizadas.some(
      esIpPrivada,
    )
  ) {
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
    motivo:
      "Debes estar conectado a la red autorizada de AC-911 para registrar tu asistencia.",
  };
}