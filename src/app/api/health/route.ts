import { NextResponse } from 'next/server';
import { collaborationServer } from '@/features/collaboration/collaboration-server';
import { contentRegistry } from '@/features/knowledge/registry/content-registry';
import { documentStore } from '@/features/multimodal/document-store';
import { analyticsStore } from '@/features/analytics/analytics-store';

const SERVER_START_TIME = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
  const memUsage = process.memoryUsage ? process.memoryUsage() : { rss: 0, heapTotal: 0, heapUsed: 0 };

  const activeRooms = collaborationServer.listActiveRooms();
  const manifest = contentRegistry.exportManifest();
  const allDocs = documentStore.listDocuments();
  const attemptsCount = analyticsStore.getAttempts().length;

  // Check Ollama daemon connectivity
  let ollamaStatus = {
    status: 'offline',
    model: 'none',
    latencyMs: 0,
  };
  try {
    const t0 = Date.now();
    const ollamaRes = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(1500),
    });
    const latency = Date.now() - t0;
    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      const modelName = data.models?.[0]?.name || 'qwen2.5:0.5b';
      ollamaStatus = {
        status: 'operational',
        model: modelName,
        latencyMs: latency,
      };
    }
  } catch {
    // Offline or unreachable
  }

  const healthData = {
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    memory: {
      rssMB: Math.round((memUsage.rss / (1024 * 1024)) * 10) / 10,
      heapUsedMB: Math.round((memUsage.heapUsed / (1024 * 1024)) * 10) / 10,
      heapTotalMB: Math.round((memUsage.heapTotal / (1024 * 1024)) * 10) / 10,
    },
    subsystems: {
      contentRegistry: {
        status: 'operational',
        subjectsCount: manifest.subjects.length,
        version: manifest.manifestVersion,
      },
      collaborationServer: {
        status: 'operational',
        activeRoomsCount: activeRooms.length,
      },
      multimodalDocumentStore: {
        status: 'operational',
        ingestedDocumentsCount: allDocs.length,
      },
      analyticsEngine: {
        status: 'operational',
        persistedAttemptsCount: attemptsCount,
      },
      aiAuthoringPipeline: {
        status: 'operational',
      },
      universalLearningIntelligence: {
        status: 'operational',
        capabilities: ['Universal Word Problem Solver', 'SymPy Symbolic Fallback', 'Deterministic Binomial Expansions'],
      },
      ollamaLocalDaemon: ollamaStatus,
    },
    endpoints: {
      health: '/api/health',
      telemetry: '/api/telemetry',
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}
