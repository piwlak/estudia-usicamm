import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NivelId } from "@/types/database";
import ResumenCard from "@/components/resumenes/ResumenCard";

export const metadata = {
  title: "Resúmenes — Estudia USICAMM",
  description: "Resúmenes conceptuales organizados por categoría",
};

export default async function ResumenesPage() {
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

  interface Resumen {
    id: number;
    categoria: string;
    titulo: string;
    que_es: string;
    orden: number;
  }

  const { data: resumenes } = await supabase
    .from("resumenes")
    .select("id, categoria, titulo, que_es, orden")
    .eq("nivel_id", nivelActivo)
    .order("orden", { ascending: true }) as { data: Resumen[] | null };

  // Group by categoria
  const grouped = (resumenes || []).reduce<Record<string, Resumen[]>>(
    (acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = [];
      acc[item.categoria]!.push(item);
      return acc;
    },
    {}
  );

  const categorias = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resúmenes</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Conceptos clave organizados por categoría
        </p>
      </div>

      {categorias.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <p>No hay resúmenes disponibles para tu nivel.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categorias.map((categoria) => (
            <section key={categoria}>
              <h3 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">
                {categoria}
              </h3>
              <div className="space-y-3">
                {grouped[categoria]!.map((resumen) => (
                  <ResumenCard
                    key={resumen.id}
                    id={resumen.id}
                    categoria={resumen.categoria}
                    titulo={resumen.titulo}
                    que_es={resumen.que_es}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
