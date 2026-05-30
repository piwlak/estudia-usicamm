import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Rol } from "@/types/database";
import type { TierLimits } from "@/lib/tiers";
import { canAccess } from "@/lib/tiers";
import Link from "next/link";

interface PremiumGateProps {
  feature: keyof TierLimits;
  children: React.ReactNode;
}

export default async function PremiumGate({ feature, children }: PremiumGateProps) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single() as { data: { rol: Rol } | null };

  const rol = perfil?.rol || "usuario";

  if (!canAccess(rol, feature)) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="text-5xl">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Función Premium
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta función está disponible para usuarios premium.
          Mejora tu plan para acceder a todas las herramientas de estudio.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/premium"
            className="px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
          >
            Ver planes
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
