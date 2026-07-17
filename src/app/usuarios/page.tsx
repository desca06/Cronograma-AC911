import { asc, desc, eq } from "drizzle-orm";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import {
  empleados,
  usuarios,
} from "@/db/schema";
import { requerirSupervisor } from "@/lib/auth";

import {
  actualizarUsuario,
  cambiarPasswordUsuario,
  crearUsuario,
} from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UsuariosPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    exito?: string | string[];
  }>;
};

export default async function UsuariosPage({
  searchParams,
}: UsuariosPageProps) {
  const sesion = await requerirSupervisor();
  const parametros = await searchParams;

  const error =
    typeof parametros.error === "string"
      ? parametros.error
      : "";

  const exito =
    typeof parametros.exito === "string"
      ? parametros.exito
      : "";

  const listaEmpleados = db
    .select({
      id: empleados.id,
      nombre: empleados.nombre,
      puesto: empleados.puesto,
    })
    .from(empleados)
    .where(eq(empleados.activo, true))
    .orderBy(asc(empleados.nombre))
    .all();

  const listaUsuarios = db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      correo: usuarios.correo,
      rol: usuarios.rol,
      activo: usuarios.activo,
      empleadoId: usuarios.empleadoId,
    })
    .from(usuarios)
    .orderBy(desc(usuarios.id))
    .all();

  const mensajeError =
    error === "correo"
      ? "Ese correo ya está registrado."
      : error === "password"
        ? "La contraseña debe tener al menos 8 caracteres."
        : error === "empleado"
          ? "Los usuarios técnicos deben vincularse con un empleado."
          : error
            ? "Revisa los datos ingresados."
            : "";

  const mensajeExito =
    exito === "creado"
      ? "Usuario creado correctamente."
      : exito === "actualizado"
        ? "Usuario actualizado correctamente."
        : exito === "password"
          ? "Contraseña actualizada correctamente."
          : "";

  return (
    <AppShell>
      <PageHeader
        title="Usuarios"
        description="Administra cuentas, roles y empleados vinculados"
      />

      <section className="space-y-7 p-5 md:p-8">
        {mensajeError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {mensajeError}
          </div>
        )}

        {mensajeExito && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {mensajeExito}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Crear usuario
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Los técnicos deben vincularse con un empleado
              registrado.
            </p>
          </div>

          {listaEmpleados.length === 0 && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              No hay empleados activos. Registra empleados antes de
              crear una cuenta de técnico.
            </div>
          )}

          <form
            action={crearUsuario}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <div>
              <label
                htmlFor="nombre"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nombre
              </label>

              <input
                id="nombre"
                name="nombre"
                required
                placeholder="Nombre completo"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="correo"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Correo electrónico
              </label>

              <input
                id="correo"
                name="correo"
                type="email"
                required
                placeholder="usuario@empresa.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Contraseña
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="rol"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Rol
              </label>

              <select
                id="rol"
                name="rol"
                defaultValue="TECNICO"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="TECNICO">Técnico</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="empleadoId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Empleado vinculado
              </label>

              <select
                id="empleadoId"
                name="empleadoId"
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Sin empleado vinculado
                </option>

                {listaEmpleados.map((empleado) => (
                  <option
                    key={empleado.id}
                    value={empleado.id}
                  >
                    {empleado.nombre} — {empleado.puesto}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Crear usuario
              </button>
            </div>
          </form>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Usuarios registrados
            </h2>

            <p className="text-sm text-slate-500">
              Total: {listaUsuarios.length}
            </p>
          </div>

          <div className="space-y-5">
            {listaUsuarios.map((usuario) => {
              const esUsuarioActual =
                usuario.id === sesion.usuarioId;

              return (
                <article
                  key={usuario.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {usuario.nombre}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {esUsuarioActual
                          ? "Esta es tu cuenta actual"
                          : `Usuario #${usuario.id}`}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        usuario.activo
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <form
                    action={actualizarUsuario}
                    className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={usuario.id}
                    />

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre
                      </label>

                      <input
                        name="nombre"
                        required
                        defaultValue={usuario.nombre}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Correo
                      </label>

                      <input
                        name="correo"
                        type="email"
                        required
                        defaultValue={usuario.correo}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Rol
                      </label>

                      <select
                        name="rol"
                        defaultValue={usuario.rol}
                        disabled={esUsuarioActual}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
                      >
                        <option value="TECNICO">Técnico</option>
                        <option value="SUPERVISOR">
                          Supervisor
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Empleado vinculado
                      </label>

                      <select
                        name="empleadoId"
                        defaultValue={usuario.empleadoId ?? ""}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                      >
                        <option value="">
                          Sin empleado vinculado
                        </option>

                        {listaEmpleados.map((empleado) => (
                          <option
                            key={empleado.id}
                            value={empleado.id}
                          >
                            {empleado.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Estado
                      </label>

                      <label className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                        <input
                          name="activo"
                          type="checkbox"
                          defaultChecked={usuario.activo}
                          disabled={esUsuarioActual}
                          className="h-4 w-4"
                        />

                        <span className="text-sm font-medium text-slate-700">
                          Cuenta activa
                        </span>
                      </label>
                    </div>

                    <div className="md:col-span-2 xl:col-span-5">
                      <button
                        type="submit"
                        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </form>

                  <form
                    action={cambiarPasswordUsuario}
                    className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={usuario.id}
                    />

                    <input
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Nueva contraseña"
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <button
                      type="submit"
                      className="rounded-xl bg-amber-100 px-5 py-3 font-semibold text-amber-800 hover:bg-amber-200"
                    >
                      Cambiar contraseña
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </AppShell>
  );
}