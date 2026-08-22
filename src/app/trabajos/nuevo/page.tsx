import {
  and,
  asc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import { db } from "@/db";
import {
  clienteAreas,
  clienteSubtiendas,
  clientes,
  cotizaciones,
  empleados,
  vehiculos,
} from "@/db/schema";
import {
  cotizacionTrabajos,
} from "@/db/schema-cotizacion-trabajo";
import {
  requerirSupervisor,
} from "@/lib/auth";

import {
  FormularioTrabajo,
} from "./formulario-trabajo";

export const dynamic =
  "force-dynamic";
export const runtime =
  "nodejs";

type Props = {
  searchParams: Promise<{
    cotizacionId?:
    | string
    | string[];
    error?:
    | string
    | string[];
    detalle?:
    | string
    | string[];
  }>;
};

function obtenerParametro(
  valor:
    | string
    | string[]
    | undefined,
) {
  return typeof valor ===
    "string"
    ? valor.trim()
    : "";
}

function obtenerFechaHoyGuatemala() {
  return new Date()
    .toLocaleDateString(
      "en-CA",
      {
        timeZone:
          "America/Guatemala",
      },
    );
}

export default async function NuevoTrabajoPage({
  searchParams,
}: Props) {
  await requerirSupervisor();

  const parametros =
    await searchParams;

  const cotizacionTexto =
    obtenerParametro(
      parametros.cotizacionId,
    );

  const error =
    obtenerParametro(
      parametros.error,
    );

  const detalle =
    obtenerParametro(
      parametros.detalle,
    );

  let cotizacionOrigen:
    | {
      id: number;
      codigo: string;
      titulo: string;
      clienteId: number;
      clienteNombre: string;
      subtiendaId: number | null;
      areaId: number | null;
      observaciones:
      | string
      | null;
      direccion: string | null;
    }
    | null = null;

  if (cotizacionTexto) {
    const cotizacionId =
      Number(
        cotizacionTexto,
      );

    if (
      !Number.isInteger(
        cotizacionId,
      ) ||
      cotizacionId <= 0
    ) {
      notFound();
    }

    const [cotizacion] =
      await db
        .select({
          id:
            cotizaciones.id,
          codigo:
            cotizaciones.codigo,
          titulo:
            cotizaciones.titulo,
          clienteId:
            cotizaciones.clienteId,
          subtiendaId:
            cotizaciones.subtiendaId,
          areaId:
            cotizaciones.areaId,
          clienteNombre:
            clientes.nombre,
          estado:
            cotizaciones.estado,
          observaciones:
            cotizaciones.observaciones,
          trabajoId:
            cotizacionTrabajos.trabajoId,
          direccion:
            cotizaciones.direccion,
        })
        .from(cotizaciones)
        .innerJoin(
          clientes,
          eq(
            cotizaciones.clienteId,
            clientes.id,
          ),
        )
        .leftJoin(
          cotizacionTrabajos,
          eq(
            cotizacionTrabajos.cotizacionId,
            cotizaciones.id,
          ),
        )
        .where(
          eq(
            cotizaciones.id,
            cotizacionId,
          ),
        )
        .limit(1);

    if (!cotizacion) {
      notFound();
    }

    if (
      cotizacion.estado !==
      "APROBADA"
    ) {
      redirect(
        `/administracion/compras/cotizaciones/${cotizacion.id}?error=no-aprobada`,
      );
    }

    if (
      cotizacion.trabajoId
    ) {
      redirect(
        `/administracion/compras/cotizaciones/${cotizacion.id}?error=trabajo-duplicado`,
      );
    }

    cotizacionOrigen = {
      id:
        cotizacion.id,
      codigo:
        cotizacion.codigo,
      titulo:
        cotizacion.titulo,
      clienteId:
        cotizacion.clienteId,
      clienteNombre:
        cotizacion.clienteNombre,
      subtiendaId:
        cotizacion.subtiendaId,
      areaId:
        cotizacion.areaId,
      observaciones:
        cotizacion.observaciones,
      direccion:
        cotizacion.direccion,
    };
  }

  const [
    listaClientes,
    listaSubtiendas,
    listaAreas,
    listaVehiculos,
    listaEmpleados,
    listaCotizacionesAprobadas,
  ] = await Promise.all([
    db
      .select({
        id:
          clientes.id,
        nombre:
          clientes.nombre,
      })
      .from(clientes)
      .where(
        eq(
          clientes.activo,
          true,
        ),
      )
      .orderBy(
        asc(
          clientes.nombre,
        ),
      ),

    db
      .select({
        id: clienteSubtiendas.id,
        clienteId: clienteSubtiendas.clienteId,
        nombre: clienteSubtiendas.nombre,
      })
      .from(clienteSubtiendas)
      .where(eq(clienteSubtiendas.activo, true))
      .orderBy(asc(clienteSubtiendas.nombre)),

    db
      .select({
        id: clienteAreas.id,
        subtiendaId: clienteAreas.subtiendaId,
        nombre: clienteAreas.nombre,
      })
      .from(clienteAreas)
      .where(eq(clienteAreas.activo, true))
      .orderBy(asc(clienteAreas.nombre)),

    db
      .select({
        id:
          vehiculos.id,
        nombre:
          vehiculos.nombre,
        placa:
          vehiculos.placa,
        estado:
          vehiculos.estado,
      })
      .from(vehiculos)
      .where(
        eq(
          vehiculos.activo,
          true,
        ),
      )
      .orderBy(
        asc(
          vehiculos.nombre,
        ),
      ),

    db
      .select({
        id:
          empleados.id,
        nombre:
          empleados.nombre,
        puesto:
          empleados.puesto,
      })
      .from(empleados)
      .where(
        and(
          eq(
            empleados.activo,
            true,
          ),
          inArray(
            empleados.puesto,
            [
              "Técnico",
              "Supervisor",
            ],
          ),
        ),
      )
      .orderBy(
        asc(
          empleados.nombre,
        ),
      ),

    db
      .select({
        id:
          cotizaciones.id,
        codigo:
          cotizaciones.codigo,
        titulo:
          cotizaciones.titulo,
        clienteId:
          cotizaciones.clienteId,
        clienteNombre:
          clientes.nombre,
        subtiendaId:
          cotizaciones.subtiendaId,
        areaId:
          cotizaciones.areaId,
        observaciones:
          cotizaciones.observaciones,
        direccion:
          cotizaciones.direccion,
      })
      .from(cotizaciones)
      .innerJoin(
        clientes,
        eq(
          cotizaciones.clienteId,
          clientes.id,
        ),
      )
      .leftJoin(
        cotizacionTrabajos,
        eq(
          cotizacionTrabajos.cotizacionId,
          cotizaciones.id,
        ),
      )
      .where(
        and(
          eq(
            cotizaciones.estado,
            "APROBADA",
          ),
          isNull(
            cotizacionTrabajos.trabajoId,
          ),
        ),
      )
      .orderBy(
        asc(
          cotizaciones.codigo,
        ),
      ),
  ]);

  return (
    <AppShell>
      <PageHeader
        title={
          cotizacionOrigen
            ? "Crear trabajo desde cotización"
            : "Nuevo trabajo"
        }
        description={
          cotizacionOrigen
            ? `Cotización ${cotizacionOrigen.codigo} aprobada y lista para programar.`
            : "Crea una nueva orden y asignala al equipo de trabajo."
        }
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-6xl">
          {error ===
            "cliente" && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                El cliente del trabajo debe coincidir con el cliente de la cotización.
              </div>
            )}

          {error ===
            "ubicacion" && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                La subtienda o el área no pertenecen a ese cliente.
              </div>
            )}

          {error ===
            "datos" && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                Completá fecha, tipo y descripción para guardar el trabajo.
              </div>
            )}

          {error ===
            "guardar" && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                No se pudo guardar el trabajo.
                {detalle ? (
                  <span className="mt-2 block font-medium text-red-800">
                    Detalle: {detalle}
                  </span>
                ) : null}
              </div>
            )}

          <FormularioTrabajo
            clientes={
              listaClientes
            }
            subtiendas={
              listaSubtiendas
            }
            areas={
              listaAreas
            }
            vehiculos={
              listaVehiculos
            }
            empleados={
              listaEmpleados
            }
            cotizacionesAprobadas={
              listaCotizacionesAprobadas
            }
            fechaInicial={
              obtenerFechaHoyGuatemala()
            }
            cotizacion={
              cotizacionOrigen
            }

            bloquearCotizacion={Boolean(
              cotizacionOrigen,
            )}
          />
        </div>
      </section>
    </AppShell>
  );
}