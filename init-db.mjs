import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

const bin = 'C:\\Program Files\\PostgreSQL\\17\\bin';
const dataDir = 'C:\\Users\\user\\Desktop\\coquette31\\.pgdata';
const env = { ...process.env, PGPASSWORD: 'postgres' };

// Create data dir
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

// Initialize database
console.log('=== Initializing database ===');
try {
  const r = execSync(`"${bin}\\initdb.exe" -D "${dataDir}" -U postgres -E UTF8 --locale=C`, { encoding: 'utf8', timeout: 30000, env });
  console.log('Init result:', r.trim());
} catch(e) {
  console.log('Init error:', (e.stderr || e.message)?.slice(0, 500));
}

// Start server
console.log('\n=== Starting server ===');
try {
  const r = execSync(`"${bin}\\pg_ctl.exe" -D "${dataDir}" -l "${dataDir}\\postgres.log" start`, { encoding: 'utf8', timeout: 15000, env });
  console.log('Start result:', r.trim());
} catch(e) {
  console.log('Start error:', (e.stderr || e.message)?.slice(0, 500));
}

// Wait and check
console.log('\n=== Checking server ===');
await new Promise(r => setTimeout(r, 3000));
try {
  const r = execSync(`"${bin}\\pg_isready.exe" -h localhost -p 5432`, { encoding: 'utf8', timeout: 5000, env });
  console.log('Status:', r.trim());
} catch(e) {
  console.log('Not ready:', e.message?.slice(0, 200));
}

// Create database
console.log('\n=== Creating app_db ===');
try {
  const r = execSync(`"${bin}\\createdb.exe" -U postgres -h localhost app_db`, { encoding: 'utf8', timeout: 5000, env });
  console.log('Created:', r.trim());
} catch(e) {
  console.log('Create result:', (e.stderr || e.message)?.slice(0, 300));
}

console.log('\n=== Done ===');
