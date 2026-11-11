# VisiOS Scientific Math Service

FastAPI service providing deterministic symbolic math through SymPy, numerical arrays and integration through NumPy/SciPy, and PNG plus sample output through Matplotlib.

Run from this directory with `uvicorn app.main:app --host 127.0.0.1 --port 8300`. Install the service requirements into its own virtual environment from `requirements.txt`. The expression parser builds SymPy expressions from a strict Python-AST allowlist; it does not evaluate arbitrary Python code.

`POST /api/v1/math/analyze` accepts `expression`, `operation` (`simplify`, `differentiate`, `integrate`, `solve`, or `plot`), `variable`, optional integration/plot bounds, and optional `samples`. Interactive plotting returns numeric arrays and a base64 PNG for the client to display.

SymPy, NumPy, SciPy, Matplotlib, FastAPI, Uvicorn, and pytest retain their upstream licenses; verify notices for redistributed deployments.
