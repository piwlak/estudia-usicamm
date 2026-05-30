import type { TrackingEntry } from "@/types/user";
import { ETIQUETAS_DIMENSION } from "@/lib/constants";

export interface StudySession {
  tipo: "debil_cat" | "debil_dim" | "simulacro" | "flashcards_errores";
  titulo: string;
  descripcion: string;
  config: {
    modo: "estudio" | "simulacro";
    cantidad: number;
    categoria?: string;
    dimension?: string;
    ponderado: boolean;
  };
}

interface CategoryStats {
  nombre: string;
  vistas: number;
  aciertos: number;
  tasa: number;
}

export function calcularPlanSugerido(
  trackingEntries: TrackingEntry[],
  totalBanco: number,
  preguntasPorCategoria: Record<string, number[]>,
  preguntasPorDimension: Record<string, number[]>
): StudySession[] | null {
  const totalVistas = trackingEntries.filter((t) => t.vistas > 0).length;

  if (totalVistas < 10) return null;

  const sessions: StudySession[] = [];

  const catStats = calcularStatsPorGrupo(
    trackingEntries,
    preguntasPorCategoria
  );
  const debilCat = catStats.find((c) => c.vistas >= 3);
  if (debilCat) {
    sessions.push({
      tipo: "debil_cat",
      titulo: `Reforzar: ${debilCat.nombre}`,
      descripcion: `Tu categoría más débil (${Math.round(debilCat.tasa * 100)}% de aciertos). 20 reactivos en modo estudio con selección ponderada.`,
      config: {
        modo: "estudio",
        cantidad: 20,
        categoria: debilCat.nombre,
        ponderado: true,
      },
    });
  }

  const dimStats = calcularStatsPorGrupo(
    trackingEntries,
    preguntasPorDimension
  );
  const debilDim = dimStats.find((d) => d.vistas >= 3);
  if (debilDim) {
    const etiqueta =
      ETIQUETAS_DIMENSION[debilDim.nombre] || debilDim.nombre;
    sessions.push({
      tipo: "debil_dim",
      titulo: `Dimensión: ${etiqueta}`,
      descripcion: `Tu dimensión más débil (${Math.round(debilDim.tasa * 100)}% de aciertos). 30 reactivos en modo estudio.`,
      config: {
        modo: "estudio",
        cantidad: 30,
        dimension: debilDim.nombre,
        ponderado: false,
      },
    });
  }

  sessions.push({
    tipo: "simulacro",
    titulo: "Simulacro completo",
    descripcion: "90 reactivos con tiempo límite. Simula condiciones reales del examen USICAMM.",
    config: {
      modo: "simulacro",
      cantidad: 90,
      ponderado: false,
    },
  });

  const debiles = trackingEntries.filter(
    (t) => t.vistas >= 2 && t.aciertos / t.vistas < 0.5
  );
  if (debiles.length >= 5) {
    sessions.push({
      tipo: "flashcards_errores",
      titulo: "Flashcards de errores recurrentes",
      descripcion: `${debiles.length} preguntas con tasa < 50%. Repásalas con flashcards para fijar los conceptos.`,
      config: {
        modo: "estudio",
        cantidad: Math.min(30, debiles.length),
        ponderado: true,
      },
    });
  }

  return sessions;
}

function calcularStatsPorGrupo(
  tracking: TrackingEntry[],
  grupoMap: Record<string, number[]>
): CategoryStats[] {
  const trackingMap = new Map(tracking.map((t) => [t.pregunta_id, t]));

  const stats: CategoryStats[] = Object.entries(grupoMap).map(
    ([nombre, ids]) => {
      let vistas = 0;
      let aciertos = 0;
      for (const id of ids) {
        const t = trackingMap.get(id);
        if (t && t.vistas > 0) {
          vistas += t.vistas;
          aciertos += t.aciertos;
        }
      }
      return {
        nombre,
        vistas,
        aciertos,
        tasa: vistas > 0 ? aciertos / vistas : 0,
      };
    }
  );

  return stats
    .filter((s) => s.vistas > 0)
    .sort((a, b) => a.tasa - b.tasa);
}
