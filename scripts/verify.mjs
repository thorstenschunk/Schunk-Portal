import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=['app/layout.tsx','app/page.tsx','app/baustellen/page.tsx','app/zeiterfassung/page.tsx','app/rapporte/page.tsx','app/kalender/page.tsx','app/admin/page.tsx','supabase/001_portal_schema.sql','.env.example'];
let failed=false;
for(const f of required){if(!fs.existsSync(path.join(root,f))){console.error('FEHLT:',f);failed=true}}
const bad=['localStorage','sessionStorage','indexedDB','serviceWorker','caches.open'];
const scan=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.next','.git'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx|js|mjs)$/.test(e.name))scan.push(p)}}walk(root);
for(const file of scan){if(file.endsWith(path.join('scripts','verify.mjs')))continue;const txt=fs.readFileSync(file,'utf8');for(const token of bad){if(txt.includes(token)){console.error('VERBOTENE BROWSER-SPEICHERUNG:',path.relative(root,file),token);failed=true}}}
const sql=fs.readFileSync(path.join(root,'supabase/001_portal_schema.sql'),'utf8');for(const table of ['profiles','construction_sites','files','time_entries','absences','work_reports','assignments','audit_log']){if(!sql.includes(`public.${table}`)){console.error('SQL-TABELLE FEHLT:',table);failed=true}}
if(failed)process.exit(1);console.log('SCHUNK PORTAL Strukturprüfung: OK');
