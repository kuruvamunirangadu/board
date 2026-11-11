from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from importlib.util import find_spec

from app.engine import analyze_dependency_graph, parse_python

app = FastAPI(title="VisiOS Computer Science Service", version="1.0.0")


class GraphRequest(BaseModel):
    nodes: list[str] = Field(min_length=1, max_length=1000)
    edges: list[tuple[str, str]] = Field(default_factory=list, max_length=5000)


class ParseRequest(BaseModel):
    source: str = Field(min_length=1, max_length=100_000)
    language: str = Field(default="python", pattern="^python$")


@app.get("/health")
def health():
    missing = [name for name, module in (("Tree-sitter", "tree_sitter"), ("Tree-sitter Python grammar", "tree_sitter_python")) if find_spec(module) is None]
    return {"service": "visios-computer-science", "status": "degraded" if missing else "available", "libraries": ["NetworkX", "Tree-sitter"], "missing_dependencies": missing, "code_execution": "disabled: no secure sandbox configured"}


def _run(function, *args):
    try:
        return function(*args)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/v1/graphs/analyze")
def graph_analysis(request: GraphRequest):
    return _run(analyze_dependency_graph, request.nodes, request.edges)


@app.post("/api/v1/code/parse")
def parse_code(request: ParseRequest):
    try:
        return parse_python(request.source)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
