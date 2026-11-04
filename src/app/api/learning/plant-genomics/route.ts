import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOTANIC_URL = process.env.BOTANIC_SERVICE_URL ?? "http://127.0.0.1:8100";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("sequence" in body) ||
    typeof (body as { sequence: unknown }).sequence !== "string"
  ) {
    return NextResponse.json(
      { error: "A DNA sequence is required." },
      { status: 400 }
    );
  }

  const sequence = (body as { sequence: string }).sequence.trim();

  if (!sequence || sequence.length > 2048) {
    return NextResponse.json(
      { error: "Sequence must contain 1–2048 characters." },
      { status: 400 }
    );
  }

  if (!/^[ACGTN]+$/i.test(sequence)) {
    return NextResponse.json(
      { error: "Only A, C, G, T and N are accepted." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${BOTANIC_URL}/api/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sequence }),
      signal: AbortSignal.timeout(120_000),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail ?? "BOTANIC inference failed." },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "BOTANIC service is unavailable." },
      { status: 503 }
    );
  }
}
