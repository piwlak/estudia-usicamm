import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import type { NivelId, Rol } from "@/types/database";

interface Perfil {
  nombre: string | null;
  nivel_activo: NivelId;
  niveles_acceso: NivelId[];
  rol: Rol;
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, nivel_activo, niveles_acceso, rol")
    .eq("id", user.id)
    .single() as { data: Perfil | null };

  return (
    <div className="min-h-screen flex flex-col">
      <Header perfil={perfil} />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
        Estudia USICAMM · v2026.06 · Simulador no oficial
      </footer>
    </div>
  );
}
