import { execSync } from 'child_process';

const psql = 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe';
const pgCtl = 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_ctl.exe';
const initdb = 'C:\\Program Files\\PostgreSQL\\17\\bin\\initdb.exe';
const pgIsReady = 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_isready.exe';
const createdb = 'C:\\Program Files\\PostgreSQL\\17\\bin\\createdb.exe';

const env = { ...process.env, PGPASSWORD: 'postgres' };
const dataDir = 'C:\\Program Files\\PostgreSQL\\17\\data';

// Check if data dir exists
import { existsSync, mkdirSync, readdirSync } from 'fs';
console.log('Data dir exists:', existsSync(dataDir));
if (existsSync(dataDir)) {
  try { console.log('Data dir contents:', readdirSync(dataDir).slice(0,10)); } catch(e) {}
}

// Try to check service status
try {
  const r = execSync(`sc query postgresql-x64-17`, { encoding: 'utf8', timeout: 5000 });
  console.log('Service:', r.trim().slice(0, 500));
} catch(e) {
  console.log('Service check:', e.message?.slice(0, 200));
}

// Try to start the server manually
try {
  const r = execSync(`"${pgCtl}" -D "${dataDir}" start -l "${dataDir}\\log.txt" -o "-p 5432"`, { encoding: 'utf8', timeout: 10000, env });
  console.log('Start result:', r.trim());
} catch(e) {
  console.log('Start error:', (e.stderr || e.message)?.slice(0, 300));
}

// Check if ready now
try {
  const r = execSync(`"${pgIsReady}" -h localhost -p 5432`, { encoding: 'utf8', timeout: 5000, env });
  console.log('Server status:', r.trim());
} catch(e) {
  console.log('Server not ready:', e.message?.slice(0, 200));
}

// Create database
try {
  const r = execSync(`"${createdb}" -U postgres -h localhost app_db`, { encoding: 'utf8', timeout: 5000, env });
  console.log('Created DB:', r.trim());
} catch(e) {
  console.log('Create DB:', e.stderr?.slice(0, 300) || e.message?.slice(0, 200));
}
