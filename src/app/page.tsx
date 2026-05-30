import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-8">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-4xl font-extrabold shadow-lg">
          U
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Estudia USICAMM
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-300">
          Plataforma profesional de estudio para el examen de Admisión Docente
          USICAMM. Practica con reactivos basados en la bibliografía oficial
          2026-2027.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-2xl mb-2">💒</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Inicial y Preescolar</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              520 reactivos
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-2xl mb-2">📖</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Primaria</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Próximamente
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-2xl mb-2">🏫</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Telesecundaria</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Próximamente
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
