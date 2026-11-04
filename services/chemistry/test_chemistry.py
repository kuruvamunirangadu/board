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
        json={"masked_smiles": "C[MASK]O", "top_k": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["task"] == "masked_token_prediction"
    assert len(data["predictions"]) <= 5

def test_molecule_analyze():
    response = client.post(
        "/api/v1/molecule/analyze",
        json={"smiles": "CCO"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["subject"] == "chemistry"
    assert data["task"] == "molecular_analysis"
    assert data["canonical_smiles"] == "CCO"
    assert data["molecular_formula"] == "C2H6O"
    assert abs(data["molecular_weight"] - 46.069) < 0.1
    assert data["total_atom_count"] == 9
    assert data["heavy_atom_count"] == 3
    assert any(g["name"] == "Alcohol (-OH)" for g in data["functional_groups"])
    assert data["verified"] is True

def test_molecule_3d():
    response = client.post(
        "/api/v1/molecule/3d",
        json={"smiles": "CCO"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["subject"] == "chemistry"
    assert data["task"] == "3d_conformer_generation"
    assert "sdf" in data
    assert len(data["sdf"]) > 50
    assert data["verified"] is True

def test_molecule_2d():
    response = client.post(
        "/api/v1/molecule/2d",
        json={"smiles": "CCO"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["subject"] == "chemistry"
    assert data["task"] == "2d_image_generation"
    assert data["mime_type"] == "image/png"
    assert len(data["image_base64"]) > 100
    assert data["verified"] is True

def test_molecule_invalid_smiles():
    for endpoint in ["/api/v1/molecule/analyze", "/api/v1/molecule/3d", "/api/v1/molecule/2d"]:
        response = client.post(endpoint, json={"smiles": "INVALID_MOL_XYZ"})
        assert response.status_code == 400


