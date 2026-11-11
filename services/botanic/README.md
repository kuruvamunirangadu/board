# VisiOS Biology and Plant Genomics

The service provides BOTANIC-1 sequence embeddings (when model weights are available), Biopython DNA/RNA/protein sequence analysis, and Bio.PDB structural summaries. BLAST+ is only reported as available when its `blastn` executable is on PATH; a local sequence database must also be configured before search can be offered. Install requirements in a dedicated virtual environment and start with `uvicorn app.main:app --host 127.0.0.1 --port 8100`.

Biopython is BSD-3-Clause. BOTANIC-1 weights and model code retain their upstream terms; check the model card and license before redistribution or commercial use.
