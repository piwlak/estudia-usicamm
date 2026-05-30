import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NivelId } from "@/types/database";
import SearchBar from "@/components/glosario/SearchBar";

export const metadata = {
  title: "Glosario — Estudia USICAMM",
  description: "Siglas y términos clave para tu examen USICAMM",
};

export default async function GlosarioPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nivel_activo")
    .eq("id", user!.id)
    .single() as { data: { nivel_activo: NivelId } | null };

  const nivelActivo = perfil?.nivel_activo || "inicial-preescolar";

  const { data: entries } = await supabase
    .from("glosario")
    .select("id, seccion, sigla, termino, definicion, orden")
    .eq("nivel_id", nivelActivo)
    .order("orden", { ascending: true });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Glosario</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Siglas y términos clave de tu nivel
        </p>
      </div>

      <SearchBar entries={entries || []} />
    </div>
  );
}
