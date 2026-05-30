import { create } from "zustand";
import type { PreguntaConShuffle } from "@/types/question";
import type { FlashcardResult, FlashcardState } from "@/lib/flashcards/deck-manager";
import {
  crearMazo,
  evaluarTarjeta,
  voltearTarjeta,
  esFin,
  getResumen,
} from "@/lib/flashcards/deck-manager";

interface FlashcardStore {
  // State
  state: FlashcardState | null;
  sessionComplete: boolean;

  // Actions
  iniciarSesion: (preguntas: PreguntaConShuffle[]) => void;
  voltear: () => void;
  evaluar: (resultado: FlashcardResult) => void;
  reset: () => void;

  // Computed helpers
  cartaActual: () => PreguntaConShuffle | null;
  progreso: () => { restantes: number; correctas: number; incorrectas: number; total: number };
}

export const useFlashcardStore = create<FlashcardStore>((set, get) => ({
  state: null,
  sessionComplete: false,

  iniciarSesion: (preguntas) => {
    set({ state: crearMazo(preguntas), sessionComplete: false });
  },

  voltear: () => {
    const { state } = get();
    if (!state) return;
    set({ state: voltearTarjeta(state) });
  },

  evaluar: (resultado) => {
    const { state } = get();
    if (!state) return;
    const nuevoState = evaluarTarjeta(state, resultado);
    const terminado = esFin(nuevoState);
    set({ state: nuevoState, sessionComplete: terminado });
  },

  reset: () => {
    set({ state: null, sessionComplete: false });
  },

  cartaActual: () => {
    const { state } = get();
    if (!state || esFin(state)) return null;
    return state.mazo[state.idx];
  },

  progreso: () => {
    const { state } = get();
    if (!state) return { restantes: 0, correctas: 0, incorrectas: 0, total: 0 };
    const resumen = getResumen(state);
    return {
      restantes: state.mazo.length - state.idx,
      correctas: resumen.sabidas,
      incorrectas: resumen.noSabidas,
      total: state.totalOriginal,
    };
  },
}));
