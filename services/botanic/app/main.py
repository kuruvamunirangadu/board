from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from app.model_service import get_botanic_service

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

@app.get("/health")
def health():
    return {
        "service": "visios-botanic",
        "status": "available",
        "model": "living-models/Botanic1-S",
        "task": "plant_genome_embeddings",
        "commercial_use": False,
    }

@app.post("/api/v1/embeddings")
def generate_embedding(request: SequenceRequest):
    try:
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
