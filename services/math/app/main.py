from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.math_engine import ExpressionError, analyze

app = FastAPI(title="VisiOS Scientific Math Service", version="1.0.0")


class MathRequest(BaseModel):
    expression: str = Field(min_length=1, max_length=500)
    operation: str = Field(default="simplify", max_length=20)
    variable: str = Field(default="x", max_length=2)
    lower: float | None = None
    upper: float | None = None
    samples: int = Field(default=401, ge=50, le=2000)


@app.get("/health")
def health():
    return {"status": "ok", "service": "visios-math", "libraries": ["sympy", "numpy", "scipy", "matplotlib"]}


@app.post("/api/v1/math/analyze")
def analyze_math(request: MathRequest):
    try:
        return analyze(request.expression, request.operation, request.variable, request.lower, request.upper, request.samples)
    except ExpressionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Expression could not be evaluated for this operation.") from exc
