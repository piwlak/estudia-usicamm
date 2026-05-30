import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seedNivel(nivelId: string, dir: string) {
  console.log(`\n--- Seeding nivel: ${nivelId} ---`);

  // Preguntas
  const preguntasPath = join(dir, "preguntas.json");
  try {
    const raw = readFileSync(preguntasPath, "utf-8");
    const preguntas = JSON.parse(raw);
    console.log(`  Preguntas: ${preguntas.length} encontradas`);

    const rows = preguntas.map((p: any) => ({
      nivel_id: nivelId,
      fuente: p.fuente || null,
      categoria: p.categoria,
      subcategoria: p.subcategoria || null,
      dimension: p.dimension,
      tipo: p.tipo,
      caso: p.caso || null,
      pregunta: p.pregunta,
      opciones: p.opciones,
      respuesta: p.respuesta,
      explicacion: p.explicacion || null,
      cita: p.cita || null,
      activo: true,
    }));

    // Insert in batches of 100
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabase.from("preguntas").insert(batch);
      if (error) {
        console.error(`  Error insertando preguntas (batch ${i}):`, error.message);
      } else {
        console.log(`  Preguntas batch ${i}-${i + batch.length}: OK`);
      }
    }
  } catch (e: any) {
    console.log(`  No preguntas.json en ${dir}: ${e.message}`);
  }

  // Glosario
  const glosarioPath = join(dir, "glosario.json");
  try {
    const raw = readFileSync(glosarioPath, "utf-8");
    const glosario = JSON.parse(raw);
    const rows: any[] = [];
    let orden = 0;

    // glosario can be { seccion: [...entries] } or flat array
    if (typeof glosario === "object" && !Array.isArray(glosario)) {
      for (const [seccion, entries] of Object.entries(glosario)) {
        for (const entry of entries as any[]) {
          rows.push({
            nivel_id: nivelId,
            seccion,
            sigla: entry.sigla,
            termino: entry.termino,
            definicion: entry.definicion,
            orden: orden++,
          });
        }
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("glosario").insert(rows);
      if (error) {
        console.error("  Error insertando glosario:", error.message);
      } else {
        console.log(`  Glosario: ${rows.length} entradas OK`);
      }
    }
  } catch (e: any) {
    console.log(`  No glosario.json en ${dir}: ${e.message}`);
  }

  // Resúmenes
  const resumenesPath = join(dir, "resumenes.json");
  try {
    const raw = readFileSync(resumenesPath, "utf-8");
    const resumenes = JSON.parse(raw);
    const rows: any[] = [];
    let orden = 0;

    if (typeof resumenes === "object" && !Array.isArray(resumenes)) {
      for (const [categoria, data] of Object.entries(resumenes)) {
        const d = data as any;
        rows.push({
          nivel_id: nivelId,
          categoria,
          titulo: d.titulo || categoria,
          que_es: d.que_es || "",
          ideas_clave: d.ideas_clave || [],
          no_es: d.no_es || null,
          errores_comunes: d.errores_comunes || null,
          orden: orden++,
        });
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("resumenes").insert(rows);
      if (error) {
        console.error("  Error insertando resúmenes:", error.message);
      } else {
        console.log(`  Resúmenes: ${rows.length} entradas OK`);
      }
    }
  } catch (e: any) {
    console.log(`  No resumenes.json en ${dir}: ${e.message}`);
  }
}

async function main() {
  console.log("=== Seed Estudia USICAMM v2 ===");

  const baseDir = join(__dirname);

  await seedNivel("inicial-preescolar", join(baseDir, "inicial-preescolar"));
  await seedNivel("primaria", join(baseDir, "primaria"));
  await seedNivel("telesecundaria", join(baseDir, "telesecundaria"));

  console.log("\n=== Seed completado ===");
}

main().catch(console.error);
