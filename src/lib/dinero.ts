export function quetzalesACentavos(
  valor: FormDataEntryValue | null,
) {
  const texto = String(valor ?? "")
    .trim()
    .replace(",", ".");

  if (!texto) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
    throw new Error("SALARIO");
  }

  const [enteros, decimales = ""] = texto.split(".");
  const centavos =
    Number(enteros) * 100 +
    Number((decimales + "00").slice(0, 2));

  if (!Number.isInteger(centavos) || centavos < 0) {
    throw new Error("SALARIO");
  }

  return centavos;
}

export function centavosAQuetzalesInput(
  centavos: number | null | undefined,
) {
  if (centavos == null) {
    return "";
  }

  const entero = Math.trunc(centavos / 100);
  const fraccion = Math.abs(centavos % 100);

  if (fraccion === 0) {
    return String(entero);
  }

  return `${entero}.${String(fraccion).padStart(2, "0")}`;
}