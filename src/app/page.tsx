import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-4xl font-extrabold shadow-xl mb-6">
          U
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Prepara tu examen USICAMM
          <br />
          <span className="text-[var(--primary)]">con confianza</span>
        </h1>

        <p className="mt-4 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
          +1,200 reactivos basados en la bibliografía oficial 2026-2027.
          Practica, estudia y aprueba tu examen de Admisión Docente.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/registro"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            Comenzar gratis
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 font-semibold text-lg text-slate-700 dark:text-slate-200 hover:border-[var(--primary)] transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
          Sin tarjeta de crédito. Empieza a practicar hoy mismo.
        </p>
      </section>

      {/* Niveles */}
      <section className="px-6 py-16 bg-white/50 dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white mb-3">
            Tres niveles, un solo objetivo
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-10">
            Contenido actualizado para el ciclo 2026-2027
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">👶</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Inicial y Preescolar</h3>
              <p className="text-2xl font-extrabold text-[var(--primary)] mt-1">520+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">reactivos disponibles</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Primaria</h3>
              <p className="text-2xl font-extrabold text-[var(--primary)] mt-1">420+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">reactivos disponibles</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🏫</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Telesecundaria</h3>
              <p className="text-2xl font-extrabold text-[var(--primary)] mt-1">420+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">reactivos disponibles</p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6">
            + 300 reactivos compartidos entre niveles. Banco total: +1,200 preguntas.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white mb-10">
            Todo lo que necesitas para aprobar
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl mb-3">
                ✍️
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Exámenes de práctica</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configura tu examen por dimensión, tipo de pregunta y cantidad. Feedback inmediato con explicaciones.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl mb-3">
                ⏱️
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Modo simulacro</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Practica bajo presión real: cronómetro, sin feedback hasta el final. Igual que el examen real.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl mb-3">
                🃏
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Flashcards</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Memoriza conceptos clave con tarjetas interactivas. Repetición espaciada para retención a largo plazo.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl mb-3">
                📋
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Resúmenes</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ideas clave de cada tema condensadas. Perfecto para repasar antes del examen.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-xl mb-3">
                📊
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Progreso detallado</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Identifica tus áreas débiles. Estadísticas por dimensión y tipo de pregunta.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xl mb-3">
                📚
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Glosario completo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Términos, siglas y conceptos clave organizados por tema. Consulta rápida en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-12 bg-white/50 dark:bg-slate-800/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">+1,200</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">reactivos</p>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">3</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">niveles educativos</p>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">14</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">dimensiones de estudio</p>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">6</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">tipos de reactivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Tu plaza docente comienza aquí
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
          Cada hora de práctica te acerca a tu objetivo.
          No dejes tu admisión al azar.
        </p>
        <Link
          href="/registro"
          className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          Crear cuenta gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
        Estudia USICAMM · Simulador no oficial · Ciclo 2026-2027
      </footer>
    </main>
  );
}
