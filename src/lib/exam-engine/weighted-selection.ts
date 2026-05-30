import type { Pregunta } from "@/types/question";
import type { TrackingEntry } from "@/types/user";

interface WeightedItem {
  pregunta: Pregunta;
  weight: number;
}

export function calcularPeso(tracking: TrackingEntry | undefined): number {
  if (!tracking || tracking.vistas === 0) return 1;
  const tasa = tracking.aciertos / tracking.vistas;
  return Math.max(0.5, 3 - 2 * tasa);
}

export function seleccionPonderada(
  preguntas: Pregunta[],
  trackingMap: Map<number, TrackingEntry>,
  cantidad: number
): Pregunta[] {
  if (preguntas.length <= cantidad) {
    return shuffleForSelection(preguntas);
  }

  const items: WeightedItem[] = preguntas.map((p) => ({
    pregunta: p,
    weight: calcularPeso(trackingMap.get(p.id)),
  }));

  const seleccionadas: Pregunta[] = [];
  const disponibles = [...items];

  for (let i = 0; i < cantidad && disponibles.length > 0; i++) {
    const totalWeight = disponibles.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedIdx = 0;
    for (let j = 0; j < disponibles.length; j++) {
      random -= disponibles[j].weight;
      if (random <= 0) {
        selectedIdx = j;
        break;
      }
    }

    seleccionadas.push(disponibles[selectedIdx].pregunta);
    disponibles.splice(selectedIdx, 1);
  }

  return seleccionadas;
}

function shuffleForSelection<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
