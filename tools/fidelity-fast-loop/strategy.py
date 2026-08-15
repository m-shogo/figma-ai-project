#!/usr/bin/env python3
"""Tiny QA strategy/learning helpers; record evidence without declaring doctrine."""

def strategy_record(strategy,implementation_seconds,repair_count,section_captures,full_captures,final_score,late_findings,regressions,human_adjustments):
    return locals()

def compare(records):
    """Return transparent per-metric deltas only; intentionally no weighted winner score."""
    if not records: return {"records":[],"baseline":None,"comparisons":[]}
    baseline=records[0]
    metrics=("implementation_seconds","repair_count","section_captures","full_captures","final_score","late_findings","regressions","human_adjustments")
    comparisons=[]
    for record in records[1:]:
        comparisons.append({"strategy":record.get("strategy"),"against":baseline.get("strategy"),"delta":{m:round(record.get(m,0)-baseline.get(m,0),3) for m in metrics}})
    return {"records":records,"baseline":baseline.get("strategy"),"comparisons":comparisons,"note":"interpret tradeoffs from real-project evidence; no universal winner is computed"}

def learning(record):
    return {"strategy":record.get("strategy"),"keep":record.get("usefulQa",[]),"reduce":record.get("unhelpfulQa",[]),"lateDiscoveries":record.get("lateDiscoveries",[]),"reworkSections":record.get("reworkSections",[]),"note":"promote only after repeated real-project evidence"}
