import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHEMISTRY_URL = process.env.CHEMISTRY_SERVICE_URL ?? "http://127.0.0.1:8200";

interface ChemistryRequestBody {
  action?: "embedding" | "analyze" | "3d" | "2d" | "fill-mask";
  smiles?: string;
  masked_smiles?: string;
  top_k?: number;
}

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

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "A valid request body is required." },
      { status: 400 }
    );
  }

  const typedBody = body as ChemistryRequestBody;
  const action = typedBody.action ?? "embedding";

  let targetEndpoint: string;
  let payload: Record<string, unknown>;

  if (action === "fill-mask") {
    const rawMasked = typedBody.masked_smiles ?? typedBody.smiles ?? "";
    const maskedSmiles = typeof rawMasked === "string" ? rawMasked.trim() : "";
    if (!maskedSmiles || maskedSmiles.length > 2000) {
      return NextResponse.json(
        { error: "A masked SMILES string is required (1–2000 characters)." },
        { status: 400 }
      );
    }
    targetEndpoint = `${CHEMISTRY_URL}/api/v1/fill-mask`;
    payload = {
      masked_smiles: maskedSmiles,
      top_k: typeof typedBody.top_k === "number" ? Math.min(Math.max(typedBody.top_k, 1), 20) : 5,
    };
  } else {
    if (!("smiles" in typedBody) || typeof typedBody.smiles !== "string") {
      return NextResponse.json(
        { error: "A SMILES string is required." },
        { status: 400 }
      );
    }

    const smiles = typedBody.smiles.trim();
    if (!smiles || typedBody.smiles.length > 2000) {
      return NextResponse.json(
        { error: "SMILES must contain 1–2000 characters." },
        { status: 400 }
      );
    }

    payload = { smiles };

    switch (action) {
      case "analyze":
        targetEndpoint = `${CHEMISTRY_URL}/api/v1/molecule/analyze`;
        break;
      case "3d":
        targetEndpoint = `${CHEMISTRY_URL}/api/v1/molecule/3d`;
        break;
      case "2d":
        targetEndpoint = `${CHEMISTRY_URL}/api/v1/molecule/2d`;
        break;
      case "embedding":
      default:
        targetEndpoint = `${CHEMISTRY_URL}/api/v1/embedding`;
        break;
    }
  }

  try {
    const response = await fetch(targetEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
