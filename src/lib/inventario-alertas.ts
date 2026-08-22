export function normalizarNumeroSerie(
  valor: string | null | undefined,
) {
  const texto = String(valor ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  return texto || null;
}

export function validarNumeroSerie(valor: string) {
  return /^[A-Z0-9-]{4,40}$/.test(valor);
}

export function claveNombreCategoria(
  nombre: string,
  categoriaId: number,
) {
  return `${nombre.trim().toLowerCase()}::${categoriaId}`;
}