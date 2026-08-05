function obtenerVariable(
  nombre: string,
  valor?: string,
) {
  if (!valor) {
    throw new Error(
      `La variable ${nombre} no está configurada.`,
    );
  }

  return valor;
}

export const ENV = {
  databaseUrl: obtenerVariable(
    "DATABASE_URL",
    process.env.DATABASE_URL,
  ),

  appUrl: obtenerVariable(
    "NEXT_PUBLIC_APP_URL",
    process.env.NEXT_PUBLIC_APP_URL,
  ),

  qrSecret: obtenerVariable(
    "QR_SECRET",
    process.env.QR_SECRET,
  ),

  ipsAutorizadas: (
    process.env.ASISTENCIA_IPS_AUTORIZADAS ??
    ""
  )
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean),
};