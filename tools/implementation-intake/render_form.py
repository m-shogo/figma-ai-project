#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

import intake

OWNERSHIP = ["fixed", "repeater", "post-type", "relationship", "flexible-content", "undetermined"]


def render(profile: dict, questions: list[dict]) -> str:
    profile_json = json.dumps(profile, ensure_ascii=False).replace("</", "<\\/")
    questions_json = json.dumps(questions, ensure_ascii=False).replace("</", "<\\/")
    ownership_json = json.dumps(OWNERSHIP)
    title = html.escape(profile.get("project", {}).get("name", "Implementation Intake"))
    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} — Implementation Intake</title>
<style>
:root {{ color-scheme: light dark; font-family: system-ui,sans-serif; }}
body {{ max-width: 980px; margin:0 auto; padding:24px; line-height:1.5; }}
.card {{ border:1px solid color-mix(in srgb,currentColor 24%,transparent); border-radius:12px; padding:16px; margin:14px 0; }}
.card[data-severity="blocking"] {{ border-width:2px; }}
.grid {{ display:grid; gap:10px; }} .options {{ display:grid; gap:8px; margin:12px 0; }}
label {{ display:flex; gap:8px; align-items:flex-start; }}
textarea,select,input[type=text] {{ width:100%; box-sizing:border-box; padding:8px; }} textarea {{ min-height:64px; }}
.controls {{ position:sticky; bottom:0; background:Canvas; padding:12px 0; display:flex; flex-wrap:wrap; gap:8px; }}
button {{ padding:9px 13px; cursor:pointer; }}
.badge {{ display:inline-block; padding:2px 7px; border:1px solid currentColor; border-radius:999px; font-size:.75rem; margin-right:6px; }}
.meta {{ font-size:.85rem; opacity:.78; }} .resolved {{ opacity:.9; }} .low {{ border-style:dashed; }}
code,#summary {{ font-family:ui-monospace,monospace; }} #summary {{ white-space:pre-wrap; }}
</style></head><body>
<header><h1>{title}</h1><p>AIが先に観測し、人は未決定・低confidence・変更したい判断だけ確認します。最初の回答は固定契約ではなく、途中変更を許容します。</p></header>
<h2>要確認</h2><div id="questions"></div>
<h2>現在の判断</h2><div id="resolved"></div>
<h2>CMS Collection Ownership</h2><div id="collections"></div>
<div class="controls"><button id="download">implementation-profile.json を保存</button><button id="refresh">再評価</button></div>
<pre id="summary"></pre>
<script>
const catalog={questions_json}; const ownership={ownership_json}; const profile={profile_json};
profile.answers ||= {{}}; profile.collections ||= []; profile.overrideLedger ||= [];
function valueOf(id){{return profile.answers[id]?.value;}}
function unresolved(v){{return v==null||v===''||v==='undetermined'||(Array.isArray(v)&&v.length===0);}}
function active(q){{if(!q.when)return true;return Object.entries(q.when).every(([dep,allowed])=>{{const v=valueOf(dep);return Array.isArray(v)?v.some(x=>allowed.includes(x)):allowed.includes(v);}});}}
function answerMeta(a){{return `${{a?.source||'unknown'}} / confidence ${{Math.round((a?.confidence||0)*100)}}% / state ${{a?.state||'legacy'}}`;}}
function setHuman(id,value){{const prev=profile.answers[id];if(prev&&!unresolved(prev.value)&&JSON.stringify(prev.value)!==JSON.stringify(value))profile.overrideLedger.push({{at:new Date().toISOString(),question:id,from:prev.value,to:value,reason:'Human intake override',actor:'owner'}});profile.answers[id]={{value,source:'human',confidence:1,evidence:'Human intake selection',decidedBy:'owner',state:'confirmed',updatedAt:new Date().toISOString()}};renderAll();}}
function renderInput(q,host,current){{if(q.type==='single'){{for(const option of q.options||[]){{const l=document.createElement('label'),i=document.createElement('input');i.type='radio';i.name=q.id;i.value=option;i.checked=current===option;i.onchange=()=>setHuman(q.id,option);l.append(i,document.createTextNode(option));host.append(l);}}}}else if(q.type==='multi'){{for(const option of q.options||[]){{const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.value=option;i.checked=Array.isArray(current)&&current.includes(option);i.onchange=()=>setHuman(q.id,[...host.querySelectorAll('input:checked')].map(x=>x.value));l.append(i,document.createTextNode(option));host.append(l);}}}}else{{const t=document.createElement('textarea');t.placeholder='1行につき1項目';t.value=Array.isArray(current)?current.join('\n'):'';t.onchange=()=>setHuman(q.id,t.value.split('\n').map(x=>x.trim()).filter(Boolean));host.append(t);}}}}
function questionCard(q,resolved=false){{const a=profile.answers[q.id],v=valueOf(q.id),box=document.createElement('section');box.className='card'+((a?.confidence||1)<.8?' low':'');box.dataset.severity=q.severity;box.innerHTML=`<div><span class="badge">${{q.severity.toUpperCase()}}</span><code>${{q.id}}</code></div><h3>${{q.prompt}}</h3><p>${{q.why}}</p>`;if(a){{const m=document.createElement('div');m.className='meta';m.textContent=answerMeta(a)+(a.evidence?` — ${{a.evidence}}`:'');box.append(m);}}const options=document.createElement('div');options.className='options';renderInput(q,options,v);box.append(options);return box;}}
function renderQuestions(){{const root=document.getElementById('questions');root.innerHTML='';let b=0,r=0,l=0;for(const q of catalog.filter(active)){{const a=profile.answers[q.id];const needs=unresolved(valueOf(q.id))||((a?.source==='figma-observation'||a?.source==='repo-observation')&&(a?.confidence||0)<.8)||a?.state==='provisional';if(!needs)continue;if(q.severity==='blocking')b++;else if(q.severity==='review')r++;if((a?.confidence||1)<.8)l++;root.append(questionCard(q));}}return {{b,r,l}};}}
function renderResolved(){{const root=document.getElementById('resolved');root.innerHTML='';for(const q of catalog.filter(active)){{const a=profile.answers[q.id];if(!a||unresolved(a.value))continue;const needs=((a.source==='figma-observation'||a.source==='repo-observation')&&(a.confidence||0)<.8)||a.state==='provisional';if(needs)continue;const box=questionCard(q,true);box.classList.add('resolved');root.append(box);}}}}
function renderCollections(){{const root=document.getElementById('collections');root.innerHTML='';for(const c of profile.collections){{const box=document.createElement('section');box.className='card';box.innerHTML=`<strong>${{c.id}}</strong><div class="meta">Figma count: ${{c.figmaCount??'unknown'}} / fields: ${{(c.editableFields||[]).join(', ')||'none'}}</div>`;const s=document.createElement('select');for(const o of ownership){{const op=document.createElement('option');op.value=o;op.textContent=o;op.selected=(c.cmsOwnership||'undetermined')===o;s.append(op);}}s.onchange=()=>{{const prev=c.cmsOwnership||'undetermined';if(prev!==s.value)profile.overrideLedger.push({{at:new Date().toISOString(),question:`collection:${{c.id}}`,from:prev,to:s.value,reason:'Human CMS ownership selection',actor:'owner'}});c.cmsOwnership=s.value;c.evidence='Human intake collection ownership';renderAll();}};box.append(s);root.append(box);}}}}
function renderAll(){{const x=renderQuestions();renderResolved();renderCollections();const unresolvedCollections=profile.collections.filter(x=>(x.cmsOwnership||'undetermined')==='undetermined').length;document.getElementById('summary').textContent=`blocking/review needing attention: ${{x.b}}/${{x.r}}\nlow-confidence observations: ${{x.l}}\nunresolved collection ownership: ${{unresolvedCollections}}\nhuman overrides: ${{profile.overrideLedger.length}}`;}}
function download(){{const blob=new Blob([JSON.stringify(profile,null,2)+'\n'],{{type:'application/json'}}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='implementation-profile.json';a.click();URL.revokeObjectURL(url);}}
document.getElementById('download').onclick=download;document.getElementById('refresh').onclick=renderAll;renderAll();
</script></body></html>"""


def main() -> int:
    parser=argparse.ArgumentParser(description="Render adaptive implementation intake/review form")
    parser.add_argument("profile"); parser.add_argument("--output",required=True); args=parser.parse_args()
    profile=intake.load_json(Path(args.profile)); errors=intake.validate_profile(profile)
    if errors: raise SystemExit("Invalid profile: "+"; ".join(errors))
    output=Path(args.output); output.parent.mkdir(parents=True,exist_ok=True); output.write_text(render(profile,intake.catalog()),encoding="utf-8")
    print(f"PASS rendered implementation intake form: {output}")
    return 0

if __name__=="__main__": raise SystemExit(main())
