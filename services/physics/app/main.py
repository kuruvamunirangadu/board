from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from importlib.util import find_spec

from app.engine import convert_units, damped_pendulum, projectile_motion, symbolic_mechanics

app = FastAPI(title="VisiOS Physics Service", version="1.0.0")


class UnitConversion(BaseModel):
    value: float
    source_unit: str = Field(min_length=1, max_length=80)
    target_unit: str = Field(min_length=1, max_length=80)


class ProjectileRequest(BaseModel):
    speed: float = Field(ge=0, le=100_000)
    angle_degrees: float = Field(ge=-360, le=360)
    gravity: float = Field(default=9.80665, gt=0, le=1000)
    samples: int = Field(default=101, ge=2, le=1000)


class PendulumRequest(BaseModel):
    initial_angle: float = Field(ge=-100, le=100)
    duration: float = Field(default=10, gt=0, le=600)
    length: float = Field(default=1, gt=0, le=1000)
    damping: float = Field(default=0.1, ge=0, le=100)
    gravity: float = Field(default=9.80665, gt=0, le=1000)
    samples: int = Field(default=501, ge=2, le=5000)


class SymbolicRequest(BaseModel):
    expression: str = Field(min_length=1, max_length=300)
    variable: str = Field(default="t", min_length=1, max_length=10)


@app.get("/health")
def health():
    missing = [name for name, module in (("Pint", "pint"),) if find_spec(module) is None]
    return {"service": "visios-physics", "status": "degraded" if missing else "available", "libraries": ["NumPy", "SciPy", "SymPy", "Pint"], "missing_dependencies": missing}


def _run(function, *args, **kwargs):
    try:
        return function(*args, **kwargs)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/v1/units/convert")
def unit_conversion(request: UnitConversion):
    return _run(convert_units, request.value, request.source_unit, request.target_unit)


@app.post("/api/v1/simulations/projectile")
def projectile(request: ProjectileRequest):
    return _run(projectile_motion, request.speed, request.angle_degrees, request.gravity, request.samples)


@app.post("/api/v1/simulations/pendulum")
def pendulum(request: PendulumRequest):
    return _run(damped_pendulum, request.initial_angle, request.duration, request.length, request.damping, request.gravity, request.samples)


@app.post("/api/v1/symbolic/kinematics")
def mechanics(request: SymbolicRequest):
    return _run(symbolic_mechanics, request.expression, request.variable)
