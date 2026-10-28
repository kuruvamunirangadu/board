import { 
  LearningGoal, 
  LearningPath, 
  LearnerConceptState, 
  Concept 
} from '@/types/learning-path';

const PATH_STORAGE_PREFIX = 'visios_path_v1_';
const GOAL_STORAGE_PREFIX = 'visios_goal_v1_';
const STATES_STORAGE_PREFIX = 'visios_states_v1_';
const CONCEPTS_STORAGE_PREFIX = 'visios_concepts_v1_';
const ACTIVE_PATH_ID_KEY = 'visios_active_path_id_v1';

export class LearningPathPersistence {
  async saveLearningPath(path: LearningPath): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${PATH_STORAGE_PREFIX}${path.id}`, JSON.stringify(path));
      localStorage.setItem(ACTIVE_PATH_ID_KEY, path.id);
    } catch (e) {
      console.error('Failed to save learning path', e);
    }
  }

  async getLearningPath(pathId: string): Promise<LearningPath | null> {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${PATH_STORAGE_PREFIX}${pathId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async getActivePathId(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_PATH_ID_KEY);
  }

  async saveGoal(goal: LearningGoal): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${GOAL_STORAGE_PREFIX}${goal.id}`, JSON.stringify(goal));
    } catch (e) {
      console.error('Failed to save goal', e);
    }
  }

  async getGoal(goalId: string): Promise<LearningGoal | null> {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${GOAL_STORAGE_PREFIX}${goalId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async saveLearnerStates(pathId: string, states: Record<string, LearnerConceptState>): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STATES_STORAGE_PREFIX}${pathId}`, JSON.stringify(states));
    } catch (e) {
      console.error('Failed to save learner states', e);
    }
  }

  async getLearnerStates(pathId: string): Promise<Record<string, LearnerConceptState>> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(`${STATES_STORAGE_PREFIX}${pathId}`);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  async saveConcepts(concepts: Concept[]): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      for (const c of concepts) {
        localStorage.setItem(`${CONCEPTS_STORAGE_PREFIX}${c.id}`, JSON.stringify(c));
      }
    } catch (e) {
      console.error('Failed to save concepts', e);
    }
  }

  async getConcept(conceptId: string): Promise<Concept | null> {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${CONCEPTS_STORAGE_PREFIX}${conceptId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
}

export const learningPathPersistence = new LearningPathPersistence();

