import { execSync } from 'child_process';
import { existsSync } from 'fs';

const psql = 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe';
const pgIsReady = 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_isready.exe';
const createdb = 'C:\\Program Files\\PostgreSQL\\17\\bin\\createdb.exe';

console.log('psql exists:', existsSync(psql));
console.log('pg_isready exists:', existsSync(pgIsReady));

const env = { ...process.env, PGPASSWORD: 'postgres' };

try {
  const r = execSync(`"${pgIsReady}" -h localhost -p 5432`, { encoding: 'utf8', timeout: 5000, env });
  console.log('Server status:', r.trim());
} catch(e) {
  console.log('Server check error:', e.message?.slice(0, 300));
}

try {
  const r = execSync(`"${psql}" -U postgres -d postgres -c "SELECT 1"`, { encoding: 'utf8', timeout: 5000, env });
  console.log('DB connection:', r.trim());
} catch(e) {
  console.log('DB connection error:', e.stderr?.slice(0, 300) || e.message?.slice(0, 300));
}

try {
  const r = execSync(`"${createdb}" -U postgres app_db`, { encoding: 'utf8', timeout: 5000, env });
  console.log('Created DB:', r.trim());
} catch(e) {
  console.log('Create DB message:', e.stderr?.slice(0, 300) || e.message?.slice(0, 300));
}
