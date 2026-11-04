from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from app.model_service import get_chemberta_service

app = FastAPI(
    title="VisiOS ChemBERTa-2 Chemistry Intelligence Service",
    version="1.0.0",
    description="DeepChem ChemBERTa-77M-MLM molecular representation and masked token service.",
)

class MoleculeEmbeddingRequest(BaseModel):
    smiles: str = Field(
        min_length=1,
        max_length=2000,
        description="SMILES representation of a chemical molecule.",
    )

class MaskedMoleculeRequest(BaseModel):
    masked_smiles: str = Field(
        min_length=1,
        max_length=2000,
        description="SMILES string containing a mask token (<maskCapsule> or <maskCapsule>).",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of highest-probability candidate tokens to return.",
    )

@app.get("/health")
def health():
    return {
        "service": "visios-chemistry",
        "status": "available",
        "model": "DeepChem/ChemBERTa-77M-MLM",
        "task": "molecular_representation",
        "commercial_use": False,
    }

@app.post("/api/v1/embedding")
def generate_embedding(request: MoleculeEmbeddingRequest):
    try:
        service = get_chemberta_service()
        canonical = service.validate_smiles(request.smiles)
        embedding = service.embed(request.smiles)
        return {
            "subject": "chemistry",
            "model": "DeepChem/ChemBERTa-77M-MLM",
            "task": "molecular_embedding",
            "canonical_smiles": canonical,
            "embedding_dimension": len(embedding),
            "embedding": embedding,
            "verified": False,
            "source": "local_model",
        }
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as error:
        print("ChemBERTa embedding error:", str(error))
        raise HTTPException(
            status_code=500,
            detail="Molecular embedding failed.",
        )

@app.post("/api/v1/fill-mask")
def fill_mask(request: MaskedMoleculeRequest):
    try:
        service = get_chemberta_service()
        predictions = service.predict_masked_token(
            request.masked_smiles,
            request.top_k,
        )
        return {
            "subject": "chemistry",
            "model": "DeepChem/ChemBERTa-77M-MLM",
            "task": "masked_token_prediction",
            "input": request.masked_smiles,
            "predictions": predictions,
            "verified": False,
            "source": "local_model",
        }
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as error:
        print("ChemBERTa masked prediction error:", str(error))
        raise HTTPException(
            status_code=500,
            detail="Masked-token prediction failed.",
        )
