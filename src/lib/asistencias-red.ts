import { headers } from "next/headers";

export type ResultadoValidacionRed =
  | {
      autorizado: true;
      ip: string;
    }
  | {
      autorizado: false;
      ip: string;
      motivo: string;
    };

function normalizarIp(ip: string) {
  return ip
    .trim()
    .replace(/^::ffff:/, "");
}

export async function validarRedAsistencia():
  Promise<ResultadoValidacionRed> {
  /*
   * Durante el desarrollo local permitimos la marcación
   * sin validar la IP pública. En producción sí se exige.
   */
  if (process.env.NODE_ENV === "development") {
    return {
      autorizado: true,
      ip: "desarrollo-local",
    };
  }

  const encabezados = await headers();

  const forwardedFor =
    encabezados.get("x-forwarded-for");

  const ip = normalizarIp(
    forwardedFor?.split(",")[0] ??
      encabezados.get("x-real-ip") ??
      "",
  );

  const ipsAutorizadas = (
    process.env.ASISTENCIA_IPS_AUTORIZADAS ?? ""
  )
    .split(",")
    .map(normalizarIp)
    .filter(Boolean);

  if (ipsAutorizadas.length === 0) {
    return {
      autorizado: false,
      ip,
      motivo:
        "No se configuraron las IP autorizadas para registrar asistencias.",
    };
  }

  if (!ip || !ipsAutorizadas.includes(ip)) {
    return {
      autorizado: false,
      ip,
      motivo:
        "Debes estar conectado a la red Wi-Fi autorizada de AC-911.",
    };
  }

  return {
    autorizado: true,
    ip,
  };
}