import {
  desc,
  eq,
} from "drizzle-orm";
import {
  BellRing,
  CheckCircle2,
  CircleOff,
  MonitorSmartphone,
  Smartphone,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import {
  AppShell,
} from "@/components/app-shell";
import {
  PageHeader,
} from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  suscripcionesPush,
  usuarios,
} from "@/db/schema";
import {
  requerirAdmin,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

type UsuarioPush = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  empleadoNombre: string | null;
  dispositivos: {
    id: number;
    navegador: string | null;
    actualizadoEn: string;
  }[];
};

function formatearFecha(
  valor: string,
) {
  try {
    return new Intl.DateTimeFormat(
      "es-GT",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone:
          "America/Guatemala",
      },
    ).format(
      new Date(valor),
    );
  } catch {
    return valor;
  }
}

function resumirNavegador(
  navegador: string | null,
) {
  if (!navegador) {
    return "Navegador no identificado";
  }

  const texto =
    navegador.toLowerCase();

  if (
    texto.includes("android") &&
    texto.includes("chrome")
  ) {
    return "Chrome · Android";
  }

  if (
    texto.includes("iphone") ||
    texto.includes("ipad")
  ) {
    return "Safari · iPhone/iPad";
  }

  if (
    texto.includes("edg/")
  ) {
    return "Microsoft Edge";
  }

  if (
    texto.includes("chrome")
  ) {
    return "Google Chrome";
  }

  if (
    texto.includes("firefox")
  ) {
    return "Mozilla Firefox";
  }

  if (
    texto.includes("safari")
  ) {
    return "Safari";
  }

  return navegador.slice(
    0,
    70,
  );
}

export default async function AdministracionNotificacionesPage() {
  await requerirAdmin();

  const filas =
    await db
      .select({
        usuarioId:
          usuarios.id,
        usuarioNombre:
          usuarios.nombre,
        correo:
          usuarios.correo,
        rol:
          usuarios.rol,
        usuarioActivo:
          usuarios.activo,
        empleadoNombre:
          empleados.nombre,
        suscripcionId:
          suscripcionesPush.id,
        navegador:
          suscripcionesPush.navegador,
        actualizadoEn:
          suscripcionesPush.actualizadoEn,
      })
      .from(
        usuarios,
      )
      .leftJoin(
        empleados,
        eq(
          usuarios.empleadoId,
          empleados.id,
        ),
      )
      .leftJoin(
        suscripcionesPush,
        eq(
          suscripcionesPush.usuarioId,
          usuarios.id,
        ),
      )
      .orderBy(
        desc(
          usuarios.activo,
        ),
        usuarios.nombre,
      );

  const mapa =
    new Map<
      number,
      UsuarioPush
    >();

  for (
    const fila
    of filas
  ) {
    let usuario =
      mapa.get(
        fila.usuarioId,
      );

    if (!usuario) {
      usuario = {
        id:
          fila.usuarioId,
        nombre:
          fila.usuarioNombre,
        correo:
          fila.correo,
        rol:
          fila.rol,
        activo:
          fila.usuarioActivo,
        empleadoNombre:
          fila.empleadoNombre,
        dispositivos: [],
      };

      mapa.set(
        fila.usuarioId,
        usuario,
      );
    }

    if (
      fila.suscripcionId &&
      fila.actualizadoEn
    ) {
      usuario.dispositivos.push(
        {
          id:
            fila.suscripcionId,
          navegador:
            fila.navegador,
          actualizadoEn:
            fila.actualizadoEn,
        },
      );
    }
  }

  const lista =
    [...mapa.values()];

  const usuariosActivos =
    lista.filter(
      (usuario) =>
        usuario.activo,
    );

  const conPush =
    usuariosActivos.filter(
      (usuario) =>
        usuario.dispositivos.length >
        0,
    );

  const sinPush =
    usuariosActivos.filter(
      (usuario) =>
        usuario.dispositivos.length ===
        0,
    );

  const totalDispositivos =
    usuariosActivos.reduce(
      (
        acumulado,
        usuario,
      ) =>
        acumulado +
        usuario.dispositivos.length,
      0,
    );

  return (
    <AppShell>
      <PageHeader
        title="Administración de notificaciones"
        description="Controla qué usuarios tienen dispositivos registrados para recibir Web Push."
      />

      <section className="space-y-6 p-5 md:p-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/notificaciones"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <BellRing
              size={18}
            />
            Ir a notificaciones
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                Usuarios activos
              </span>

              <UsersRound
                size={21}
                className="text-blue-600"
              />
            </div>

            <p className="mt-3 text-3xl font-black text-slate-900">
              {usuariosActivos.length}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-700">
                Push activo
              </span>

              <CheckCircle2
                size={21}
                className="text-emerald-600"
              />
            </div>

            <p className="mt-3 text-3xl font-black text-emerald-900">
              {conPush.length}
            </p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-700">
                Sin activar
              </span>

              <CircleOff
                size={21}
                className="text-amber-600"
              />
            </div>

            <p className="mt-3 text-3xl font-black text-amber-900">
              {sinPush.length}
            </p>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700">
                Dispositivos
              </span>

              <MonitorSmartphone
                size={21}
                className="text-blue-600"
              />
            </div>

            <p className="mt-3 text-3xl font-black text-blue-900">
              {totalDispositivos}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Usuarios y dispositivos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Un usuario puede registrar más de un teléfono o navegador.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {lista.length ===
            0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay usuarios registrados.
              </div>
            ) : (
              lista.map(
                (usuario) => {
                  const pushActivo =
                    usuario.dispositivos.length >
                    0;

                  return (
                    <article
                      key={
                        usuario.id
                      }
                      className="grid gap-4 p-5 lg:grid-cols-[1.4fr_0.8fr_1fr]"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900">
                            {usuario.empleadoNombre ??
                              usuario.nombre}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                            {usuario.rol}
                          </span>

                          {!usuario.activo && (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                              USUARIO INACTIVO
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {usuario.correo}
                        </p>

                        {usuario.empleadoNombre && (
                          <p className="mt-1 text-xs text-slate-400">
                            Cuenta: {usuario.nombre}
                          </p>
                        )}
                      </div>

                      <div className="flex items-start">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                            pushActivo
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {pushActivo ? (
                            <CheckCircle2
                              size={15}
                            />
                          ) : (
                            <CircleOff
                              size={15}
                            />
                          )}

                          {pushActivo
                            ? `Push activo · ${usuario.dispositivos.length}`
                            : "Sin dispositivo"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {usuario.dispositivos.length >
                        0 ? (
                          usuario.dispositivos.map(
                            (
                              dispositivo,
                            ) => (
                              <div
                                key={
                                  dispositivo.id
                                }
                                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                              >
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                  <Smartphone
                                    size={16}
                                  />

                                  {resumirNavegador(
                                    dispositivo.navegador,
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  Última validación:{" "}
                                  {formatearFecha(
                                    dispositivo.actualizadoEn,
                                  )}
                                </p>
                              </div>
                            ),
                          )
                        ) : (
                          <p className="text-sm text-slate-500">
                            Debe iniciar sesión en su dispositivo y activar las notificaciones desde{" "}
                            <span className="font-semibold text-slate-700">
                              /notificaciones
                            </span>
                            .
                          </p>
                        )}
                      </div>
                    </article>
                  );
                },
              )
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
}