export const PLANS = {
  premium_monthly: {
    name: "Premium Mensual",
    price: 99,
    currency: "MXN",
    interval: "month" as const,
    features: [
      "Exámenes ilimitados",
      "Modo simulacro cronometrado",
      "Flashcards interactivas",
      "Resúmenes completos",
      "Progreso detallado por dimensión",
      "Hasta 100 preguntas por examen",
    ],
  },
  premium_yearly: {
    name: "Premium Anual",
    price: 799,
    currency: "MXN",
    interval: "year" as const,
    features: [
      "Exámenes ilimitados",
      "Modo simulacro cronometrado",
      "Flashcards interactivas",
      "Resúmenes completos",
      "Progreso detallado por dimensión",
      "Hasta 100 preguntas por examen",
      "Ahorro de 33% vs plan mensual",
    ],
  },
} as const;
