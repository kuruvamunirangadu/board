import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PHYSICS_URL = process.env.PHYSICS_SERVICE_URL ?? "http://127.0.0.1:8400";
const ENDPOINTS = {
  units: "/api/v1/units/convert",
  projectile: "/api/v1/simulations/projectile",
  pendulum: "/api/v1/simulations/pendulum",
  symbolic: "/api/v1/symbolic/kinematics",
} as const;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid physics request body is required." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const operation = input.operation;
  if (typeof operation !== "string" || !(operation in ENDPOINTS)) {
    return NextResponse.json({ error: "operation must be units, projectile, pendulum, or symbolic." }, { status: 400 });
  }
  const { operation: _operation, ...payload } = input;
  try {
    const response = await fetch(`${PHYSICS_URL}${ENDPOINTS[operation as keyof typeof ENDPOINTS]}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: result.detail ?? "Physics calculation failed." }, { status: response.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Physics service is unavailable." }, { status: 503 });
  }
}
