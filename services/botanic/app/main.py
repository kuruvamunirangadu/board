from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from importlib.util import find_spec
from app.bioinformatics_service import analyze_sequence, blast_status, summarize_pdb

app = FastAPI(
    title="VisiOS BOTANIC Plant Genomics Service",
    version="1.0.0",
    description="Research-only plant DNA sequence embedding service.",
)

class SequenceRequest(BaseModel):
    sequence: str = Field(
        min_length=1,
        max_length=2048,
        description="DNA sequence containing A, C, G, T or N",
    )

class SequenceAnalysisRequest(BaseModel):
    sequence: str = Field(min_length=1, max_length=100_000)
    alphabet: str = Field(default="DNA", min_length=3, max_length=7)

class PdbRequest(BaseModel):
    pdb_text: str = Field(min_length=1, max_length=2_000_000)

@app.get("/health")
def health():
    biopython_available = find_spec("Bio") is not None
    return {
        "service": "visios-botanic",
        "status": "available" if biopython_available else "degraded",
        "model": "living-models/Botanic1-S",
        "task": "plant_genome_embeddings",
        "commercial_use": False,
        "biopython": biopython_available,
        "blast_plus": blast_status(),
    }

@app.post("/api/v1/embeddings")
def generate_embedding(request: SequenceRequest):
    try:
        from app.model_service import get_botanic_service

        service = get_botanic_service()
        embedding = service.embed(request.sequence)
        return {
            "subject": "plant_genomics",
            "model": "living-models/Botanic1-S",
            "task": "sequence_embedding",
            "embedding_dimension": len(embedding),
            "embedding": embedding,
            "source": "local_model",
            "verified": False,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/v1/sequences/analyze")
def sequence_analysis(request: SequenceAnalysisRequest):
    try:
        return analyze_sequence(request.sequence, request.alphabet)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

@app.post("/api/v1/structures/pdb/summary")
def protein_structure_summary(request: PdbRequest):
    try:
        return summarize_pdb(request.pdb_text)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
