#!/usr/bin/env python3
"""Lightweight section visual-QA planner and diagnosis engine."""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

RISK_WEIGHTS={"absolute":1,"mask":2,"image_composition":2,"overlap":2,"typography":1,"responsive_delta":2,"slider":2,"interaction":1,"mixed_media":1,"unusual_crop":2,"responsive_ambiguity":2}

def infer_risk_signals(observation):
    """Turn cheap Figma/repo observations into QA hints; this is not a quality score."""
    signals=[]
    rules=(
      (observation.get("absoluteCount",0)>=3,"absolute"),
      (observation.get("maskCount",0)>0,"mask"),
      (observation.get("imageCount",0)>=2 or observation.get("imageComposition",False),"image_composition"),
      (observation.get("overlapCount",0)>0,"overlap"),
      (observation.get("specialTypography",False),"typography"),
      (observation.get("responsiveDelta",False),"responsive_delta"),
      (observation.get("slider",False),"slider"),
      (observation.get("interaction",False),"interaction"),
      (observation.get("mixedMedia",False),"mixed_media"),
      (observation.get("unusualCrop",False),"unusual_crop"),
      (observation.get("responsiveAmbiguity",False),"responsive_ambiguity"),
    )
    return [name for enabled,name in rules if enabled]

def risk(section):
    signals=sorted(set(section.get("riskSignals",[])+infer_risk_signals(section.get("observation",{}))))
    score=sum(RISK_WEIGHTS.get(x,0) for x in signals)
    return {"score":score,"depth":"DEEP" if score>=7 else "STANDARD" if score>=3 else "QUICK","signals":signals}

def diagnose(ref,actual):
    keys=("x","y","width","height")
    delta={k:round(actual[k]-ref[k],2) if k in ref and k in actual else None for k in keys}; tags=[]
    if delta["x"] not in (None,0): tags.append("position-x")
    if delta["y"] not in (None,0): tags.append("position-y")
    if delta["width"] not in (None,0): tags.append("width")
    if delta["height"] not in (None,0): tags.append("section-boundary")
    for k in ("fontSize","lineHeight"):
        if k in ref and k in actual and ref[k]!=actual[k]: tags.append("typography")
    for k,tag in (("color","color"),("text","text"),("background","background"),("imageBounds","image-bounds"),("crop","image-crop")):
        if k in ref and k in actual and ref[k]!=actual[k]: tags.append(tag)
    missing=sorted(k for k in keys if k not in ref or k not in actual)
    return {"delta":delta,"categories":sorted(set(tags)),"missingGeometry":missing}

def cumulative(sections,noise_px=2,material_px=8):
    """Classify page-boundary drift without mistaking one tall section for accumulation."""
    out=[]; deltas=[]
    for i,s in enumerate(sections):
        d=round(s["actual"]["bottom"]-s["reference"]["bottom"],2)
        step=round(d-(deltas[-1] if deltas else 0),2)
        deltas.append(d); out.append({"id":s["id"],"boundaryDelta":d,"stepDelta":step})
    if not out:
        return {"sections":[],"kind":"none","cumulativeDriftLikely":False,"culpritSection":None}
    if max(deltas)-min(deltas)<=noise_px:
        kind="stable-offset" if any(abs(x)>noise_px for x in deltas) else "none"
        return {"sections":out,"kind":kind,"cumulativeDriftLikely":False,"culpritSection":None}
    increments=[deltas[i]-deltas[i-1] for i in range(1,len(deltas))]
    material=[(i+1,x) for i,x in enumerate(increments) if abs(x)>noise_px]
    if len(material)==1 and abs(material[0][1])>=material_px:
        culprit=out[material[0][0]]["id"]
        return {"sections":out,"kind":"local-boundary-jump","cumulativeDriftLikely":False,"culpritSection":culprit}
    signs=[1 if x>0 else -1 for _,x in material]
    same_direction=len(material)>=2 and (all(x==1 for x in signs) or all(x==-1 for x in signs))
    grows=abs(deltas[-1]-deltas[0])>=material_px
    likely=len(out)>=3 and same_direction and grows
    return {"sections":out,"kind":"cumulative" if likely else "mixed","cumulativeDriftLikely":likely,"culpritSection":None}

