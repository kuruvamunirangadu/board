from typing import Any
from rdkit import Chem
from rdkit.Chem import rdMolDescriptors

FUNCTIONAL_GROUPS: list[dict[str, str]] = [
    {
        "id": "carboxylic_acid",
        "name": "Carboxylic Acid",
        "smarts": "[CX3](=O)[OX2H1]",
        "description": "A carbonyl group bonded to a hydroxyl group (-COOH).",
        "example": "Acetic acid",
        "significance": "Acts as a weak organic acid; central to lipid, protein, and amino acid metabolism.",
    },
    {
        "id": "ester",
        "name": "Ester",
        "smarts": "[#6][CX3](=O)[OX2H0][#6]",
        "description": "A carbonyl group bonded to an alkoxy group (-COOR).",
        "example": "Ethyl acetate",
        "significance": "Common in fragrances, fats, and biodiesels; formed by Fischer esterification.",
    },
    {
        "id": "amide",
        "name": "Amide",
        "smarts": "[CX3](=O)[NX3;H2,H1,H0]",
        "description": "A carbonyl group bonded to a nitrogen atom (-CONR2).",
        "example": "Acetamide",
        "significance": "Forms the peptide backbone linking amino acids in peptides and proteins.",
    },
    {
        "id": "aldehyde",
        "name": "Aldehyde",
        "smarts": "[CX3H1](=O)[#6,H]",
        "description": "A carbonyl group bonded to at least one hydrogen atom (-CHO).",
        "example": "Acetaldehyde",
        "significance": "Reactive electrophilic carbonyl; easily oxidized to carboxylic acids.",
    },
    {
        "id": "ketone",
        "name": "Ketone",
        "smarts": "[#6][CX3](=O)[#6]",
        "description": "A carbonyl group bonded to two carbon substituents (R2C=O).",
        "example": "Acetone",
        "significance": "Versatile solvent and intermediate in carbohydrate and metabolic synthesis.",
    },
    {
        "id": "alcohol",
        "name": "Alcohol",
        "smarts": "[OX2H;!$(O[C,S,P]=O)]",
        "description": "A hydroxyl group (-OH) bonded to a saturated carbon atom.",
        "example": "Ethanol",
        "significance": "Undergoes hydrogen bonding, oxidation to carbonyls, and esterification.",
    },
    {
        "id": "ether",
        "name": "Ether",
        "smarts": "[OD2]([#6;!$(C=O)])[#6;!$(C=O)]",
        "description": "An oxygen atom bonded to two carbon groups (R-O-R').",
        "example": "Diethyl ether",
        "significance": "Relatively unreactive aprotic solvent, stable against bases and nucleophiles.",
    },
    {
        "id": "amine",
        "name": "Amine",
        "smarts": "[NX3;H2,H1,H0;!$(NC=O);!$(NS=O)]",
        "description": "A basic nitrogen atom with a lone pair bonded to alkyl or aryl groups.",
        "example": "Methylamine",
        "significance": "Acts as a Brønsted base and nucleophile; forms ammonium cations at physiological pH.",
    },
    {
        "id": "nitrile",
        "name": "Nitrile",
        "smarts": "[NX1]#[CX2]",
        "description": "A cyano group consisting of a carbon-nitrogen triple bond (-C≡N).",
        "example": "Acetonitrile",
        "significance": "Strongly polar solvent; synthetic precursor to carboxylic acids and primary amines.",
    },
    {
        "id": "aromatic_ring",
        "name": "Aromatic Ring",
        "smarts": "a1aaaaa1",
        "description": "A fully conjugated 6-membered aromatic ring with delocalized pi electrons.",
        "example": "Benzene",
        "significance": "Exhibits Hückel aromatic stability (6 pi electrons); undergoes electrophilic aromatic substitution.",
    },
    {
        "id": "alkene",
        "name": "Alkene",
        "smarts": "[CX3]=[CX3]",
        "description": "A carbon-carbon double bond (C=C).",
        "example": "Ethene",
        "significance": "Undergoes electrophilic addition reactions and polymerization.",
    },
    {
        "id": "alkyne",
        "name": "Alkyne",
        "smarts": "[CX2]#[CX2]",
        "description": "A carbon-carbon triple bond (C≡C).",
        "example": "Ethyne",
        "significance": "Linear geometry with acidic terminal alkynyl protons; participates in click chemistry.",
    },
    {
        "id": "alkyl_halide",
        "name": "Carbon-Halogen Bond",
        "smarts": "[#6][F,Cl,Br,I]",
        "description": "A carbon atom bonded to a halogen (fluorine, chlorine, bromine, iodine).",
        "example": "Chloroethane",
        "significance": "Substrate for nucleophilic substitution (SN1/SN2) and elimination (E1/E2) reactions.",
    },
    {
        "id": "thiol",
        "name": "Thiol",
        "smarts": "[#16X2H]",
        "description": "A sulfhydryl group (-SH) analog of an alcohol.",
        "example": "Methanethiol",
        "significance": "Readily oxidized to form disulfide bridges in peptides (e.g. cysteine).",
    },
    {
        "id": "nitro",
        "name": "Nitro Group",
        "smarts": "[$([NX3](=O)=O),$([NX3+](=O)[O-])]",
        "description": "A nitrogen atom bonded to two oxygen atoms (-NO2).",
        "example": "Nitrobenzene",
        "significance": "Strongly electron-withdrawing through resonance and induction.",
    },
]

