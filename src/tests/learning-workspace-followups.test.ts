import { LearningSessionService } from '../features/learning-workspace/services/LearningSessionService';
import { TopicClassifier } from '../features/learning/TopicClassifier';
import { LearningPlanGenerator } from '../features/learning/LearningPlanGenerator';
import { LearningOrchestrator } from '../features/learning/LearningOrchestrator';
import { EngineCapabilityRegistry } from '../features/learning/EngineCapabilityRegistry';
import { handleKnowledgeQuery } from '../features/knowledge/knowledge-client';

async function main() {
  const topic = `ULW regression ${Date.now()}`;
  const session = await LearningSessionService.ensure(topic, 'algebra_quadratic', 'mathematics');
  if (!session) throw new Error('Session was not created');

  const patched = await LearningSessionService.update(topic, {
    context: {
      previousQuestions: ['Why are the roots x-intercepts?'],
      completedActivities: ['follow_up', 'canvas_stamped', 'practice:quadratic_roots_q1'],
      canvasShapeIds: ['shape:quadratic-card', 'shape:quadratic-graph'],
      followUpAnswers: [{ question: 'Why are the roots x-intercepts?', answer: 'Roots satisfy y = 0.', createdAt: Date.now() }],
    },
    progress: { completedConcepts: 3, quizScore: 100 },
    status: 'completed',
  });

  if (patched?.learningWorkspace?.status !== 'completed') throw new Error('Session status did not persist');
  if (patched.learningWorkspace.context.canvasShapeIds.length !== 2) throw new Error('Canvas shape IDs did not persist');
  if (patched.learningWorkspace.context.followUpAnswers[0]?.answer !== 'Roots satisfy y = 0.') throw new Error('Follow-up answer did not persist');
  if (patched.learningWorkspace.progress.quizScore !== 100) throw new Error('Quiz score did not persist');

  const restored = await LearningSessionService.get(topic);
  if (restored?.learningWorkspace?.context.previousQuestions[0] !== 'Why are the roots x-intercepts?') {
    throw new Error('Session restore lost previous questions');
  }
  if (!(await LearningSessionService.list()).some((item) => item.id === session.id)) throw new Error('Unified session list omitted a saved session');

  if (TopicClassifier.classify('Quadratic equations').engine !== 'math') throw new Error('Quadratic topic did not route to math');
  const quadratic = await LearningOrchestrator.processTopic('Quadratic equations');
  if (quadratic.routeTaken !== 'math_engine' || quadratic.plan.visualizationPlan.rendererType !== 'function_coordinate_plotter') {
    throw new Error('Quadratic orchestration did not produce its graphable math lesson');
  }
  if (TopicClassifier.classify('Binary Search').engine !== 'algorithm') throw new Error('Binary search did not route to algorithm');
  if (TopicClassifier.classify('photosynthesis').engine !== 'knowledge') throw new Error('Photosynthesis did not route to knowledge');
  if (TopicClassifier.classify('F = ma').domain !== 'physics') throw new Error('Newtonian physics topic did not route to physics');
  if (TopicClassifier.classify('chemical bonding').domain !== 'chemistry') throw new Error('Chemistry topic did not route to chemistry');
  if (TopicClassifier.classify('photosynthesis').domain !== 'biology') throw new Error('Biology topic did not route to biology');
  const docCapability = EngineCapabilityRegistry.resolveCapability({
    input: 'Explain this passage', requestId: 'ulw-doc-check', timestamp: Date.now(),
    context: { documentId: 'ulw-document-fixture', subject: 'document_grounded' },
  });
  if (docCapability.capability?.id !== 'cap_document_grounded_learning') throw new Error('Document-grounded learning capability did not resolve');

  const quadraticPlan = LearningPlanGenerator.generatePlan('Quadratic equations');
  if (quadraticPlan.practiceQuestions.length < 3 || !quadraticPlan.practiceQuestions[0]?.question.includes('x-axis')) {
    throw new Error('Quadratic practice generator returned an unrelated question');
  }
  if (!quadraticPlan.workedExamples[0]?.stepByStepSolution.some((step) => step.includes('x-intercepts'))) throw new Error('Quadratic worked example is missing graph connection');

  const offline = await handleKnowledgeQuery('Alan Turing');
  if (offline.attribution.source !== 'VisiOS Offline Knowledge Catalog (editorial summary)' || offline.results[0]?.source !== 'VisiOS Offline Knowledge Catalog') {
    throw new Error('Offline catalog response is misattributed as live Wikipedia content');
  }

  if (!(await LearningSessionService.delete(topic))) throw new Error('Unified session deletion failed');
  if (await LearningSessionService.get(topic)) throw new Error('Deleted unified session is still available');

  console.log('PASS: unified session CRUD, context, persistence, math/physics/CS/chemistry/biology/document routing, quadratic learning activities, and offline attribution');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
