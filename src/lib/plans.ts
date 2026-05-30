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
      "Todo lo del plan mensual",
      "Ahorro de 33% vs mensual",
      "Acceso a todos los niveles",
      "Soporte prioritario",
    ],
  },
} as const;
