export const SEGUNDOS_POR_PREGUNTA_SIMULACRO = 144;

export const HISTORIAL_MAX_ENTRIES = 50;

export const ETIQUETAS_DIMENSION: Record<string, string> = {
  agente_formativo: "Agente formativo",
  conoce_alumnos: "Conoce a sus alumnos",
  pensamiento_didactico: "Pensamiento didáctico",
  escuela_transformacion: "Escuela y transformación",
  saberes_academicos: "Saberes académicos",
  inclusion_equidad: "Inclusión y equidad",
  practica_docente: "Práctica docente",
  convivencia_paz: "Convivencia y paz",
  desarrollo_infantil: "Desarrollo infantil",
  marco_normativo: "Marco normativo",
  diversidad_culturas: "Diversidad y culturas",
  evaluacion_formativa: "Evaluación formativa",
  liderazgo_escolar: "Liderazgo escolar",
  bienestar_socioemocional: "Bienestar socioemocional",
};

export const ETIQUETAS_TIPO: Record<string, string> = {
  directo: "Cuestionamiento directo",
  caso: "Caso situacional",
  valoracion: "Valoración / juicio",
  completamiento: "Completamiento",
  secuencia: "Ordenamiento / secuencia",
  multireactivo: "Multireactivo",
};

export const ETIQUETAS_MODO = {
  estudio: "Estudio (con feedback inmediato)",
  simulacro: "Simulacro (con tiempo límite)",
} as const;

export const NIVELES = {
  "inicial-preescolar": {
    nombre: "Educación Inicial y Preescolar",
    descripcion: "Fase 1 y Fase 2 del Plan de Estudio 2022",
    icono: "👶",
  },
  primaria: {
    nombre: "Educación Primaria",
    descripcion: "Fase 3, 4 y 5 del Plan de Estudio 2022",
    icono: "📖",
  },
  telesecundaria: {
    nombre: "Telesecundaria",
    descripcion: "Fase 6 del Plan de Estudio 2022",
    icono: "🏫",
  },
} as const;
