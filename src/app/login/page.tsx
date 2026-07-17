import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { iniciarSesion } from "./actions";
export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const sesion = await obtenerSesion();

  if (sesion) {
    redirect("/dashboard");
  }

  const parametros = await searchParams;

  const error =
    typeof parametros.error === "string"
      ? parametros.error
      : "";

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-7 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-600 text-2xl text-white">
            ⚙
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-widest text-blue-700">
            Control de Trabajos
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Iniciar sesión
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ingresa tus credenciales para continuar.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error === "campos"
              ? "Completa el correo y la contraseña."
              : "Correo o contraseña incorrectos."}
          </div>
        )}

        <form
          action={iniciarSesion}
          className="space-y-5"
        >
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
              autoComplete="email"
              placeholder="admin@empresa.com"
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
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Entrar al sistema
          </button>
        </form>
      </section>
    </main>
  );
}