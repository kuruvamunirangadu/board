/**
 * VisiOS Milestone 19 — Research Statistical Analyzer
 * Reproducible statistical computation of learning outcomes, normalized gain, effect sizes, and misconception resolution.
 */

import {
  ExperimentEvaluationReport,
  ResearchSessionRecord,
  ExperimentProtocol,
} from '@/types/research';
import { VALIDATED_MISCONCEPTIONS } from '../adaptive/misconception-catalog';

export class ResearchStatisticalAnalyzer {
  /**
   * Run comprehensive reproducible statistical evaluation on collected session records.
   */
  public analyzeExperiment(
    protocol: ExperimentProtocol,
    sessions: ResearchSessionRecord[]
  ): ExperimentEvaluationReport {
    const experimentSessions = sessions.filter((s) => s.experimentId === protocol.experimentId);

    const consentedCount = experimentSessions.length;
    const completedSessions = experimentSessions.filter((s) => s.status === 'completed');
    const adaptiveCompleted = completedSessions.filter((s) => s.condition === 'adaptive_intervention');
    const controlCompleted = completedSessions.filter((s) => s.condition === 'fixed_sequence');

    const dropoutRate =
      consentedCount > 0
        ? Number(((consentedCount - completedSessions.length) / consentedCount).toFixed(3))
        : 0;

    // 1. Calculate Adaptive Outcomes
    const adaptiveStats = this.computeGroupStats(adaptiveCompleted);
    // 2. Calculate Control Outcomes
    const controlStats = this.computeGroupStats(controlCompleted);

    // 3. Compute Cohen's d effect size between Gain Deltas
    const effectSizeCohenD = this.computeCohenD(
      adaptiveStats.gains,
      controlStats.gains,
      adaptiveStats.gainStdDev,
      controlStats.gainStdDev
    );

    const differenceInGain = Number((adaptiveStats.meanGainDelta - controlStats.meanGainDelta).toFixed(2));

    // 4. Engagement & Efficiency
    const adaptiveTimes = adaptiveCompleted.map((s) => s.timeOnTaskSeconds / 60);
    const controlTimes = controlCompleted.map((s) => s.timeOnTaskSeconds / 60);
    const adaptiveHints = adaptiveCompleted.map((s) => s.hintsRequestedCount);
    const controlHints = controlCompleted.map((s) => s.hintsRequestedCount);
    const adaptiveRatings = adaptiveCompleted
      .map((s) => s.subjectiveClarityRating)
      .filter((r): r is number => typeof r === 'number');
    const controlRatings = controlCompleted
      .map((s) => s.subjectiveClarityRating)
      .filter((r): r is number => typeof r === 'number');

    // 5. Misconception Remediation Tracking
    const misconceptionCounts: Record<string, { total: number; resolved: number }> = {};
    completedSessions.forEach((s) => {
      s.evidenceLog.forEach((ev) => {
        if (ev.detectedMisconceptionId) {
          if (!misconceptionCounts[ev.detectedMisconceptionId]) {
            misconceptionCounts[ev.detectedMisconceptionId] = { total: 0, resolved: 0 };
          }
          misconceptionCounts[ev.detectedMisconceptionId].total++;

          // Check if post-test was answered correctly
          if ((s.postTestScore ?? 0) >= 70) {
            misconceptionCounts[ev.detectedMisconceptionId].resolved++;
          }
        }
      });
    });

    const misconceptionsDetected = Object.keys(misconceptionCounts).map((mId) => {
      const def = VALIDATED_MISCONCEPTIONS[mId];
      const stats = misconceptionCounts[mId];
      return {
        misconceptionId: mId,
        name: def ? def.name : mId,
        frequencyCount: stats.total,
        remediationSuccessRate:
          stats.total > 0 ? Number(((stats.resolved / stats.total) * 100).toFixed(1)) : 0,
      };
    });

    // 6. Adaptation Rule Frequencies
    const adaptationRuleFrequencies: Record<string, number> = {};
    completedSessions.forEach((s) => {
      s.adaptationHistory.forEach((rec) => {
        adaptationRuleFrequencies[rec.triggeredRuleId] =
          (adaptationRuleFrequencies[rec.triggeredRuleId] || 0) + 1;
      });
    });

    // 7. Missing Data Breakdown
    const incompletePreTests = experimentSessions.filter((s) => s.preTestScore === null).length;
    const incompletePostTests = experimentSessions.filter((s) => s.postTestScore === null).length;
    const missingFeedback = experimentSessions.filter(
      (s) => !s.subjectiveClarityRating && s.status === 'completed'
    ).length;

    const limitations = [
      consentedCount < protocol.plannedSampleSize
        ? `Current sample size (N=${completedSessions.length}) is below the planned statistical power target (N=${protocol.plannedSampleSize}). Findings must be interpreted as formative pilot trends.`
        : 'Sample size meets initial statistical protocol power requirements.',
      'Evaluation conducted within a single digital session; longitudinal delayed retention testing (> 14 days) is recommended to assess persistent transfer.',
      'Participants were voluntary self-selected testers rather than a randomized stratified student population.',
    ];

    return {
      experimentId: protocol.experimentId,
      generatedAt: Date.now(),
      sampleSize: {
        totalConsented: consentedCount,
        totalCompleted: completedSessions.length,
        adaptiveCompleted: adaptiveCompleted.length,
        fixedCompleted: controlCompleted.length,
        dropoutRate,
      },
      learningOutcomes: {
        adaptive: {
          meanPreScore: adaptiveStats.meanPre,
          meanPostScore: adaptiveStats.meanPost,
          meanGainDelta: adaptiveStats.meanGainDelta,
          meanNormalizedGain: adaptiveStats.meanNormalizedGain,
          preStdDev: adaptiveStats.preStdDev,
          postStdDev: adaptiveStats.postStdDev,
          gainStdDev: adaptiveStats.gainStdDev,
        },
        control: {
          meanPreScore: controlStats.meanPre,
          meanPostScore: controlStats.meanPost,
          meanGainDelta: controlStats.meanGainDelta,
          meanNormalizedGain: controlStats.meanNormalizedGain,
          preStdDev: controlStats.preStdDev,
          postStdDev: controlStats.postStdDev,
          gainStdDev: controlStats.gainStdDev,
        },
        effectSizeCohenD,
        differenceInGain,
      },
      engagementAndEfficiency: {
        adaptiveMeanTimeMinutes: this.mean(adaptiveTimes),
        controlMeanTimeMinutes: this.mean(controlTimes),
        adaptiveMeanHintsUsed: this.mean(adaptiveHints),
        controlMeanHintsUsed: this.mean(controlHints),
        adaptiveMeanClarityRating: this.mean(adaptiveRatings),
        controlMeanClarityRating: this.mean(controlRatings),
      },
      misconceptionsDetected,
      adaptationRuleFrequencies,
      missingDataSummary: {
        incompletePreTests,
        incompletePostTests,
        missingFeedback,
      },
      limitations,
    };
  }

