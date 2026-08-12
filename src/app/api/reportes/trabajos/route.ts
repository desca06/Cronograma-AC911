import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obtenerReporteTrabajos,
} from "@/lib/reportes-trabajos";
import {
  requerirAdmin,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";
export const runtime =
  "nodejs";

export async function GET(
  request: NextRequest,
) {
  await requerirAdmin();

  const empleadoId =
    Number(
      request.nextUrl.searchParams.get(
        "empleadoId",
      ) ?? "",
    );

  const clienteId =
    Number(
      request.nextUrl.searchParams.get(
        "clienteId",
      ) ?? "",
    );

  const reporte =
    await obtenerReporteTrabajos({
      desde:
        request.nextUrl.searchParams.get(
          "desde",
        ) ||
        undefined,
      hasta:
        request.nextUrl.searchParams.get(
          "hasta",
        ) ||
        undefined,
      estado:
        request.nextUrl.searchParams.get(
          "estado",
        ) ||
        undefined,
      empleadoId:
        Number.isInteger(
          empleadoId,
        ) &&
        empleadoId >
          0
          ? empleadoId
          : undefined,
      clienteId:
        Number.isInteger(
          clienteId,
        ) &&
        clienteId >
          0
          ? clienteId
          : undefined,
    });

  return NextResponse.json(
    reporte,
  );
}