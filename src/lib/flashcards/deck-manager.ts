import type { PreguntaConShuffle } from "@/types/question";

export type FlashcardResult = "sabia" | "no_sabia" | "saltada";

export interface FlashcardState {
  mazo: PreguntaConShuffle[];
  idx: number;
  volteada: boolean;
  resultados: Record<number, FlashcardResult>;
  totalOriginal: number;
  reinsertadas: Set<number>;
}

export function crearMazo(preguntas: PreguntaConShuffle[]): FlashcardState {
  return {
    mazo: [...preguntas],
    idx: 0,
    volteada: false,
    resultados: {},
    totalOriginal: preguntas.length,
    reinsertadas: new Set(),
  };
}

export function evaluarTarjeta(
  state: FlashcardState,
  resultado: FlashcardResult
): FlashcardState {
  const nuevoState = { ...state, resultados: { ...state.resultados } };
  const preguntaActual = state.mazo[state.idx];
  nuevoState.resultados[preguntaActual.id] = resultado;

  if (
    resultado === "no_sabia" &&
    !state.reinsertadas.has(preguntaActual.id)
  ) {
    const posReinsert = Math.min(
      state.idx + 4 + Math.floor(Math.random() * 4),
      state.mazo.length
    );
    const nuevoMazo = [...state.mazo];
    nuevoMazo.splice(posReinsert, 0, preguntaActual);
    nuevoState.mazo = nuevoMazo;
    nuevoState.reinsertadas = new Set(state.reinsertadas);
    nuevoState.reinsertadas.add(preguntaActual.id);
  }

  nuevoState.idx = state.idx + 1;
  nuevoState.volteada = false;

  return nuevoState;
}

export function voltearTarjeta(state: FlashcardState): FlashcardState {
  return { ...state, volteada: !state.volteada };
}

export function anteriorTarjeta(state: FlashcardState): FlashcardState {
  if (state.idx <= 0) return state;
  const nuevoState = { ...state, resultados: { ...state.resultados } };
  nuevoState.idx = state.idx - 1;
  nuevoState.volteada = false;
  const preguntaAnterior = state.mazo[nuevoState.idx];
  delete nuevoState.resultados[preguntaAnterior.id];
  return nuevoState;
}

export function esFin(state: FlashcardState): boolean {
  return state.idx >= state.mazo.length;
}

export function getResumen(state: FlashcardState) {
  const sabidas = Object.values(state.resultados).filter(
    (r) => r === "sabia"
  ).length;
  const noSabidas = Object.values(state.resultados).filter(
    (r) => r === "no_sabia"
  ).length;
  const saltadas = Object.values(state.resultados).filter(
    (r) => r === "saltada"
  ).length;
  return { sabidas, noSabidas, saltadas, total: state.totalOriginal };
}
