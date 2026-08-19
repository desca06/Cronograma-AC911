import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import {
  ArrowLeft,
  CalendarDays,
  IdCard,
  Phone,
  QrCode,
  RefreshCcw,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { empleadoQr, empleados } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth";

import {
  desvincularDispositivoEmpleado,
  eliminarQrEmpleado,
  generarQrEmpleado,
  regenerarQrEmpleado,
} from "./actions-qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    qr?: string;
  }>;
};

function formatearFecha(fecha: string | Date) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "long",
  }).format(new Date(fecha));
}

export default async function DetalleEmpleadoPage({
  params,
  searchParams,
}: PageProps) {
  await requerirAdmin();

  const { id } = await params;
  const parametros = await searchParams;

  const empleadoId = Number(id);

  if (
    !Number.isInteger(empleadoId) ||
    empleadoId <= 0
  ) {
    notFound();
  }

  const [empleado] = await db
    .select({
      id: empleados.id,
      nombre: empleados.nombre,
      telefono: empleados.telefono,
      puesto: empleados.puesto,
      activo: empleados.activo,
      creadoEn: empleados.creadoEn,
      qrToken: empleadoQr.token,
      qrActualizadoEn: empleadoQr.actualizadoEn,
      dispositivoRegistradoEn:
        empleadoQr.dispositivoRegistradoEn,
    })
    .from(empleados)
    .leftJoin(
      empleadoQr,
      eq(empleadoQr.empleadoId, empleados.id),
    )
    .where(eq(empleados.id, empleadoId))
    .limit(1);

  if (!empleado) {
    notFound();
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://192.168.0.113:3000";

  const urlMarcacion = empleado.qrToken
    ? `${appUrl}/asistencia/${empleado.qrToken}`
    : null;

  const imagenQr = urlMarcacion
    ? await QRCode.toDataURL(urlMarcacion, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
      })
    : null;

  const generar = generarQrEmpleado.bind(
    null,
    empleado.id,
  );

  const regenerar = regenerarQrEmpleado.bind(
    null,
    empleado.id,
  );

  const eliminar = eliminarQrEmpleado.bind(
    null,
    empleado.id,
  );

  const desvincular =
    desvincularDispositivoEmpleado.bind(
      null,
      empleado.id,
    );

  return (
    <AppShell>
      <PageHeader
        title="Detalle del empleado"
        description="Consulta la información del empleado y administra su código QR de asistencia."
      />

      <section className="space-y-6 p-5 md:p-8">
        <Link
          href="/empleados"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Regresar a Empleados
        </Link>

        {parametros.qr === "generado" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Código QR generado correctamente.
          </div>
        )}

        {parametros.qr === "regenerado" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            Código QR regenerado correctamente. El código anterior dejó de funcionar.
          </div>
        )}

        {parametros.qr === "eliminado" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Código QR eliminado correctamente.
          </div>
        )}

        {parametros.qr === "dispositivo" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            Teléfono desvinculado. El empleado podrá registrar un celular nuevo en su próxima marcación.
          </div>
        )}

        {parametros.qr === "existente" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            Este empleado ya tiene un código QR asignado.
          </div>
        )}

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <UserRound size={28} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {empleado.nombre}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {empleado.puesto}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-bold ${
                empleado.activo
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {empleado.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </article>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <IdCard size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Información del empleado
                </h3>

                <p className="text-sm text-slate-500">
                  Datos básicos registrados en el sistema.
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nombre
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {empleado.nombre}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Puesto
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {empleado.puesto}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Phone size={14} />
                  Teléfono
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {empleado.telefono || "No registrado"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <CalendarDays size={14} />
                  Registrado
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {formatearFecha(empleado.creadoEn)}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <QrCode size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Código QR de asistencia
                </h3>

                <p className="text-sm text-slate-500">
                  Identificador único para registrar entrada y salida.
                </p>
              </div>
            </div>

            {!imagenQr ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <QrCode size={32} />
                </div>

                <h4 className="mt-4 font-bold text-slate-900">
                  Sin código QR
                </h4>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Generá un código único para que este empleado pueda registrar su asistencia.
                </p>

                <form action={generar}>
                  <button
                    type="submit"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                  >
                    <QrCode size={18} />
                    Generar código QR
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-5">
                  <img
                    src={imagenQr}
                    alt={`Código QR de ${empleado.nombre}`}
                    width={260}
                    height={260}
                    className="h-auto max-w-full"
                  />
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <p className="font-semibold">
                    QR asignado a {empleado.nombre}
                  </p>

                  <p className="mt-1 leading-6">
                    Al escanearlo, el sistema identificará automáticamente al empleado y registrará la hora del servidor.
                  </p>

                  {empleado.qrActualizadoEn && (
                    <p className="mt-2 text-xs text-blue-600">
                      Actualizado:{" "}
                      {formatearFecha(
                        empleado.qrActualizadoEn,
                      )}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700">
                      <Smartphone size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Teléfono vinculado
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {empleado.dispositivoRegistradoEn
                          ? `Registrado el ${formatearFecha(
                              empleado.dispositivoRegistradoEn,
                            )}. Solo ese celular puede marcar asistencia.`
                          : "Todavía no hay celular registrado. Se asignará en la primera marcación del empleado."}
                      </p>
                    </div>
                  </div>

                  {empleado.dispositivoRegistradoEn && (
                    <form action={desvincular} className="mt-4">
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-3 text-sm font-semibold text-orange-800 transition hover:bg-orange-50"
                      >
                        <Smartphone size={17} />
                        Desvincular teléfono
                      </button>
                    </form>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <form
                    action={regenerar}
                    className="flex-1"
                  >
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <RefreshCcw size={17} />
                      Regenerar QR
                    </button>
                  </form>

                  <form
                    action={eliminar}
                    className="flex-1"
                  >
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                      Eliminar QR
                    </button>
                  </form>
                </div>
              </div>
            )}
          </article>
        </div>
      </section>
    </AppShell>
  );
}