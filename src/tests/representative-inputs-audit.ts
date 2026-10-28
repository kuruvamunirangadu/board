import { TopicClassifier } from '../features/learning/TopicClassifier';
import { LearningOrchestrator } from '../features/learning/LearningOrchestrator';

async function testInputs() {
  const inputs = [
    'data structures',
    'binary search',
    'F = ma',
    'Law of Cosines',
    'simulate a pendulum',
    'photosynthesis',
    'Alan Turing',
    'E',
    'xyz = ?'
  ];

  console.log('--- Auditing 9 Representative Inputs ---');
  for (const q of inputs) {
    const c = TopicClassifier.classify(q);
    const res = await LearningOrchestrator.processTopic(q);
    console.log(`QUERY: "${q}"`);
    console.log(`  Classification: domain=${c.domain}, engine=${c.engine}, requiresClarification=${c.requiresClarification}`);
    console.log(`  Route Taken: ${res.routeTaken}`);
    console.log(`  Plan Title: ${res.plan.title}`);
    console.log(`  Concept ID: ${res.plan.conceptId}`);
    console.log(`  Renderer: ${res.plan.visualizationPlan?.rendererType}`);
    console.log(`  Derivation Steps Count: ${res.plan.derivationSteps?.length}`);
    console.log(`  Is Uncertain: ${res.plan.uncertaintyState?.isUncertain || false}`);
    console.log(`  Source Attribution: ${res.plan.sourceAttribution ? res.plan.sourceAttribution.source : 'none'}`);
    console.log(`  Default Parameters: ${JSON.stringify(res.plan.defaultExperimentState?.parameters || {})}`);
    console.log('----------------------------------------------------');
  }
}

testInputs().catch(console.error);
