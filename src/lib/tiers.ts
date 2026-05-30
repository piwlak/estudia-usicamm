import type { Rol } from "@/types/database";

export interface TierLimits {
  maxPreguntasExamen: number;
  modoSimulacro: boolean;
  flashcards: boolean;
  progreso: boolean;
  glosario: boolean;
  resumenes: boolean;
  maxExamenesDiarios: number | null;
}

export const TIER_CONFIG: Record<Rol, TierLimits> = {
  usuario: {
    maxPreguntasExamen: 10,
    modoSimulacro: false,
    flashcards: false,
    progreso: false,
    glosario: true,
    resumenes: false,
    maxExamenesDiarios: 3,
  },
  premium: {
    maxPreguntasExamen: 100,
    modoSimulacro: true,
    flashcards: true,
    progreso: true,
    glosario: true,
    resumenes: true,
    maxExamenesDiarios: null,
  },
  admin: {
    maxPreguntasExamen: 100,
    modoSimulacro: true,
    flashcards: true,
    progreso: true,
    glosario: true,
    resumenes: true,
    maxExamenesDiarios: null,
  },
};

export function getTierLimits(rol: Rol): TierLimits {
  return TIER_CONFIG[rol] || TIER_CONFIG.usuario;
}

export function canAccess(rol: Rol, feature: keyof TierLimits): boolean {
  const limits = getTierLimits(rol);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  return true;
}
