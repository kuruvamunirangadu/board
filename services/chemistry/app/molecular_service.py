import base64
from io import BytesIO
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors, Draw

FUNCTIONAL_GROUPS = {
    "Alcohol (-OH)": Chem.MolFromSmarts("[OX2H]"),
    "Carboxylic Acid (-COOH)": Chem.MolFromSmarts("[CX3](=O)[OX2H1]"),
    "Aldehyde (-CHO)": Chem.MolFromSmarts("[CX3H1](=O)[#6]"),
    "Ketone (C=O)": Chem.MolFromSmarts("[#6][CX3](=O)[#6]"),
    "Amine (-NH2 / -NR2)": Chem.MolFromSmarts("[NX3;H2,H1;!$(NC=O)]"),
    "Ether (C-O-C)": Chem.MolFromSmarts("[OD2]([#6])[#6]"),
    "Ester (-COO-)": Chem.MolFromSmarts("[#6][CX3](=O)[OX2H0][#6]"),
    "Aromatic Ring": Chem.MolFromSmarts("a1aaaaa1"),
    "Alkyne (C#C)": Chem.MolFromSmarts("C#C"),
    "Alkene (C=C)": Chem.MolFromSmarts("C=C"),
}

def analyze_molecule(smiles: str) -> dict:
    smiles = (smiles or "").strip()
    if not smiles:
        raise ValueError("SMILES string cannot be empty.")

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid molecular SMILES: '{smiles}'.")

    canonical = Chem.MolToSmiles(mol)
    mol_with_h = Chem.AddHs(mol)

    formula = rdMolDescriptors.CalcMolFormula(mol_with_h)
    mol_wt = round(Descriptors.MolWt(mol_with_h), 4)
    exact_mass = round(Descriptors.ExactMolWt(mol_with_h), 4)
    heavy_atoms = mol.GetNumHeavyAtoms()
    total_atoms = mol_with_h.GetNumAtoms()
    total_bonds = mol_with_h.GetNumBonds()

    detected_groups = []
    for name, pattern in FUNCTIONAL_GROUPS.items():
        if pattern and mol.HasSubstructMatch(pattern):
            matches = len(mol.GetSubstructMatches(pattern))
            detected_groups.append({"name": name, "count": matches})

    atom_counts = {}
    for atom in mol_with_h.GetAtoms():
        sym = atom.GetSymbol()
        atom_counts[sym] = atom_counts.get(sym, 0) + 1

    return {
        "subject": "chemistry",
        "task": "molecular_analysis",
        "input_smiles": smiles,
        "canonical_smiles": canonical,
        "molecular_formula": formula,
        "molecular_weight": mol_wt,
        "exact_mass": exact_mass,
        "heavy_atom_count": heavy_atoms,
        "total_atom_count": total_atoms,
        "total_bond_count": total_bonds,
        "atom_breakdown": atom_counts,
        "functional_groups": detected_groups,
        "verified": True,
    }

def generate_3d_structure(smiles: str) -> dict:
    smiles = (smiles or "").strip()
    if not smiles:
        raise ValueError("SMILES string cannot be empty.")

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid molecular SMILES: '{smiles}'.")

    canonical = Chem.MolToSmiles(mol)
    mol_with_h = Chem.AddHs(mol)

    params = AllChem.ETKDGv3()
    params.randomSeed = 42
    embed_res = AllChem.EmbedMolecule(mol_with_h, params)
    if embed_res != 0:
        embed_res = AllChem.EmbedMolecule(mol_with_h)
    if embed_res != 0:
        raise ValueError("Could not generate 3D molecular coordinates.")

    optimization = AllChem.MMFFOptimizeMolecule(mol_with_h)
    sdf = Chem.MolToMolBlock(mol_with_h)

    return {
        "subject": "chemistry",
        "task": "3d_conformer_generation",
        "canonical_smiles": canonical,
        "sdf": sdf,
        "optimization_status": optimization,
        "atom_count": mol_with_h.GetNumAtoms(),
        "heavy_atom_count": mol.GetNumHeavyAtoms(),
        "verified": True,
    }

def generate_2d_image(smiles: str) -> str:
    smiles = (smiles or "").strip()
    if not smiles:
        raise ValueError("SMILES string cannot be empty.")

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid molecular SMILES: '{smiles}'.")

    img = Draw.MolToImage(mol, size=(600, 400))
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
