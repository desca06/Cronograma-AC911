import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  esEstadoOrdenCompra,
  obtenerReporteCompras,
} from "@/lib/reportes-compras";
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

  const proveedorId =
    Number(
      request.nextUrl.searchParams.get(
        "proveedorId",
      ) ?? "",
    );

  const estadoTexto =
    request.nextUrl.searchParams.get(
      "estado",
    );

  const estado =
    esEstadoOrdenCompra(
      estadoTexto,
    )
      ? estadoTexto
      : undefined;

  const reporte =
    await obtenerReporteCompras({
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
      estado,
      proveedorId:
        Number.isInteger(
          proveedorId,
        ) &&
        proveedorId > 0
          ? proveedorId
          : undefined,
    });

  return NextResponse.json(
    reporte,
  );
}