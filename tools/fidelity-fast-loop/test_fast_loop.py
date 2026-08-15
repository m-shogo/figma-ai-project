import unittest
from fast_loop import cumulative,diagnose,infer_risk_signals,observation_action,repair_stop,risk,route_detail,run
from scope import allowed,component_candidates
from strategy import compare,strategy_record

class T(unittest.TestCase):
 def test_risk(self): self.assertEqual(risk({'riskSignals':['mask','image_composition']})['depth'],'STANDARD')
 def test_risk_inference_is_observation_based(self):
  signals=infer_risk_signals({'maskCount':1,'imageCount':2,'responsiveDelta':True})
  self.assertEqual(signals,['mask','image_composition','responsive_delta'])
  result=risk({'observation':{'maskCount':1,'imageCount':2,'responsiveDelta':True}})
  self.assertEqual(result['depth'],'STANDARD'); self.assertIn('mask',result['signals'])
 def test_diagnosis(self): self.assertIn('section-boundary',diagnose({'height':100},{'height':124})['categories'])
 def test_missing_reference_is_not_fake_zero_delta(self): self.assertIsNone(diagnose({}, {'x':110,'width':1160})['delta']['x'])
 def test_true_cumulative_drift(self):
  d=cumulative([{'id':'a','reference':{'bottom':100},'actual':{'bottom':102}},{'id':'b','reference':{'bottom':200},'actual':{'bottom':203}},{'id':'c','reference':{'bottom':300},'actual':{'bottom':312}},{'id':'d','reference':{'bottom':400},'actual':{'bottom':427}}])
  self.assertEqual(d['kind'],'cumulative'); self.assertTrue(d['cumulativeDriftLikely'])
 def test_one_tall_section_is_local_jump_not_cumulative(self):
  d=cumulative([{'id':'reason','reference':{'bottom':100},'actual':{'bottom':100}},{'id':'education','reference':{'bottom':200},'actual':{'bottom':224}},{'id':'voice','reference':{'bottom':300},'actual':{'bottom':324}},{'id':'messages','reference':{'bottom':400},'actual':{'bottom':424}}])
  self.assertEqual(d['kind'],'local-boundary-jump'); self.assertEqual(d['culpritSection'],'education'); self.assertFalse(d['cumulativeDriftLikely'])
  self.assertEqual(route_detail([],d)['candidate'],'education')
 def test_shared_horizontal_offset(self):
  diags=[diagnose({'x':100},{'x':116}),diagnose({'x':300},{'x':316})]
  self.assertEqual(route_detail(diags,cumulative([]))['cause'],'shared-container-horizontal-offset')
 def test_typography_root(self):
  diags=[diagnose({'fontSize':'16px'},{'fontSize':'15px'})]
  self.assertEqual(route_detail(diags,cumulative([]))['scope'],'shared-typography')
 def test_observation_reuse(self): self.assertEqual(observation_action('same','same'),'REUSE')
 def test_stop(self): self.assertTrue(repair_stop([.2,.199,.198])['stop'])
 def test_scope(self): self.assertFalse(allowed('implementation/theme/x.css',{'deny':['implementation/theme']}))
 def test_mapping(self): self.assertEqual(component_candidates({'semantics':['button'],'visual':{'shape':'pill'},'behavior':{'action':'link'}},[{'name':'CTA','semantics':['button'],'visual':{'shape':'pill'},'behavior':{'action':'link'}}])[0]['decision'],'reuse')
 def test_mode(self): self.assertEqual(run({'mode':'FINAL','sections':[]},{})['captureScope'],'full-page')
 def test_contract_reference_fallback(self):
  report=run({'mode':'FAST','sections':[{'id':'reason','figmaNodeId':'21008:371','selector':'#reason','reference':{'x':110,'y':886,'width':1160,'height':559,'bottom':1445}}]}, {'sections':[{'id':'reason','actual':{'x':110,'y':886,'width':1160,'height':583,'bottom':1469}}]})
  self.assertEqual(report['sections'][0]['diagnosis']['delta']['height'],24)
  self.assertIn('section-boundary',report['sections'][0]['diagnosis']['categories'])
 def test_strategy_compare_is_unweighted(self):
  a=strategy_record('section-first',100,3,5,1,94,1,0,2); b=strategy_record('full-first',120,2,0,3,95,2,1,1)
  result=compare([a,b]); self.assertEqual(result['baseline'],'section-first'); self.assertEqual(result['comparisons'][0]['delta']['implementation_seconds'],20); self.assertNotIn('winner',result)

if __name__=='__main__': unittest.main()
