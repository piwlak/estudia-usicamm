import type { TipoPregunta, NivelId } from "./database";

export interface Pregunta {
  id: number;
  nivel_id: NivelId;
  fuente: string | null;
  categoria: string;
  subcategoria: string | null;
  dimension: string;
  tipo: TipoPregunta;
  caso: string | null;
  pregunta: string;
  opciones: string[];
  respuesta: number;
  explicacion: string | null;
  cita: string | null;
}

export interface PreguntaConShuffle extends Pregunta {
  _opciones: string[];
  _respuesta: number;
  _indicesOriginales: number[];
}

export interface ExamFilters {
  categoria: string;
  dimension: string;
  tipo: string;
  cantidad: number | "todas";
  modo: "estudio" | "simulacro";
  ponderado: boolean;
  busqueda: string;
}
