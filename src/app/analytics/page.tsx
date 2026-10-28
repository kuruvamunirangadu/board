'use client';

import React, { useState, useEffect } from 'react';
import {
  LearningAnalyticsSnapshot,
  InstructorClassAnalytics,
  QuestionPerformance,
  RetakePolicy,
} from '@/types/analytics';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { MetricKPICards } from '@/components/analytics/MetricKPICards';
import { ConceptPerformanceTable } from '@/components/analytics/ConceptPerformanceTable';
import { ExplainableRecommendationsPanel } from '@/components/analytics/ExplainableRecommendationsPanel';
import { QuestionItemAnalysisPanel } from '@/components/analytics/QuestionItemAnalysisPanel';
import { InstructorCohortPanel } from '@/components/analytics/InstructorCohortPanel';
import { RecentAssessmentAttemptsFeed } from '@/components/analytics/RecentAssessmentAttemptsFeed';
import { Navigation } from '@/components/shell/Navigation';
import { ShieldAlert, AlertCircle, Info } from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [learnerId, setLearnerId] = useState('learner-kai');
  const [retakePolicy, setRetakePolicy] = useState<RetakePolicy>('all_attempts');
  const [snapshot, setSnapshot] = useState<LearningAnalyticsSnapshot | null>(null);
  const [instructorData, setInstructorData] = useState<InstructorClassAnalytics | null>(null);
  const [questions, setQuestions] = useState<QuestionPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (role === 'student') {
        const [snapRes, qRes] = await Promise.all([
          fetch(`/api/analytics?action=student_snapshot&learnerId=${learnerId}&retakePolicy=${retakePolicy}`),
          fetch('/api/analytics?action=question_analysis'),
        ]);

        const snapData = await snapRes.json();
        const qData = await qRes.json();

        if (snapData.success) {
          setSnapshot(snapData.snapshot);
        }
        if (qData.success) {
          setQuestions(qData.questionPerformances);
        }
      } else {
        const [instRes, qRes] = await Promise.all([
          fetch(`/api/analytics?action=instructor_analytics&role=instructor&retakePolicy=${retakePolicy}`),
          fetch('/api/analytics?action=question_analysis'),
        ]);

        const instData = await instRes.json();
        const qData = await qRes.json();

        if (instData.success) {
          setInstructorData(instData.instructorData);
        } else {
          setError(instData.error || 'Failed to load instructor analytics');
        }
        if (qData.success) {
          setQuestions(qData.questionPerformances);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [role, learnerId, retakePolicy]);

  const handleExportReport = async () => {
    try {
      const res = await fetch(
        `/api/analytics?action=export_report&exportRole=${role}&role=${role}&learnerId=${learnerId}&retakePolicy=${retakePolicy}`
      );
      const data = await res.json();
      if (data.success && data.report) {
        const blob = new Blob([JSON.stringify(data.report, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visios-evidence-report-${role}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  return (
    <div className="flex min-h-screen w-screen flex-col bg-slate-950 text-slate-100 antialiased font-sans">
      <Navigation />

      <AnalyticsHeader
        currentRole={role}
        onRoleChange={setRole}
        selectedLearnerId={learnerId}
        onLearnerChange={setLearnerId}
        retakePolicy={retakePolicy}
        onPolicyChange={setRetakePolicy}
        onRefresh={fetchAnalytics}
        onExport={handleExportReport}
        isLoading={isLoading}
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {role === 'student' && snapshot && (
          <>
            {/* KPI Cards */}
            <MetricKPICards
              overallAccuracyFormatted={snapshot.overallAccuracyFormatted}
              totalAttemptsCount={snapshot.totalAttemptsCount}
              coveragePercentage={snapshot.coveragePercentage}
              conceptsAssessedCount={snapshot.conceptsAssessedCount}
              totalConceptsAvailable={snapshot.totalConceptsAvailable}
              completedObjectivesCount={snapshot.completedObjectivesCount}
              savedExperimentsCount={snapshot.savedExperimentsCount}
              retakePolicy={retakePolicy}
            />

            {/* Explainable Recommendations */}
            <ExplainableRecommendationsPanel recommendations={snapshot.recommendations} />

            {/* Concept Breakdown & Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ConceptPerformanceTable performances={snapshot.conceptPerformances} />
              </div>
              <div>
                <RecentAssessmentAttemptsFeed attempts={snapshot.recentAttempts} />
              </div>
            </div>

            {/* Question Level Item Analysis */}
            <QuestionItemAnalysisPanel questions={questions} />
          </>
        )}

        {role === 'instructor' && (
          <>
            <InstructorCohortPanel
              instructorData={instructorData}
              isAuthorized={true}
            />

            <QuestionItemAnalysisPanel questions={questions} />
          </>
        )}

        {/* Limitations & Calculation Integrity Disclosure */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
            <Info className="h-4 w-4 text-cyan-400" />
            VisiOS Learning Analytics Calculation Contract:
          </div>
          <p className="leading-relaxed">
            All metrics reflect strictly documented evaluation rules and verified student assessment records. Concepts with zero attempts show &quot;No assessment data&quot; rather than false 0% penalties. Saved experiments count verifiable persisted simulation states.
          </p>
        </div>
      </main>
    </div>
  );
}

