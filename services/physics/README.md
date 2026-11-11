# VisiOS Physics Service

This optional FastAPI service provides deterministic projectile trajectories, SciPy ODE integration for a damped pendulum, Pint unit conversion/dimensional validation, and symbolic kinematics derivatives. Start it from this directory with `uvicorn app.main:app --host 127.0.0.1 --port 8400` after installing `requirements.txt` in a dedicated virtual environment. The JSON trajectory arrays are intended to feed the existing Three.js/canvas renderers.

Libraries retain their upstream licenses (NumPy BSD-3-Clause, SciPy BSD-3-Clause, Pint BSD-3-Clause, SymPy BSD-3-Clause, FastAPI MIT). Review notices when redistributing.
