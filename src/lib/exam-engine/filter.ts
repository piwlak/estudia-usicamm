import type { Pregunta, ExamFilters } from "@/types/question";

export function filterPreguntas(
  todas: Pregunta[],
  filtros: ExamFilters
): Pregunta[] {
  let resultado = todas;

  if (filtros.dimension !== "todas") {
    resultado = resultado.filter((p) => p.dimension === filtros.dimension);
  }

  if (filtros.tipo !== "todos") {
    resultado = resultado.filter((p) => p.tipo === filtros.tipo);
  }

  if (filtros.categoria !== "todas") {
    resultado = resultado.filter((p) => p.categoria === filtros.categoria);
  }

  if (filtros.busqueda.trim()) {
    const termino = filtros.busqueda.toLowerCase().trim();
    resultado = resultado.filter(
      (p) =>
        p.pregunta.toLowerCase().includes(termino) ||
        (p.caso && p.caso.toLowerCase().includes(termino)) ||
        p.opciones.some((o) => o.toLowerCase().includes(termino)) ||
        (p.explicacion && p.explicacion.toLowerCase().includes(termino)) ||
        (p.cita && p.cita.toLowerCase().includes(termino))
    );
  }

  return resultado;
}

export function getUniqueValues(preguntas: Pregunta[]) {
  const categorias = [...new Set(preguntas.map((p) => p.categoria))].sort();
  const dimensiones = [...new Set(preguntas.map((p) => p.dimension))].sort();
  const tipos = [...new Set(preguntas.map((p) => p.tipo))].sort();
  return { categorias, dimensiones, tipos };
}

export function countByField(
  preguntas: Pregunta[],
  field: keyof Pregunta
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of preguntas) {
    const val = String(p[field] ?? "sin valor");
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}
