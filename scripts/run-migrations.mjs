import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = join(__dirname, '..');

// Load env
const envContent = readFileSync(join(projectDir, '.env.local'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

// Use individual connection params to avoid URL-encoding issues with special chars in password
const client = new pg.Client({
  host: env.DB_HOST || 'aws-0-us-west-1.pooler.supabase.com',
  port: parseInt(env.DB_PORT || '6543'),
  database: env.DB_NAME || 'postgres',
  user: env.DB_USER || 'postgres.rzsgnxojibjfhygrbvop',
  password: env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  '00001_create_niveles.sql',
  '00002_create_preguntas.sql',
  '00003_create_glosario.sql',
  '00004_create_resumenes.sql',
  '00005_create_perfiles.sql',
  '00006_create_tracking.sql',
  '00007_create_historial.sql',
  '00008_create_notas.sql',
  '00009_create_reportes.sql',
  '00010_create_playlists.sql',
  '00011_rls_policies.sql',
];

async function main() {
  console.log('=== Running Migrations via Direct Postgres Connection ===');
  console.log(`Host: ${client.host}:${client.port}`);
  console.log(`User: ${client.user}`);
  console.log(`Password: ${env.DB_PASSWORD ? '***set***' : 'MISSING'}`);
  console.log();

  if (!env.DB_PASSWORD) {
    console.error('ERROR: DB_PASSWORD not set in .env.local');
    console.error('Add: DB_PASSWORD=1409L@OS@JMV');
    process.exit(1);
  }

  try {
    await client.connect();
    console.log('✓ Connected to Postgres\n');

    for (const file of migrations) {
      const sql = readFileSync(join(projectDir, 'supabase', 'migrations', file), 'utf-8');
      console.log(`Running: ${file}...`);
      try {
        await client.query(sql);
        console.log(`  ✓ Done`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ⚠ Already exists, skipping`);
        } else {
          console.error(`  ✗ Error: ${err.message}`);
        }
      }
    }

    console.log('\n=== All migrations complete ===');
  } catch (err) {
    console.error(`Connection failed: ${err.message}`);
    console.error('\nTips:');
    console.error('- Check DB_PASSWORD in .env.local');
    console.error('- Try DB_HOST with different regions: aws-0-us-east-1.pooler.supabase.com');
    console.error('- Port 6543 = session mode (needed for DDL), 5432 = transaction mode');
  } finally {
    await client.end();
  }
}

main().catch(console.error);
