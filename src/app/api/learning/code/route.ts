import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const CODE_MODEL = process.env.OLLAMA_CODE_MODEL ?? "qwen2.5-coder:1.5b";

const SYSTEM_PROMPT = `
You are the Computer Science and Programming Tutor inside VisiOS, an educational visual learning platform.

Your responsibilities:
- Explain programming concepts clearly.
- Explain algorithms step by step.
- Generate readable educational code.
- Explain data structures and their operations.
- Identify programming errors and suggest corrections.
- Explain time and space complexity.
- Use the programming language requested by the student.
- Never claim code has been executed or tested unless an execution tool actually performed that operation.
- Do not invent execution results.
- Prefer simple examples before advanced explanations.
- Return relevant code in Markdown code blocks.
`;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must contain valid JSON." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("question" in body) ||
    typeof (body as { question: unknown }).question !== "string"
  ) {
    return NextResponse.json(
      { error: 'Provide a string field named "question".' },
      { status: 400 }
    );
  }

  const question = (body as { question: string }).question.trim();

  if (!question) {
    return NextResponse.json(
      { error: "Question cannot be empty." },
      { status: 400 }
    );
  }

  if (question.length > 4000) {
    return NextResponse.json(
      { error: "Question exceeds the 4000-character limit." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    120_000
  );

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: CODE_MODEL,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: question,
          },
        ],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 1000,
        },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Ollama coding request failed:", details);
      return NextResponse.json(
        { error: "The local coding model returned an error." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const answer = data?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json(
        { error: "The coding model returned an empty answer." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      subject: "computer_science",
      model: CODE_MODEL,
      answer: answer.trim(),
      verified: false,
      source: "local_model",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: timedOut
          ? "The coding model took too long to respond."
          : "Cannot reach Ollama. Check that it is running.",
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

