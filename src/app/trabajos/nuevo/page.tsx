import {
  and,
  asc,
  eq,
  inArray,
} from "drizzle-orm";

import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import { db } from "@/db";
import {
  clientes,
  empleados,
  vehiculos,
} from "@/db/schema";
import {
  requerirSupervisor,
} from "@/lib/auth";

import {
  FormularioTrabajo,
} from "../nuevo/formulario-trabajo";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

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

export default async function NuevoTrabajoPage() {
  await requerirSupervisor();

  const [
    listaClientes,
    listaVehiculos,
    listaEmpleados,
  ] = await Promise.all([
    db
      .select({
        id: clientes.id,
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
        id: vehiculos.id,
        nombre:
          vehiculos.nombre,
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
        id: empleados.id,
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
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Nuevo trabajo"
        description="Crea una nueva orden y asignala al equipo de trabajo."
      />

      <section className="p-5 md:p-8">
        <div className="mx-auto max-w-6xl">
          <FormularioTrabajo
            clientes={
              listaClientes
            }
            vehiculos={
              listaVehiculos
            }
            empleados={
              listaEmpleados
            }
            fechaInicial={
              obtenerFechaHoyGuatemala()
            }
          />
        </div>
      </section>
    </AppShell>
  );
}  