import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
const bin = 'C:\\Program Files\\PostgreSQL\\17\\bin';
const dataDir = 'C:\\Users\\user\\Desktop\\coquette31\\.pgdata';
if (!existsSync(dataDir)) mkdirSync(dataDir, {recursive:true});
console.log('Init...');
try { console.log(execSync(`"${bin}\\initdb.exe" -D "${dataDir}" -U postgres -E UTF8 --locale=C`, {encoding:'utf8',timeout:30000})); } catch(e) { console.log('init err:', e.stderr?.slice(0,300)); }
console.log('Start...');
try { console.log(execSync(`"${bin}\\pg_ctl.exe" -D "${dataDir}" -l "${dataDir}\\pg.log" start`, {encoding:'utf8',timeout:15000})); } catch(e) { console.log('start err:', e.stderr?.slice(0,300)); }
await new Promise(r=>setTimeout(r,3000));
console.log('Ready check...');
try { console.log(execSync(`"${bin}\\pg_isready.exe" -h localhost -p 5432`, {encoding:'utf8',timeout:5000})); } catch(e) { console.log('not ready'); }
const env = {...process.env, PGPASSWORD:'postgres'};
console.log('Create DB...');
try { console.log(execSync(`"${bin}\\createdb.exe" -U postgres -h localhost app_db`, {encoding:'utf8',timeout:5000, env})); } catch(e) { console.log('create:', e.stderr?.slice(0,200)); }
console.log('DONE');
