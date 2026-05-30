import type { PreguntaConShuffle } from "@/types/question";

export interface ExamResult {
  correctas: number;
  total: number;
  porcentaje: number;
  tiempoSegundos: number;
  porDimension: Record<string, { correctas: number; total: number }>;
  porCategoria: Record<string, { correctas: number; total: number }>;
}

export function calcularResultados(
  preguntas: PreguntaConShuffle[],
  respuestas: (number | null)[],
  tiempoSegundos: number
): ExamResult {
  let correctas = 0;
  const porDimension: Record<string, { correctas: number; total: number }> = {};
  const porCategoria: Record<string, { correctas: number; total: number }> = {};

  for (let i = 0; i < preguntas.length; i++) {
    const p = preguntas[i];
    const esCorrecta = respuestas[i] === p._respuesta;
    if (esCorrecta) correctas++;

    if (!porDimension[p.dimension]) {
      porDimension[p.dimension] = { correctas: 0, total: 0 };
    }
    porDimension[p.dimension].total++;
    if (esCorrecta) porDimension[p.dimension].correctas++;

    if (!porCategoria[p.categoria]) {
      porCategoria[p.categoria] = { correctas: 0, total: 0 };
    }
    porCategoria[p.categoria].total++;
    if (esCorrecta) porCategoria[p.categoria].correctas++;
  }

  return {
    correctas,
    total: preguntas.length,
    porcentaje: Math.round((correctas / preguntas.length) * 100),
    tiempoSegundos,
    porDimension,
    porCategoria,
  };
}
