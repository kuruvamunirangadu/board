"""Service contract tests.

FastAPI TestClient currently hangs in this Windows AnyIO environment before
serving even /health. Exercise the same validated request models and handlers
directly so deterministic endpoint behavior remains covered.
"""
from dataclasses import dataclass
from fastapi import HTTPException
from pydantic import ValidationError
from app.main import (
    FunctionalGroupRequest, MaskedMoleculeRequest, MoleculeEmbeddingRequest,
    MoleculeRequest, analyze, analyze_functional_groups, fill_mask, generate_embedding,
    health, image_2d, structure_3d,
)


@dataclass
class DirectResponse:
    status_code: int
    _data: dict

    def json(self):
        return self._data

    @property
    def text(self):
        return str(self._data)


class DirectApiClient:
    routes = {
        "/api/v1/embedding": (MoleculeEmbeddingRequest, generate_embedding),
        "/api/v1/fill-mask": (MaskedMoleculeRequest, fill_mask),
        "/api/v1/molecule/analyze": (MoleculeRequest, analyze),
        "/api/v1/molecule/3d": (MoleculeRequest, structure_3d),
        "/api/v1/molecule/2d": (MoleculeRequest, image_2d),
        "/api/v1/molecule/functional-groups": (FunctionalGroupRequest, analyze_functional_groups),
    }

    def get(self, path):
        return DirectResponse(200, health()) if path == "/health" else DirectResponse(404, {"detail": "Not found"})

    def post(self, path, json):
        route = self.routes.get(path)
        if route is None:
            return DirectResponse(404, {"detail": "Not found"})
        model, handler = route
        try:
            request = model(**json)
            return DirectResponse(200, handler(request))
        except ValidationError as exc:
            return DirectResponse(422, {"detail": exc.errors()})
        except HTTPException as exc:
            return DirectResponse(exc.status_code, {"detail": exc.detail})


client = DirectApiClient()

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

def test_functional_groups_7_molecules():
    molecules = [
        ("CCO", "alcohol"),
        ("CC(=O)O", "carboxylic_acid"),
        ("CC(=O)C", "ketone"),
        ("CCOC(=O)C", "ester"),
        ("CC(=O)N", "amide"),
        ("c1ccccc1", "aromatic_ring"),
        ("CC#N", "nitrile"),
    ]
    for smiles, expected_id in molecules:
        response = client.post("/api/v1/molecule/functional-groups", json={"smiles": smiles})
        assert response.status_code == 200, f"Failed for {smiles}: {response.text}"
        data = response.json()
        assert data["subject"] == "chemistry"
        assert data["task"] == "functional_group_recognition"
        group_ids = [g["id"] for g in data["detected_groups"]]
        assert expected_id in group_ids, f"Expected {expected_id} in {group_ids} for {smiles}"
        assert data["verified"] is True
        assert len(data["highlighted_atom_indices"]) > 0

def test_functional_groups_acetic_acid_detail():
    response = client.post("/api/v1/molecule/functional-groups", json={"smiles": "CC(=O)O"})
    assert response.status_code == 200
    data = response.json()
    assert data["functional_group_count"] == 1
    grp = data["detected_groups"][0]
    assert grp["id"] == "carboxylic_acid"
    assert grp["name"] == "Carboxylic Acid"
    assert grp["occurrences"] == 1
    assert len(grp["matches"]) == 1
    assert "atom_indices" in grp["matches"][0]
    assert "atom_symbols" in grp["matches"][0]
    assert data["highlighted_atom_indices"] == grp["matches"][0]["atom_indices"]

def test_functional_groups_multiple_occurrences():
    # Ethylene glycol has two -OH groups
    response = client.post("/api/v1/molecule/functional-groups", json={"smiles": "OCCO"})
    assert response.status_code == 200
    data = response.json()
    alcohol_grp = next(g for g in data["detected_groups"] if g["id"] == "alcohol")
    assert alcohol_grp["occurrences"] == 2
    assert len(alcohol_grp["matches"]) == 2

def test_functional_groups_multi_group_molecule():
    # Aspirin: ester, carboxylic acid, aromatic ring
    response = client.post("/api/v1/molecule/functional-groups", json={"smiles": "CC(=O)Oc1ccccc1C(=O)O"})
    assert response.status_code == 200
    data = response.json()
    group_ids = {g["id"] for g in data["detected_groups"]}
    assert "carboxylic_acid" in group_ids
    assert "ester" in group_ids
    assert "aromatic_ring" in group_ids

def test_functional_groups_invalid_smiles():
    response = client.post("/api/v1/molecule/functional-groups", json={"smiles": "NOT_A_VALID_SMILES"})
    assert response.status_code == 422
    data = response.json()
    assert "Invalid SMILES notation" in data["detail"]

def test_functional_groups_empty_smiles():
    response = client.post("/api/v1/molecule/functional-groups", json={"smiles": "   "})
    assert response.status_code == 422



