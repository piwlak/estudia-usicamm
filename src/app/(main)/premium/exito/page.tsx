import Link from "next/link";

export default function PremiumExitoPage() {
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-6">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        ¡Bienvenido a Premium!
      </h2>
      <p className="text-slate-500 dark:text-slate-400">
        Tu suscripción ha sido activada exitosamente. Ya tienes acceso a todas
        las herramientas de estudio.
      </p>
      <div className="space-y-3 pt-4">
        <Link
          href="/dashboard"
          className="block w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
        >
          Ir al dashboard
        </Link>
        <Link
          href="/examen"
          className="block w-full py-3 px-6 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Hacer un examen simulacro
        </Link>
      </div>
    </div>
  );
}
