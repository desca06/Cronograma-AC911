import "dotenv/config";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

import { db } from "../src/db";
import { usuarios } from "../src/db/schema";

async function crearAdministrador() {
  const nombre = process.env.ADMIN_NAME?.trim();
  const correo = process.env.ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !correo || !password) {
    throw new Error(
      "Faltan ADMIN_NAME, ADMIN_EMAIL o ADMIN_PASSWORD en .env.",
    );
  }

  if (password.length < 8) {
    throw new Error(
      "La contraseña del administrador debe tener al menos 8 caracteres.",
    );
  }

  const passwordHash = await hash(password, 12);

  const usuarioExistente = db
    .select()
    .from(usuarios)
    .where(eq(usuarios.correo, correo))
    .get();

  if (usuarioExistente) {
    db.update(usuarios)
      .set({
        nombre,
        passwordHash,
        rol: "SUPERVISOR",
        activo: true,
      })
      .where(eq(usuarios.id, usuarioExistente.id))
      .run();

    console.log("Administrador actualizado correctamente.");
    return;
  }

  db.insert(usuarios)
    .values({
      nombre,
      correo,
      passwordHash,
      rol: "SUPERVISOR",
      activo: true,
    })
    .run();

  console.log("Administrador creado correctamente.");
}

crearAdministrador().catch((error) => {
  console.error(error);
  process.exit(1);
});