// Read-only lexical inventory. Runtime-generated names and external CMS/DB
// consumers are not represented: zero source matches is not removal permission.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const slug=process.argv[2];
if(!/^[a-z0-9][a-z0-9-]*$/.test(slug??'')) throw Error('usage: node scripts/css-token-inventory.mjs <project>');
const project='projects/'+slug;
const paths=execFileSync('git',['ls-files','-z','--',project],{encoding:'utf8'}).split('\0').filter(Boolean).filter(p=>/\.(css|scss|sass|less|php|js|mjs|cjs|ts|tsx|jsx|vue|svelte|html|json|yaml|yml|svg|md|txt|xml)$/i.test(p));
const source=paths.map(p=>[p,readFileSync(p,'utf8')]);
const tokens=new Set();
for(const [p,c] of source) if(/\/theme\/css\/global\/variables\.css$/.test(p)) for(const m of c.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/(--[\w-]+)\s*:/g))tokens.add(m[1]);
const result=[...tokens].sort().map(token=>{
 const match=new RegExp(token.replace(/[.*+?^$()|[\]\\]/g,'\\$&')+'(?![\\w-])','g');
 const consumers=[],docs=[];
 for(const [p,c] of source){
  const content=/\.css$/.test(p)?c.replace(/\/\*[\s\S]*?\*\//g,''):c;
  const count=[...content.matchAll(match)].filter(m=>!(/\.css$/.test(p)&&/^\s*:/.test(content.slice(m.index+m[0].length)))).length;
  if(count)(/\/docs\/|\.md$/.test(p)?docs:consumers).push({file:p,count});
 }
 return {token,consumers,docs};
});
console.log(JSON.stringify({project,scanned:paths.length,tokenCount:result.length,zeroSourceCandidates:result.filter(x=>!x.consumers.length).map(x=>x.token),tokens:result},null,2));
