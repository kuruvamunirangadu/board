import pytest

pytest.importorskip("Bio")

from app.bioinformatics_service import analyze_sequence, summarize_pdb


def test_dna_analysis_and_translation():
    result = analyze_sequence("ATGGCC", "DNA")
    assert result["gc_percent"] == pytest.approx(66.667, abs=0.001)
    assert result["reverse_complement"] == "GGCCAT"
    assert result["translation"] == "MA"


def test_invalid_sequence_is_rejected():
    with pytest.raises(ValueError):
        analyze_sequence("ATGX")


def test_pdb_summary_counts_chain_residues_and_atoms():
    pdb = """HEADER    TEST STRUCTURE\nATOM      1  N   GLY A   1      11.104  13.207   9.123  1.00 20.00           N\nATOM      2  CA  GLY A   1      12.560  13.207   9.123  1.00 20.00           C\nATOM      3  C   GLY A   1      13.100  14.600   9.500  1.00 20.00           C\nTER\nEND\n"""
    result = summarize_pdb(pdb)
    assert result["chains"][0]["id"] == "A"
    assert result["chains"][0]["residue_count"] == 1
    assert result["atom_count"] == 3
