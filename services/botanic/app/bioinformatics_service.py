from __future__ import annotations

from io import StringIO
import shutil
from typing import Any


def analyze_sequence(sequence: str, alphabet: str = "DNA") -> dict[str, Any]:
    from Bio.Seq import Seq
    from Bio.SeqUtils import gc_fraction

    cleaned = "".join(sequence.split()).upper()
    if not cleaned or len(cleaned) > 100_000:
        raise ValueError("sequence must contain 1 to 100000 symbols")
    normalized_alphabet = alphabet.upper()
    if normalized_alphabet not in {"DNA", "RNA", "PROTEIN"}:
        raise ValueError("alphabet must be DNA, RNA, or PROTEIN")
    allowed = {"DNA": set("ACGTN"), "RNA": set("ACGUN"), "PROTEIN": set("ACDEFGHIKLMNPQRSTVWYBXZJUO*")}[normalized_alphabet]
    invalid = set(cleaned) - allowed
    if invalid:
        raise ValueError(f"sequence contains invalid {normalized_alphabet} symbols: {''.join(sorted(invalid))}")
    result: dict[str, Any] = {
        "subject": "biology",
        "task": "sequence_analysis",
        "alphabet": normalized_alphabet,
        "length": len(cleaned),
        "sequence": cleaned,
        "verified": True,
        "engine": "Biopython",
    }
    if normalized_alphabet in {"DNA", "RNA"}:
        seq = Seq(cleaned)
        result["gc_fraction"] = float(gc_fraction(seq))
        result["gc_percent"] = round(float(gc_fraction(seq)) * 100, 3)
        result["complement"] = str(seq.complement_rna() if normalized_alphabet == "RNA" else seq.complement())
        result["reverse_complement"] = str(seq.reverse_complement_rna() if normalized_alphabet == "RNA" else seq.reverse_complement())
        if normalized_alphabet == "DNA" and len(cleaned) % 3 == 0:
            result["translation"] = str(seq.translate(to_stop=False))
    return result


def summarize_pdb(pdb_text: str) -> dict[str, Any]:
    from Bio.PDB import PDBParser

    if not pdb_text.strip() or len(pdb_text) > 2_000_000:
        raise ValueError("PDB text must contain 1 to 2000000 characters")
    try:
        structure = PDBParser(QUIET=True).get_structure("visios", StringIO(pdb_text))
    except Exception as exc:
        raise ValueError("could not parse the supplied PDB structure") from exc
    models = list(structure.get_models())
    if not models:
        raise ValueError("PDB structure contains no models")
    chains = []
    atom_count = 0
    for chain in models[0].get_chains():
        residues = [res for res in chain.get_residues() if res.id[0] == " "]
        atoms = [atom for residue in residues for atom in residue.get_atoms()]
        atom_count += len(atoms)
        chains.append({"id": chain.id, "residue_count": len(residues), "atom_count": len(atoms), "residue_names": [res.resname for res in residues]})
    if not chains:
        raise ValueError("PDB structure contains no polymer chains")
    return {"subject": "biology", "task": "protein_structure_summary", "model_count": len(models), "chains": chains, "atom_count": atom_count, "verified": True, "engine": "Biopython Bio.PDB"}


def blast_status() -> dict[str, Any]:
    executable = shutil.which("blastn")
    return {"available": executable is not None, "executable": executable, "database_configured": False, "message": "BLAST+ is installed but no database is configured." if executable else "BLAST+ executable is not installed in this environment."}
