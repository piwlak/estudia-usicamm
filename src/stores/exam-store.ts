import { create } from "zustand";
import type { PreguntaConShuffle } from "@/types/question";
import type { ModoExamen } from "@/types/database";
import type { ExamResult } from "@/lib/exam-engine/scoring";

export interface ExamConfig {
  modo: ModoExamen;
  cantidad: number;
  dimensiones: string[];
  tipos: string[];
}

interface ExamState {
  // Configuration
  config: ExamConfig;
  setConfig: (config: Partial<ExamConfig>) => void;

  // Exam state
  preguntas: PreguntaConShuffle[];
  respuestas: (number | null)[];
  indiceActual: number;
  enProgreso: boolean;
  finalizado: boolean;

  // Timer
  tiempoRestante: number;
  tiempoTotal: number;
  tiempoInicio: number | null;

  // Results
  resultado: ExamResult | null;

  // Actions
  iniciarExamen: (preguntas: PreguntaConShuffle[], tiempoTotal: number) => void;
  responder: (indice: number, opcion: number) => void;
  irAPregunta: (indice: number) => void;
  siguiente: () => void;
  anterior: () => void;
  actualizarTiempo: (segundos: number) => void;
  finalizarExamen: (resultado: ExamResult) => void;
  reiniciar: () => void;
}

const configInicial: ExamConfig = {
  modo: "estudio",
  cantidad: 20,
  dimensiones: [],
  tipos: [],
};

export const useExamStore = create<ExamState>((set, get) => ({
  config: configInicial,
  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  preguntas: [],
  respuestas: [],
  indiceActual: 0,
  enProgreso: false,
  finalizado: false,

  tiempoRestante: 0,
  tiempoTotal: 0,
  tiempoInicio: null,

  resultado: null,

  iniciarExamen: (preguntas, tiempoTotal) =>
    set({
      preguntas,
      respuestas: new Array(preguntas.length).fill(null),
      indiceActual: 0,
      enProgreso: true,
      finalizado: false,
      tiempoRestante: tiempoTotal,
      tiempoTotal,
      tiempoInicio: Date.now(),
      resultado: null,
    }),

  responder: (indice, opcion) =>
    set((state) => {
      const nuevasRespuestas = [...state.respuestas];
      nuevasRespuestas[indice] = opcion;
      return { respuestas: nuevasRespuestas };
    }),

  irAPregunta: (indice) => set({ indiceActual: indice }),

  siguiente: () =>
    set((state) => ({
      indiceActual: Math.min(state.indiceActual + 1, state.preguntas.length - 1),
    })),

  anterior: () =>
    set((state) => ({
      indiceActual: Math.max(state.indiceActual - 1, 0),
    })),

  actualizarTiempo: (segundos) => set({ tiempoRestante: segundos }),

  finalizarExamen: (resultado) =>
    set({
      enProgreso: false,
      finalizado: true,
      resultado,
    }),

  reiniciar: () =>
    set({
      preguntas: [],
      respuestas: [],
      indiceActual: 0,
      enProgreso: false,
      finalizado: false,
      tiempoRestante: 0,
      tiempoTotal: 0,
      tiempoInicio: null,
      resultado: null,
    }),
}));
