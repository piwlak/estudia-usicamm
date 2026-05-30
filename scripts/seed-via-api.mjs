import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = join(__dirname, '..');

const envContent = readFileSync(join(projectDir, '.env.local'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedPreguntas(nivelId, filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const preguntas = JSON.parse(raw);
  console.log(`  Preguntas: ${preguntas.length} encontradas`);

  const rows = preguntas.map((p) => ({
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

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from('preguntas').insert(batch);
    if (error) {
      console.error(`  ✗ Batch ${i}: ${error.message}`);
    } else {
      console.log(`  ✓ Batch ${i}-${i + batch.length} OK`);
    }
  }
}

async function seedGlosario(nivelId, filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const glosario = JSON.parse(raw);
  const rows = [];
  let orden = 0;

  if (typeof glosario === 'object' && !Array.isArray(glosario)) {
    for (const [seccion, entries] of Object.entries(glosario)) {
      for (const entry of entries) {
        rows.push({
          nivel_id: nivelId,
          seccion,
          sigla: entry.sigla || entry.termino,
          termino: entry.termino,
          definicion: entry.definicion,
          orden: orden++,
        });
      }
    }
  } else if (Array.isArray(glosario)) {
    for (const entry of glosario) {
      rows.push({
        nivel_id: nivelId,
        seccion: entry.seccion || 'General',
        sigla: entry.sigla || entry.termino,
        termino: entry.termino,
        definicion: entry.definicion,
        orden: orden++,
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('glosario').insert(rows);
    if (error) {
      console.error(`  ✗ Glosario: ${error.message}`);
    } else {
      console.log(`  ✓ Glosario: ${rows.length} entradas`);
    }
  }
}

async function seedResumenes(nivelId, filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const resumenes = JSON.parse(raw);
  const rows = [];
  let orden = 0;

  if (typeof resumenes === 'object' && !Array.isArray(resumenes)) {
    for (const [categoria, data] of Object.entries(resumenes)) {
      rows.push({
        nivel_id: nivelId,
        categoria,
        titulo: data.titulo || categoria,
        que_es: data.que_es || '',
        ideas_clave: data.ideas_clave || [],
        no_es: data.no_es || null,
        errores_comunes: data.errores_comunes || null,
        orden: orden++,
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('resumenes').insert(rows);
    if (error) {
      console.error(`  ✗ Resúmenes: ${error.message}`);
    } else {
      console.log(`  ✓ Resúmenes: ${rows.length} entradas`);
    }
  }
}

async function main() {
  console.log('=== Seed Estudia USICAMM v2 (via REST API) ===\n');

  // Check if already seeded
  const { count } = await supabase.from('preguntas').select('*', { count: 'exact', head: true });
  if (count > 0) {
    console.log(`⚠ Ya hay ${count} preguntas en la DB. ¿Duplicar? Saltando...`);
    return;
  }

  const seedDir = join(projectDir, 'src', 'seed', 'inicial-preescolar');

  console.log('--- Seeding nivel: inicial-preescolar ---');
  await seedPreguntas('inicial-preescolar', join(seedDir, 'preguntas.json'));
  await seedGlosario('inicial-preescolar', join(seedDir, 'glosario.json'));
  await seedResumenes('inicial-preescolar', join(seedDir, 'resumenes.json'));

  // Verify
  const { count: finalCount } = await supabase.from('preguntas').select('*', { count: 'exact', head: true });
  console.log(`\n=== Seed completado. Total preguntas en DB: ${finalCount} ===`);
}

main().catch(console.error);
