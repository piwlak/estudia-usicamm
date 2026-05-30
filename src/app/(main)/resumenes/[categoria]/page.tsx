import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NivelId } from "@/types/database";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ categoria: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { categoria } = await params;
  const decoded = decodeURIComponent(categoria);
  return {
    title: `${decoded} — Resúmenes — Estudia USICAMM`,
  };
}

export default async function CategoriaResumenPage({ params }: PageProps) {
  const { categoria } = await params;
  const decoded = decodeURIComponent(categoria);

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

  interface ResumenDetalle {
    id: number;
    titulo: string;
    que_es: string;
    ideas_clave: string[];
    no_es: string | null;
    errores_comunes: string | null;
    orden: number;
  }

  const { data: resumenes } = await supabase
    .from("resumenes")
    .select("id, titulo, que_es, ideas_clave, no_es, errores_comunes, orden")
    .eq("nivel_id", nivelActivo)
    .eq("categoria", decoded)
    .order("orden", { ascending: true }) as { data: ResumenDetalle[] | null };

  if (!resumenes || resumenes.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/resumenes" className="hover:text-[var(--primary)] transition">
          Resúmenes
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-200 font-medium">
          {decoded}
        </span>
      </nav>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{decoded}</h2>

      <div className="space-y-8">
        {resumenes.map((resumen) => (
          <article
            key={resumen.id}
            className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            {/* Title */}
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              {resumen.titulo}
            </h3>

            {/* Que es */}
            <section className="mb-5">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)] mb-2">
                ¿Qué es?
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {resumen.que_es}
              </p>
            </section>

            {/* Ideas clave */}
            {resumen.ideas_clave && resumen.ideas_clave.length > 0 && (
              <section className="mb-5">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)] mb-2">
                  Ideas clave
                </h4>
                <ul className="space-y-1.5">
                  {(resumen.ideas_clave as string[]).map((idea, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                      <span className="leading-relaxed">{idea}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* No es */}
            {resumen.no_es && (
              <section className="mb-5">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-2">
                  Lo que NO es
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                  {resumen.no_es}
                </p>
              </section>
            )}

            {/* Errores comunes */}
            {resumen.errores_comunes && (
              <section>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
                  Errores comunes
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
                  {resumen.errores_comunes}
                </p>
              </section>
            )}
          </article>
        ))}
      </div>

      {/* Back link */}
      <div className="pt-4">
        <Link
          href="/resumenes"
          className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline font-medium"
        >
          ← Volver a resúmenes
        </Link>
      </div>
    </div>
  );
}
