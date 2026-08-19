"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  clienteAreas,
  clienteSubtiendas,
  clientes,
} from "@/db/schema";
import { requerirSupervisor } from "@/lib/auth";

function obtenerTexto(
  formData: FormData,
  campo: string,
) {
  const valor = formData.get(campo);

  return typeof valor === "string" ? valor.trim() : "";
}

function leerId(formData: FormData, campo: string) {
  const numero = Number(formData.get(campo));

  if (!Number.isInteger(numero) || numero <= 0) {
    return null;
  }

  return numero;
}

function revalidarCliente(clienteId: number) {
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/trabajos/nuevo");
  revalidatePath("/trabajos");
}

export async function crearSubtienda(formData: FormData) {
  await requerirSupervisor();

  const clienteId = leerId(formData, "clienteId");
  const nombre = obtenerTexto(formData, "nombre");

  if (!clienteId || !nombre) {
    redirect(
      clienteId
        ? `/clientes/${clienteId}?error=nombre`
        : "/clientes?error=datos",
    );
  }

  const [cliente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.id, clienteId))
    .limit(1);

  if (!cliente) {
    redirect("/clientes?error=no-encontrado");
  }

  await db.insert(clienteSubtiendas).values({
    clienteId,
    nombre,
  });

  revalidarCliente(clienteId);
  redirect(`/clientes/${clienteId}?exito=subtienda`);
}

export async function eliminarSubtienda(formData: FormData) {
  await requerirSupervisor();

  const clienteId = leerId(formData, "clienteId");
  const subtiendaId = leerId(formData, "subtiendaId");

  if (!clienteId || !subtiendaId) {
    redirect(
      clienteId
        ? `/clientes/${clienteId}?error=datos`
        : "/clientes?error=datos",
    );
  }

  await db
    .delete(clienteSubtiendas)
    .where(
      and(
        eq(clienteSubtiendas.id, subtiendaId),
        eq(clienteSubtiendas.clienteId, clienteId),
      ),
    );

  revalidarCliente(clienteId);
  redirect(`/clientes/${clienteId}?exito=subtienda-eliminada`);
}

export async function crearArea(formData: FormData) {
  await requerirSupervisor();

  const clienteId = leerId(formData, "clienteId");
  const subtiendaId = leerId(formData, "subtiendaId");
  const nombre = obtenerTexto(formData, "nombre");

  if (!clienteId || !subtiendaId || !nombre) {
    redirect(
      clienteId
        ? `/clientes/${clienteId}?error=nombre`
        : "/clientes?error=datos",
    );
  }

  const [subtienda] = await db
    .select({ id: clienteSubtiendas.id })
    .from(clienteSubtiendas)
    .where(
      and(
        eq(clienteSubtiendas.id, subtiendaId),
        eq(clienteSubtiendas.clienteId, clienteId),
      ),
    )
    .limit(1);

  if (!subtienda) {
    redirect(`/clientes/${clienteId}?error=datos`);
  }

  await db.insert(clienteAreas).values({
    subtiendaId,
    nombre,
  });

  revalidarCliente(clienteId);
  redirect(`/clientes/${clienteId}?exito=area`);
}

export async function eliminarArea(formData: FormData) {
  await requerirSupervisor();

  const clienteId = leerId(formData, "clienteId");
  const areaId = leerId(formData, "areaId");

  if (!clienteId || !areaId) {
    redirect(
      clienteId
        ? `/clientes/${clienteId}?error=datos`
        : "/clientes?error=datos",
    );
  }

  const [area] = await db
    .select({
      id: clienteAreas.id,
    })
    .from(clienteAreas)
    .innerJoin(
      clienteSubtiendas,
      eq(clienteAreas.subtiendaId, clienteSubtiendas.id),
    )
    .where(
      and(
        eq(clienteAreas.id, areaId),
        eq(clienteSubtiendas.clienteId, clienteId),
      ),
    )
    .limit(1);

  if (!area) {
    redirect(`/clientes/${clienteId}?error=datos`);
  }

  await db
    .delete(clienteAreas)
    .where(eq(clienteAreas.id, areaId));

  revalidarCliente(clienteId);
  redirect(`/clientes/${clienteId}?exito=area-eliminada`);
}