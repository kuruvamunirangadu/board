import { LearningSession } from '../types/LearningSession';
import { sessionPersistence } from '@/lib/persistence/session-persistence';

const emptyState = (topic: string): NonNullable<LearningSession['learningWorkspace']> => ({
  status: 'active',
  context: {
    currentConcept: topic,
    previousQuestions: [],
    completedActivities: [],
    canvasShapeIds: [],
    followUpAnswers: [],
  },
  progress: { completedConcepts: 0, totalConcepts: 8 },
});

export type LearningWorkspacePatch = Omit<Partial<NonNullable<LearningSession['learningWorkspace']>>, 'context' | 'progress'> & {
  context?: Partial<NonNullable<LearningSession['learningWorkspace']>['context']>;
  progress?: Partial<NonNullable<LearningSession['learningWorkspace']>['progress']>;
};

export class LearningSessionService {
  static async list(): Promise<LearningSession[]> {
    return (await sessionPersistence.listSessions())
      .filter((session) => Boolean(session.learningWorkspace)) as LearningSession[];
  }

  static async get(topic: string): Promise<LearningSession | null> {
    return (await sessionPersistence.findSessionByTopic(topic)) as LearningSession | null;
  }

  static async delete(topicOrId: string): Promise<boolean> {
    const session = await this.get(topicOrId) || (await sessionPersistence.getSession(topicOrId)) as LearningSession | null;
    return session ? sessionPersistence.deleteSession(session.id) : false;
  }

  static async update(topic: string, patch: LearningWorkspacePatch): Promise<LearningSession | null> {
    const session = await this.get(topic);
    if (!session) return null;
    const current = session.learningWorkspace || emptyState(topic);
    const next = {
      ...current,
      ...patch,
      context: { ...current.context, ...patch.context },
      progress: { ...current.progress, ...patch.progress },
    };
    return await sessionPersistence.updateSession(session.id, { learningWorkspace: next } as Partial<LearningSession>) as LearningSession | null;
  }

  static async ensure(topic: string, conceptId?: string, subject?: string): Promise<LearningSession | null> {
    const existing = await this.get(topic);
    if (existing) {
      if (!existing.learningWorkspace) return await sessionPersistence.updateSession(existing.id, {
        learningWorkspace: emptyState(topic),
        conceptId: conceptId || existing.conceptId,
        subject: subject || existing.subject,
        title: existing.title || topic,
      } as Partial<LearningSession>) as LearningSession;
      return existing;
    }
    return await sessionPersistence.saveOrUpdateLearningSession({
      id: `session-${topic.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'general'}`,
      title: topic,
      primaryTopic: topic,
      conceptId,
      subject,
      learningWorkspace: emptyState(topic),
    } as Partial<LearningSession> & { primaryTopic: string }) as LearningSession;
  }
}
