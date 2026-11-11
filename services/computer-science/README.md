# VisiOS Computer Science Service

NetworkX supports directed dependency graphs; Tree-sitter parses Python source into bounded syntax-tree summaries. This service does not execute submitted code. Start it from this directory with `uvicorn app.main:app --host 127.0.0.1 --port 8500` after installing the service requirements. Existing in-app code tracing remains deterministic and is not replaced by parsing.

NetworkX is BSD-3-Clause. Tree-sitter and its Python grammar are MIT licensed. Code execution is intentionally disabled until VisiOS has a configured isolated sandbox (for example, a managed Judge0 deployment with authentication and resource limits).
