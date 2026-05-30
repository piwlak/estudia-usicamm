import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Panel de Administración
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/preguntas"
          className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Preguntas
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestionar banco de reactivos
          </p>
        </Link>

        <Link
          href="/admin/usuarios"
          className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Usuarios
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestionar cuentas y accesos
          </p>
        </Link>

        <Link
          href="/admin/reportes"
          className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Reportes
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Revisar reportes de preguntas
          </p>
        </Link>

        <Link
          href="/admin/analytics"
          className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Analytics
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Estadísticas de uso
          </p>
        </Link>
      </div>
    </div>
  );
}