# Precompile all SMARTS queries on startup to catch errors immediately
COMPILED_PATTERNS: list[tuple[dict[str, str], Chem.Mol]] = []
for _grp in FUNCTIONAL_GROUPS:
    _q = Chem.MolFromSmarts(_grp["smarts"])
    if _q is None:
        raise RuntimeError(f"Failed to compile SMARTS for {_grp['id']}: {_grp['smarts']}")
    COMPILED_PATTERNS.append((_grp, _q))


def recognize_functional_groups(smiles: str) -> dict[str, Any]:
    if not isinstance(smiles, str) or not smiles.strip():
        raise ValueError("SMILES must be a non-empty string.")

    cleaned_smiles = smiles.strip()
    if len(cleaned_smiles) > 4000:
        raise ValueError("SMILES input is too long.")

    mol = Chem.MolFromSmiles(cleaned_smiles)
    if mol is None:
        raise ValueError("Invalid SMILES notation.")

    canonical = Chem.MolToSmiles(mol)
    mol_with_h = Chem.AddHs(mol)
    formula = rdMolDescriptors.CalcMolFormula(mol_with_h)

    detected: list[dict[str, Any]] = []
    all_matched_indices: set[int] = set()

    for group, query in COMPILED_PATTERNS:
        matches = mol.GetSubstructMatches(query, uniquify=True, maxMatches=100)
        if not matches:
            continue

        match_details: list[dict[str, Any]] = []
        for match in matches:
            indices = list(match)
            symbols = [mol.GetAtomWithIdx(idx).GetSymbol() for idx in indices]
            all_matched_indices.update(indices)
            match_details.append({
                "atom_indices": indices,
                "atom_symbols": symbols,
            })

        detected.append({
            "id": group["id"],
            "name": group["name"],
            "description": group["description"],
            "example": group["example"],
            "significance": group["significance"],
            "occurrences": len(matches),
            "matches": match_details,
        })

    return {
        "subject": "chemistry",
        "task": "functional_group_recognition",
        "input_smiles": cleaned_smiles,
        "canonical_smiles": canonical,
        "molecular_formula": formula,
        "functional_group_count": len(detected),
        "total_occurrences": sum(g["occurrences"] for g in detected),
        "highlighted_atom_indices": sorted(list(all_matched_indices)),
        "detected_groups": detected,
        "verified": True,
    }
