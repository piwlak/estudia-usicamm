"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLANS } from "@/lib/plans";

export default function PremiumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al iniciar el pago");
        setLoading(null);
      }
    } catch {
      alert("Error de conexión");
      setLoading(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors mb-4"
        >
          &larr; Volver al dashboard
        </Link>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Mejora tu preparación
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Desbloquea todas las herramientas para maximizar tus posibilidades de éxito en el examen USICAMM.
        </p>
      </div>

      {/* Comparison */}
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Plan Gratuito</h3>
          <ul className="space-y-2 text-slate-500 dark:text-slate-400">
            <li>Exámenes de hasta 10 preguntas</li>
            <li>3 exámenes por día</li>
            <li>Solo modo estudio</li>
            <li>Glosario</li>
          </ul>
        </div>
        <div className="p-5 rounded-xl border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950">
          <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-3">Plan Premium</h3>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            <li>Exámenes ilimitados (hasta 100 preguntas)</li>
            <li>Modo simulacro cronometrado</li>
            <li>Flashcards interactivas</li>
            <li>Resúmenes completos</li>
            <li>Progreso detallado por dimensión</li>
            <li>Acceso a todos los niveles</li>
          </ul>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Monthly */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{PLANS.premium_monthly.name}</h3>
          <div className="mt-3">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$99</span>
            <span className="text-sm text-slate-500 dark:text-slate-400"> MXN/mes</span>
          </div>
          <button
            onClick={() => handleCheckout("premium_monthly")}
            disabled={loading !== null}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
          >
            {loading === "premium_monthly" ? "Procesando..." : "Suscribirse mensual"}
          </button>
        </div>

        {/* Yearly */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Ahorra 33%
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{PLANS.premium_yearly.name}</h3>
          <div className="mt-3">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$799</span>
            <span className="text-sm text-slate-500 dark:text-slate-400"> MXN/año</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Equivale a $66.50/mes
          </p>
          <button
            onClick={() => handleCheckout("premium_yearly")}
            disabled={loading !== null}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
          >
            {loading === "premium_yearly" ? "Procesando..." : "Suscribirse anual"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Pago seguro con Stripe. Cancela en cualquier momento.
      </p>
    </div>
  );
}
