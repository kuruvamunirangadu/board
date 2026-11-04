import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHEMISTRY_URL = process.env.CHEMISTRY_SERVICE_URL ?? "http://127.0.0.1:8200";

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
    !("smiles" in body) ||
    typeof (body as { smiles: unknown }).smiles !== "string"
  ) {
    return NextResponse.json(
      { error: "A SMILES string is required." },
      { status: 400 }
    );
  }

  const smiles = (body as { smiles: string }).smiles.trim();

  if (!smiles || smiles.length > 2000) {
    return NextResponse.json(
      { error: "SMILES must contain 1–2000 characters." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${CHEMISTRY_URL}/api/v1/embedding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ smiles }),
      signal: AbortSignal.timeout(120_000),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail ?? "Chemistry inference failed." },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Chemistry service is unavailable." },
      { status: 503 }
    );
  }
}