  private computeGroupStats(sessions: ResearchSessionRecord[]) {
    if (sessions.length === 0) {
      return {
        meanPre: 0,
        meanPost: 0,
        meanGainDelta: 0,
        meanNormalizedGain: 0,
        preStdDev: 0,
        postStdDev: 0,
        gainStdDev: 0,
        gains: [],
      };
    }

    const preScores: number[] = [];
    const postScores: number[] = [];
    const gains: number[] = [];
    const normalizedGains: number[] = [];

    sessions.forEach((s) => {
      const pre = s.preTestScore ?? 0;
      const post = s.postTestScore ?? 0;
      const gain = post - pre;

      preScores.push(pre);
      postScores.push(post);
      gains.push(gain);

      // Normalized gain formula: g = (Post - Pre) / (100 - Pre)
      if (pre < 100) {
        const normG = Math.max(-1.0, Math.min(1.0, (post - pre) / (100 - pre)));
        normalizedGains.push(normG);
      } else {
        normalizedGains.push(0);
      }
    });

    const meanPre = this.mean(preScores);
    const meanPost = this.mean(postScores);
    const meanGainDelta = this.mean(gains);
    const meanNormalizedGain = Number(this.mean(normalizedGains).toFixed(3));

    const preStdDev = this.stdDev(preScores, meanPre);
    const postStdDev = this.stdDev(postScores, meanPost);
    const gainStdDev = this.stdDev(gains, meanGainDelta);

    return {
      meanPre,
      meanPost,
      meanGainDelta,
      meanNormalizedGain,
      preStdDev,
      postStdDev,
      gainStdDev,
      gains,
    };
  }

  private computeCohenD(
    groupA: number[],
    groupB: number[],
    sdA: number,
    sdB: number
  ): number {
    const nA = groupA.length;
    const nB = groupB.length;
    if (nA < 2 || nB < 2) return 0.0;

    const meanA = this.mean(groupA);
    const meanB = this.mean(groupB);

    // Pooled standard deviation: sqrt(((nA - 1)*sdA² + (nB - 1)*sdB²) / (nA + nB - 2))
    const numerator = (nA - 1) * Math.pow(sdA, 2) + (nB - 1) * Math.pow(sdB, 2);
    const denominator = nA + nB - 2;
    const pooledSd = Math.sqrt(numerator / Math.max(1, denominator));

    if (pooledSd === 0) return 0.0;
    return Number(((meanA - meanB) / pooledSd).toFixed(2));
  }

  private mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return Number((sum / arr.length).toFixed(2));
  }

  private stdDev(arr: number[], meanVal: number): number {
    if (arr.length < 2) return 0;
    const sumSquares = arr.reduce((acc, val) => acc + Math.pow(val - meanVal, 2), 0);
    return Number(Math.sqrt(sumSquares / (arr.length - 1)).toFixed(2));
  }
}

export const researchStatisticalAnalyzer = new ResearchStatisticalAnalyzer();

