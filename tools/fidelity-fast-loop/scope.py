#!/usr/bin/env python3
"""Scope filter and existing-component candidate mapper; intentionally heuristic."""
from pathlib import Path
def allowed(path,scope):
    p=Path(path).as_posix()
    if any(p==x or p.startswith(x.rstrip('/')+'/') for x in scope.get('deny',[])): return False
    allow=scope.get('allow',[]); return not allow or any(p==x or p.startswith(x.rstrip('/')+'/') for x in allow)
def component_candidates(figma,components):
    target=set(x.lower() for x in figma.get('semantics',[])); out=[]
    for c in components:
        semantic=len(target & set(x.lower() for x in c.get('semantics',[]))); visual=sum(1 for k,v in figma.get('visual',{}).items() if c.get('visual',{}).get(k)==v); behavior=sum(1 for k,v in figma.get('behavior',{}).items() if c.get('behavior',{}).get(k)==v); score=semantic*2+visual+behavior
        if score: out.append({**c,'compatibilityScore':score,'decision':'reuse' if score>=4 else 'adapt' if score>=3 else 'new/prefer-local'})
    return sorted(out,key=lambda x:x['compatibilityScore'],reverse=True)
