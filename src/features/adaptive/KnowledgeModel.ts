/**
 * VisiOS — Phase 4: Student Knowledge Model
 * Centralized in-memory and persisted student knowledge profiles.
 * Tracks per-concept mastery levels, recent accuracies, and confirmed misconceptions.
 */

import {
  StudentProfile,
  ConceptMastery,
  StudentInteraction,
} from './AdaptiveLearningContracts';
import { InteractionAnalyzer, RawInteractionPayload } from './InteractionAnalyzer';
import { MasteryEstimator } from './MasteryEstimator';
import { MisconceptionDetector } from './MisconceptionDetector';

export class KnowledgeModel {
  private profiles: Map<string, StudentProfile> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Retrieve or initialize a student profile.
   */
  public getOrCreateProfile(studentId: string, displayName?: string): StudentProfile {
    const existing = this.profiles.get(studentId);
    if (existing) {
      if (displayName && !existing.displayName) {
        existing.displayName = displayName;
      }
      return existing;
    }

    const now = new Date().toISOString();
    const newProfile: StudentProfile = {
      studentId,
      displayName: displayName || `Student ${studentId}`,
      concepts: {},
      interactionHistory: [],
      activeMisconceptions: [],
      createdAt: now,
      updatedAt: now,
    };

    this.profiles.set(studentId, newProfile);
    this.saveToStorage();
    return newProfile;
  }

  /**
   * Record a new interaction, update concept mastery, and check for active misconceptions.
   */
  public recordInteraction(payload: RawInteractionPayload): {
    profile: StudentProfile;
    interaction: StudentInteraction;
    updatedMastery: ConceptMastery;
  } {
    const interaction = InteractionAnalyzer.analyzeInteraction(payload);
    const profile = this.getOrCreateProfile(payload.studentId);

    // Append to interaction history
    profile.interactionHistory.push(interaction);

    // Compute updated mastery for this concept
    const previousMastery = profile.concepts[interaction.conceptId];
    const updatedMastery = MasteryEstimator.estimateMastery(
      interaction.conceptId,
      profile.interactionHistory,
      previousMastery
    );

    profile.concepts[interaction.conceptId] = updatedMastery;

    // Check misconceptions across the student's history for this concept
    const detectedMisconceptions = MisconceptionDetector.analyzeMisconceptions(
      interaction.conceptId,
      profile.interactionHistory
    );

    // Active misconceptions are those with high confidence (>= 0.7)
    const confirmedIds = detectedMisconceptions
      .filter((m) => m.confidence >= 0.7)
      .map((m) => m.misconceptionId);

    profile.activeMisconceptions = Array.from(
      new Set([...profile.activeMisconceptions, ...confirmedIds])
    );

    profile.updatedAt = new Date().toISOString();
    this.saveToStorage();

    return { profile, interaction, updatedMastery };
  }

  /**
   * Get specific concept mastery for a student.
   */
  public getConceptMastery(studentId: string, conceptId: string): ConceptMastery {
    const profile = this.getOrCreateProfile(studentId);
    return (
      profile.concepts[conceptId] || {
        conceptId,
        masteryLevel: 'not_started',
        totalAttempts: 0,
        correctAttempts: 0,
        recentAccuracy: 0,
        consecutiveCorrect: 0,
        confidenceScore: 0.0,
        updatedAt: new Date().toISOString(),
        identifiedMisconceptions: [],
      }
    );
  }

  /**
   * Reset or clear student profile (useful for testing or student reset).
   */
  public clearProfile(studentId: string): void {
    this.profiles.delete(studentId);
    this.saveToStorage();
  }

  /**
   * Load from local persistence if available.
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('visios_student_knowledge_model');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const p of parsed) {
              if (p.studentId) this.profiles.set(p.studentId, p);
            }
          }
        }
      } catch {
        // Fallback silently if storage unavailable
      }
    }
  }

  /**
   * Save to local persistence if available.
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const arrayData = Array.from(this.profiles.values());
        window.localStorage.setItem(
          'visios_student_knowledge_model',
          JSON.stringify(arrayData)
        );
      } catch {
        // Fallback silently
      }
    }
  }
}

export const defaultKnowledgeModel = new KnowledgeModel();

