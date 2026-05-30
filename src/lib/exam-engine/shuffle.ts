import type { Pregunta, PreguntaConShuffle } from "@/types/question";

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shuffleOptions(pregunta: Pregunta): PreguntaConShuffle {
  const indices = [0, 1, 2];
  const shuffledIndices = shuffleArray(indices);

  return {
    ...pregunta,
    _opciones: shuffledIndices.map((i) => pregunta.opciones[i]),
    _respuesta: shuffledIndices.indexOf(pregunta.respuesta),
    _indicesOriginales: shuffledIndices,
  };
}

export function shuffleAllOptions(preguntas: Pregunta[]): PreguntaConShuffle[] {
  return preguntas.map(shuffleOptions);
}
