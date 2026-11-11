import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BIOLOGY_URL = process.env.BOTANIC_SERVICE_URL ?? "http://127.0.0.1:8100";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A valid biology request is required." }, { status: 400 });
  const input = body as Record<string, unknown>;
  let endpoint: string;
  let payload: Record<string, unknown>;
  if (input.operation === "pdb-summary") {
    if (typeof input.pdb_text !== "string" || !input.pdb_text.trim() || input.pdb_text.length > 2_000_000) return NextResponse.json({ error: "PDB text must contain 1–2000000 characters." }, { status: 400 });
    endpoint = "/api/v1/structures/pdb/summary";
    payload = { pdb_text: input.pdb_text };
  } else if (input.operation === "sequence-analysis") {
    if (typeof input.sequence !== "string" || !input.sequence.trim() || input.sequence.length > 100_000) return NextResponse.json({ error: "A sequence of 1–100000 characters is required." }, { status: 400 });
    endpoint = "/api/v1/sequences/analyze";
    payload = { sequence: input.sequence, alphabet: input.alphabet ?? "DNA" };
  } else {
    return NextResponse.json({ error: "operation must be sequence-analysis or pdb-summary." }, { status: 400 });
  }
  try {
    const response = await fetch(`${BIOLOGY_URL}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30_000) });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.detail ?? "Biology analysis failed." }, { status: response.status });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Biology service is unavailable." }, { status: 503 }); }
}
