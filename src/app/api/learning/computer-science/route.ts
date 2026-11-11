import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CS_URL = process.env.COMPUTER_SCIENCE_SERVICE_URL ?? "http://127.0.0.1:8500";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A valid computer science request is required." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const operation = input.operation;
  let endpoint: string;
  let payload: Record<string, unknown>;
  if (operation === "parse") {
    if (typeof input.source !== "string" || !input.source.trim() || input.source.length > 100_000) return NextResponse.json({ error: "Source must contain 1–100000 characters." }, { status: 400 });
    endpoint = "/api/v1/code/parse";
    payload = { source: input.source, language: input.language ?? "python" };
  } else if (operation === "graph") {
    if (!Array.isArray(input.nodes) || !Array.isArray(input.edges)) return NextResponse.json({ error: "Graph nodes and edges are required." }, { status: 400 });
    endpoint = "/api/v1/graphs/analyze";
    payload = { nodes: input.nodes, edges: input.edges };
  } else return NextResponse.json({ error: "operation must be parse or graph." }, { status: 400 });
  try {
    const response = await fetch(`${CS_URL}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30_000) });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.detail ?? "Computer science analysis failed." }, { status: response.status });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Computer science service is unavailable." }, { status: 503 }); }
}
