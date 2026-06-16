import { readdir, readFile, stat } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
async function walk(dir){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.git')||entry.name==='node_modules'||entry.name==='.idea') continue;
    const p=join(dir,entry.name);
    if(entry.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
async function exists(path){ try{ await stat(path); return true; }catch{return false;} }
const errors=[];
const registry=JSON.parse(await readFile(join(root,'tools-registry.json'),'utf8'));
const seenSlug=new Set(), seenUrl=new Set();
for(const tool of registry){
  if(seenSlug.has(tool.slug)) errors.push(`duplicate registry slug: ${tool.slug}`); seenSlug.add(tool.slug);
  if(seenUrl.has(tool.url)) errors.push(`duplicate registry url: ${tool.url}`); seenUrl.add(tool.url);
  const page=join(root,tool.url.replace(/^\//,'').replace(/\/$/,'/index.html'));
  if(!await exists(page)) errors.push(`registry page missing: ${tool.url}`);
}
const sitemap=await readFile(join(root,'sitemap.xml'),'utf8');
const locs=[...sitemap.matchAll(/<loc>https:\/\/pawstool\.com([^<]+)<\/loc>/g)].map(m=>m[1]);
const locSet=new Set(locs);
for(const tool of registry) if(!locSet.has(tool.url)) errors.push(`registry url absent from sitemap: ${tool.url}`);
const htmlFiles=(await walk(root)).filter(f=>extname(f)==='.html');
for(const file of htmlFiles){
  const html=await readFile(file,'utf8');
  const rel=file.slice(root.length).replace(/index\.html$/,'');
  const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
  for(const src of scripts){
    if(src.startsWith('http')) continue;
    const scriptPath=join(root,src.replace(/^\//,''));
    if(!await exists(scriptPath)) errors.push(`${rel}: missing script ${src}`);
  }
  const links=[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m=>m[1]);
  for(const href of links){
    if(href.startsWith('http')||href.startsWith('mailto:')) continue;
    if(href.endsWith('.css')){
      const cssPath=join(root,href.replace(/^\//,''));
      if(!await exists(cssPath)) errors.push(`${rel}: missing stylesheet ${href}`);
    }
  }
  const internalLinks=[...html.matchAll(/<a[^>]+href="(\/[^"]*)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('/sitemap.xml'));
  for(const href of internalLinks){
    const clean=href.split('#')[0].split('?')[0];
    const target=clean.endsWith('/')?join(root,clean,'index.html'):join(root,clean);
    if(!await exists(target)) errors.push(`${rel}: broken internal link ${href}`);
  }
}
const cats={}; for(const t of registry) cats[t.category]=(cats[t.category]||0)+1;
console.log(JSON.stringify({html:htmlFiles.length,sitemap:locs.length,registry:registry.length,categories:cats},null,2));
if(errors.length){ console.error(errors.slice(0,200).join('\n')); console.error(`Total errors: ${errors.length}`); process.exit(1); }
console.log('Audit passed: registry pages, sitemap entries, assets, and internal links are consistent.');
