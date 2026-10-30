import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const DEFAULT_MATH_MODEL = process.env.MATH_MODEL || 'mightykatun/qwen2.5-math:1.5b';
const FALLBACK_MODEL = 'qwen2.5:0.5b';
const REQUEST_TIMEOUT_MS = 120000; // 120 seconds
const MAX_QUESTION_LENGTH = 4000;

const MATH_SYSTEM_PROMPT = `You are a specialized mathematical reasoning assistant for VisiOS.
When solving or explaining mathematical problems:
1. Provide clear, rigorous, step-by-step reasoning.
2. Clearly state any assumptions, definitions, formulas, and theorems used.
3. Perform and double-check all arithmetic and algebraic transformations.
4. Do NOT attempt to fabricate graphical coordinates, raw canvas shape data, or pretend to render visuals directly.
5. Provide standard mathematical notation (LaTeX or plain text) for expressions.`;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request format.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || !('question' in body)) {
    return NextResponse.json(
      { error: 'Missing required field "question".' },
      { status: 400 }
    );
  }

  const { question } = body as { question: unknown };

  if (typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json(
      { error: 'Field "question" must be a non-empty string.' },
      { status: 400 }
    );
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Field "question" exceeds maximum allowed length of ${MAX_QUESTION_LENGTH} characters.` },
      { status: 400 }
    );
  }

  // Determine available models
  let selectedModel = DEFAULT_MATH_MODEL;
  try {
    const tagsRes = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (tagsRes.ok) {
      const tagsData = await tagsRes.json();
      const availableModels = (tagsData.models || []).map((m: { name: string }) => m.name);
      const hasMathModel = availableModels.some((name: string) =>
        name === DEFAULT_MATH_MODEL || name.startsWith(DEFAULT_MATH_MODEL) || name.includes('qwen2.5-math')
      );
      if (!hasMathModel && availableModels.includes(FALLBACK_MODEL)) {
        selectedModel = FALLBACK_MODEL;
      }
    }
  } catch {
    // If tags check fails, we proceed with DEFAULT_MATH_MODEL and let the chat request attempt it
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: MATH_SYSTEM_PROMPT },
          { role: 'user', content: question.trim() },
        ],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 700,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      return NextResponse.json(
        {
          error: 'Upstream mathematics model error.',
          statusCode: ollamaResponse.status,
          details: errText,
        },
        { status: 502 }
      );
    }

    const data = await ollamaResponse.json();
    const answer = data.message?.content || data.response || '';

    return NextResponse.json({
      subject: 'mathematics',
      model: selectedModel,
      answer,
      verified: false,
      source: 'local_model',
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    const isAbort = err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort'));
    return NextResponse.json(
      {
        error: isAbort
          ? `Mathematics model request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`
          : 'Mathematics service unreachable or offline.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    );
  }
}
