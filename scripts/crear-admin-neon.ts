import "dotenv/config";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { usuarios } from "../src/db/schema";

async function crearAdministrador() {
  const databaseUrl =
    process.env.DATABASE_URL?.trim();

  const nombre =
    process.env.ADMIN_NAME?.trim();

  const correo =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

  const password =
    process.env.ADMIN_PASSWORD;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL no está configurada.",
    );
  }

  if (
    !nombre ||
    !correo ||
    !password
  ) {
    throw new Error(
      "Faltan ADMIN_NAME, ADMIN_EMAIL o ADMIN_PASSWORD.",
    );
  }

  if (password.length < 10) {
    throw new Error(
      "La contraseña del administrador debe tener al menos 10 caracteres.",
    );
  }

  const passwordHash =
    await hash(
      password,
      12,
    );

  const [usuarioExistente] =
    await db
      .select({
        id:
          usuarios.id,
        correo:
          usuarios.correo,
      })
      .from(
        usuarios,
      )
      .where(
        eq(
          usuarios.correo,
          correo,
        ),
      )
      .limit(1);

  if (usuarioExistente) {
    await db
      .update(
        usuarios,
      )
      .set({
        nombre,
        passwordHash,
        rol: "ADMIN",
        activo: true,
      })
      .where(
        eq(
          usuarios.id,
          usuarioExistente.id,
        ),
      );

    console.log(
      `ADMIN actualizado correctamente: ${correo}`,
    );

    return;
  }

  await db
    .insert(
      usuarios,
    )
    .values({
      nombre,
      correo,
      passwordHash,
      rol: "ADMIN",
      activo: true,
    });

  console.log(
    `ADMIN creado correctamente: ${correo}`,
  );
}

crearAdministrador()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      "[AC911 CREAR ADMIN NEON]",
      error,
    );

    process.exit(1);
  });