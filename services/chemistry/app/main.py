from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from app.molecular_service import analyze_molecule, generate_3d_structure, generate_2d_image
from app.functional_group_service import recognize_functional_groups

app = FastAPI(
    title="VisiOS ChemBERTa-2 Chemistry Intelligence Service",
    version="1.0.0",
    description="DeepChem ChemBERTa-77M-MLM molecular representation and RDKit molecular analysis service.",
)

class MoleculeEmbeddingRequest(BaseModel):
    smiles: str = Field(
        min_length=1,
        max_length=2000,
        description="SMILES representation of a chemical molecule.",
    )
class MoleculeRequest(BaseModel):
    smiles: str = Field(
        min_length=1,
        max_length=2000,
        description="SMILES representation of a chemical molecule.",
    )
class FunctionalGroupRequest(BaseModel):
    smiles: str = Field(
        min_length=1,
        max_length=4000,
        description="SMILES representation of a chemical molecule.",
    )

class MaskedMoleculeRequest(BaseModel):
    masked_smiles: str = Field(
        min_length=1,
        max_length=2000,
        description="SMILES string containing a mask token ([MASK] or <mask>).",
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
        "task": "molecular_representation_and_visualization",
        "commercial_use": False,
    }
@app.post("/api/v1/molecule/functional-groups")
def analyze_functional_groups(request: FunctionalGroupRequest):
    try:
        return recognize_functional_groups(request.smiles)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        print("Functional group analysis error:", str(exc))
        raise HTTPException(
            status_code=500,
            detail="Functional group analysis failed.",
        )
@app.post("/api/v1/molecule/analyze")
def analyze(request: MoleculeRequest):
    try:
        data = analyze_molecule(request.smiles)
        return data
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as error:
        print("Molecular analysis error:", str(error))
        raise HTTPException(
            status_code=500,
            detail="Molecular analysis failed.",
        )

@app.post("/api/v1/molecule/3d")
def structure_3d(request: MoleculeRequest):
    try:
        data = generate_3d_structure(request.smiles)
        return data
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as error:
        print("3D structure generation error:", str(error))
        raise HTTPException(
            status_code=500,
            detail="3D molecular conformer generation failed.",
        )
@app.post("/api/v1/molecule/2d")
def image_2d(request: MoleculeRequest):
    try:
        image_base64 = generate_2d_image(request.smiles)
        return {
            "subject": "chemistry",
            "task": "2d_image_generation",
            "smiles": request.smiles,
            "image_base64": image_base64,
            "mime_type": "image/png",
            "verified": True,
        }
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as error:
        print("2D image generation error:", str(error))
        raise HTTPException(
            status_code=500,
            detail="2D molecular image generation failed.",
        )

@app.post("/api/v1/embedding")
def generate_embedding(request: MoleculeEmbeddingRequest):
    try:
        # Keep the large ML runtime out of app startup and chemistry-only endpoints.
        from app.model_service import get_chemberta_service

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
        from app.model_service import get_chemberta_service

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

