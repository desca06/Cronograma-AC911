import "dotenv/config";
import { Client } from "pg";

const databaseUrl =
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "No existe DATABASE_URL en el archivo .env",
  );
}

const cliente = new Client({
  connectionString: databaseUrl,
});

async function probarConexion() {
  try {
    await cliente.connect();

    const resultado = await cliente.query(
      "SELECT current_database() AS base, NOW() AS fecha",
    );

    console.log(
      "✅ Conexión correcta a PostgreSQL",
    );

    console.log(resultado.rows[0]);
  } catch (error) {
    console.error(
      "❌ No se pudo conectar a PostgreSQL:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await cliente.end();
  }
}

probarConexion();