def route_detail(diags,drift,viewport=None):
    xs=[d["delta"]["x"] for d in diags if d["delta"].get("x") not in (None,0)]
    if drift.get("kind")=="local-boundary-jump":
        return {"scope":"section","cause":"local-section-height","candidate":drift.get("culpritSection"),"confidence":"high"}
    if drift.get("cumulativeDriftLikely"):
        return {"scope":"shared-layout","cause":"cumulative-spacing-or-height","candidate":None,"confidence":"high"}
    if len(xs)>=2 and max(xs)-min(xs)<=2:
        return {"scope":"shared-layout","cause":"shared-container-horizontal-offset","candidate":None,"confidence":"high"}
    cats={c for d in diags for c in d["categories"]}
    if cats=={"typography"}:
        return {"scope":"shared-typography","cause":"font-loading-or-root-token","candidate":None,"confidence":"medium"}
    if viewport in ("desktop","mobile"):
        return {"scope":"viewport-rule","cause":f"{viewport}-specific-rule","candidate":None,"confidence":"medium"}
    return {"scope":"section","cause":"local-visual-difference","candidate":None,"confidence":"low"}

def route(diags,drift,viewport=None):
    d=route_detail(diags,drift,viewport)
    messages={
      "local-section-height":f"inspect section {d.get('candidate')} height/spacing before touching later sections",
      "cumulative-spacing-or-height":"inspect cumulative spacing / section heights before local pixel repair",
      "shared-container-horizontal-offset":"inspect shared container/common horizontal rule",
      "font-loading-or-root-token":"inspect root typography/font loading/token",
      "desktop-specific-rule":"inspect desktop-only rule, then affected section",
      "mobile-specific-rule":"inspect mobile-only rule, then affected section",
      "local-visual-difference":"repair affected section locally; escalate to shared rule only if repeated",
    }
    return messages[d["cause"]]

def cache_key(contract,source):
    return hashlib.sha256(json.dumps({"contract":contract,"source":source},sort_keys=True,separators=(",",":")).encode()).hexdigest()

def observation_action(current_key,previous_key=None):
    return "REUSE" if previous_key and current_key==previous_key else "REOBSERVE"

def repair_stop(history,min_improvement=0.005):
    if len(history)<3:return {"stop":False,"reason":None}
    gains=[history[i-1]-history[i] for i in range(1,len(history))]
    stop=gains[-1]<min_improvement and gains[-2]<min_improvement
    return {"stop":stop,"reason":"two low-improvement repairs; re-diagnose asset/shared rule/typography/Figma interpretation" if stop else None}

def run(contract,measurements):
    mode=contract.get("mode","FAST").upper(); by_id={x["id"]:x for x in measurements.get("sections",[])}; reports=[]; paired=[]
    for s in contract.get("sections",[]):
        m=by_id.get(s["id"],{}); ref=m.get("reference") or s.get("reference",{}); actual=m.get("actual",{})
        reports.append({"id":s["id"],"figmaNodeId":s.get("figmaNodeId"),"selector":s.get("selector"),"risk":risk(s),"diagnosis":diagnose(ref,actual)})
        if "bottom" in ref and "bottom" in actual: paired.append({"id":s["id"],"reference":ref,"actual":actual})
    drift=cumulative(paired) if paired else cumulative([])
    detail=route_detail([x["diagnosis"] for x in reports],drift,contract.get("viewportKind"))
    key=cache_key(contract,measurements.get("sourceFingerprint",contract.get("sourceFingerprint",{})))
    return {"mode":mode,"captureScope":"section" if mode=="FAST" else "checkpoint" if mode=="CHECKPOINT" else "full-page","sections":reports,"drift":drift,"repairRoute":route([x["diagnosis"] for x in reports],drift,contract.get("viewportKind")),"repairRouteDetail":detail,"repairStop":repair_stop(measurements.get("repairScores",[])),"evidenceKey":key,"observationAction":observation_action(key,measurements.get("previousEvidenceKey"))}

def main():
    p=argparse.ArgumentParser(); p.add_argument("contract"); p.add_argument("measurements"); p.add_argument("--out"); a=p.parse_args()
    result=run(json.loads(Path(a.contract).read_text()),json.loads(Path(a.measurements).read_text())); text=json.dumps(result,ensure_ascii=False,indent=2)
    Path(a.out).write_text(text+"\n") if a.out else print(text)
if __name__=="__main__": main()
