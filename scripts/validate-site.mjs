import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
async function walk(dir){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.git')||entry.name==='node_modules'||entry.name==='.idea') continue;
    const p=join(dir,entry.name);
    if(entry.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}
const files=(await walk(root)).filter(f=>extname(f)==='.html');
const errors=[];

const jsFiles=(await walk(root)).filter(f=>extname(f)==='.js' || extname(f)==='.mjs');
for(const file of jsFiles){
  const s=await readFile(file,'utf8');
  if(/\$\('\[data-/.test(s)) errors.push(`${file}: global data-selector helper usage; scope selectors to the current tool root`);
}
const titles=new Map(), metas=new Map(), canonicals=new Map();
for(const file of files){
  const s=await readFile(file,'utf8');
  const title=s.match(/<title>([^<]+)<\/title>/)?.[1];
  const meta=s.match(/<meta name="description" content="([^"]+)">/)?.[1];
  const canonical=s.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if(!title) errors.push(`${file}: missing title`);
  if(!meta) errors.push(`${file}: missing meta description`);
  if(!canonical) errors.push(`${file}: missing canonical`);
  for(const [value,map,label] of [[title,titles,'title'],[meta,metas,'meta'],[canonical,canonicals,'canonical']]){
    if(!value) continue;
    if(map.has(value)) errors.push(`${file}: duplicate ${label} with ${map.get(value)}`);
    map.set(value,file);
  }
  if(!s.includes('viewport')) errors.push(`${file}: missing viewport`);
}
const sitemap=await readFile(join(root,'sitemap.xml'),'utf8');
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(new Set(locs).size!==locs.length) errors.push('sitemap.xml has duplicate URLs');
const registry=JSON.parse(await readFile(join(root,'tools-registry.json'),'utf8'));
if(!Array.isArray(registry)) errors.push('tools-registry.json must be an array');
if(registry.length < 1000) errors.push(`tools-registry.json has only ${registry.length} tools; expected at least 1000`);
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`Validated ${files.length} HTML files, ${locs.length} sitemap URLs, and ${registry.length} registered tools.`);
