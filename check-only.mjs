import { execSync } from 'child_process';
const bin = 'C:\\Program Files\\PostgreSQL\\17\\bin';
const env = { ...process.env, PGPASSWORD: 'postgres' };
try {
  const r = execSync(`"${bin}\\pg_isready.exe" -h localhost -p 5432`, { encoding: 'utf8', timeout: 5000, env });
  console.log('READY:', r.trim());
} catch(e) {
  console.log('NOT READY');
}

try {
  const r = execSync(`"${bin}\\psql.exe" -U postgres -h localhost -c "SELECT 1"`, { encoding: 'utf8', timeout: 5000, env });
  console.log('CONNECTED:', r.trim());
} catch(e) {
  console.log('NOT CONNECTED');
}

try {
  const r = execSync(`"${bin}\\createdb.exe" -U postgres -h localhost app_db`, { encoding: 'utf8', timeout: 5000, env });
  console.log('DB CREATED');
} catch(e) {
  console.log('DB:', e.stderr?.slice(0,200) || 'already exists');
}
