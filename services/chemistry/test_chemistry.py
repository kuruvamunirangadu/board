from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "visios-chemistry"
    assert data["status"] == "available"

def test_invalid_smiles():
    response = client.post(
        "/api/v1/embedding",
        json={"smiles": "NOT_A_MOLECULE"},
    )
    assert response.status_code == 400

def test_empty_smiles():
    response = client.post(
        "/api/v1/embedding",
        json={"smiles": ""},
    )
    assert response.status_code == 422

def test_invalid_mask_request():
    response = client.post(
        "/api/v1/fill-mask",
        json={"masked_smiles": "CCO"},
    )
    assert response.status_code == 400

def test_ethanol_embedding():
    response = client.post(
        "/api/v1/embedding",
        json={"smiles": "CCO"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["subject"] == "chemistry"
    assert data["canonical_smiles"] == "CCO"
    assert data["embedding_dimension"] == 384
    assert len(data["embedding"]) == 384

def test_fill_mask_success():
    response = client.post(
        "/api/v1/fill-mask",
        json={"masked_smiles": "C<maskCapsule>O", "top_k": 5},
    )
    if response.status_code != 200:
        response = client.post(
            "/api/v1/fill-mask",
            json={"masked_smiles": "C[MASK]O", "top_k": 5},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["task"] == "masked_token_prediction"
    assert len(data["predictions"]) <= 5
