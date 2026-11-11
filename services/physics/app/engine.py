from __future__ import annotations

import ast
import operator
from typing import Any

import numpy as np
import sympy as sp
from scipy.integrate import solve_ivp

def convert_units(value: float, source_unit: str, target_unit: str) -> dict[str, Any]:
    try:
        import pint
    except ImportError as exc:
        raise RuntimeError("Pint is required for unit conversion; install services/physics/requirements.txt") from exc
    ureg = pint.UnitRegistry()
    if not np.isfinite(value):
        raise ValueError("value must be finite")
    try:
        quantity = float(value) * ureg(source_unit)
        converted = quantity.to(target_unit)
    except (pint.errors.UndefinedUnitError, pint.errors.DimensionalityError, ValueError) as exc:
        raise ValueError(str(exc)) from exc
    return {
        "value": float(value),
        "source_unit": str(quantity.units),
        "converted_value": float(converted.magnitude),
        "target_unit": str(converted.units),
        "dimensionality": str(quantity.dimensionality),
        "verified": True,
    }


def projectile_motion(speed: float, angle_degrees: float, gravity: float = 9.80665, samples: int = 101) -> dict[str, Any]:
    if not all(np.isfinite(v) for v in (speed, angle_degrees, gravity)):
        raise ValueError("speed, angle, and gravity must be finite")
    if speed < 0 or gravity <= 0 or not 2 <= samples <= 1000:
        raise ValueError("speed must be nonnegative, gravity positive, and samples between 2 and 1000")
    angle = np.deg2rad(angle_degrees)
    vx, vy = speed * np.cos(angle), speed * np.sin(angle)
    flight_time = max(0.0, 2.0 * vy / gravity)
    times = np.linspace(0.0, flight_time, samples) if flight_time else np.array([0.0] * samples)
    x = vx * times
    y = np.maximum(0.0, vy * times - 0.5 * gravity * times**2)
    return {
        "task": "projectile_motion",
        "time_seconds": times.tolist(),
        "x_meters": x.tolist(),
        "y_meters": y.tolist(),
        "flight_time_seconds": float(flight_time),
        "range_meters": float(x[-1]),
        "max_height_meters": float(np.max(y)),
        "gravity_meters_per_second_squared": float(gravity),
        "verified": True,
    }


def damped_pendulum(initial_angle: float, duration: float = 10.0, length: float = 1.0, damping: float = 0.1, gravity: float = 9.80665, samples: int = 501) -> dict[str, Any]:
    params = (initial_angle, duration, length, damping, gravity)
    if not all(np.isfinite(v) for v in params):
        raise ValueError("pendulum parameters must be finite")
    if duration <= 0 or length <= 0 or damping < 0 or gravity <= 0 or not 2 <= samples <= 5000:
        raise ValueError("duration, length, gravity must be positive; damping nonnegative; samples between 2 and 5000")

    def derivative(_time: float, state: np.ndarray) -> list[float]:
        theta, omega = state
        return [omega, -(gravity / length) * np.sin(theta) - damping * omega]

    times = np.linspace(0, duration, samples)
    solution = solve_ivp(derivative, (0, duration), [initial_angle, 0.0], t_eval=times, rtol=1e-8, atol=1e-10)
    if not solution.success:
        raise RuntimeError("SciPy could not solve the pendulum system")
    return {
        "task": "damped_pendulum",
        "time_seconds": solution.t.tolist(),
        "angle_radians": solution.y[0].tolist(),
        "angular_velocity_radians_per_second": solution.y[1].tolist(),
        "parameters": {"length_meters": length, "damping_per_second": damping, "gravity_meters_per_second_squared": gravity},
        "solver": "scipy.solve_ivp (RK45)",
        "verified": True,
    }


def symbolic_mechanics(expression: str, variable: str = "t") -> dict[str, str]:
    if len(expression) > 300 or variable not in {"t", "x", "theta"}:
        raise ValueError("expression too long or unsupported variable")
    symbol = sp.Symbol(variable, real=True)
    binary = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.Pow: operator.pow}
    unary = {ast.UAdd: operator.pos, ast.USub: operator.neg}
    functions = {"sin": sp.sin, "cos": sp.cos, "exp": sp.exp, "sqrt": sp.sqrt}

    def convert(node: ast.AST):
        if isinstance(node, ast.Expression):
            return convert(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) and abs(node.value) <= 1_000_000:
            return sp.sympify(node.value)
        if isinstance(node, ast.Name) and node.id == variable:
            return symbol
        if isinstance(node, ast.BinOp) and type(node.op) in binary:
            if isinstance(node.op, ast.Pow) and isinstance(node.right, ast.Constant) and abs(float(node.right.value)) > 20:
                raise ValueError("exponent magnitude must not exceed 20")
            return binary[type(node.op)](convert(node.left), convert(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in unary:
            return unary[type(node.op)](convert(node.operand))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in functions and len(node.args) == 1 and not node.keywords:
            return functions[node.func.id](convert(node.args[0]))
        raise ValueError("expression contains unsupported syntax")

    try:
        tree = ast.parse(expression, mode="eval")
        if sum(1 for _ in ast.walk(tree)) > 100:
            raise ValueError("expression is too complex")
        parsed = convert(tree)
    except (SyntaxError, TypeError, OverflowError) as exc:
        raise ValueError("invalid symbolic expression") from exc
    return {"expression": str(parsed), "first_derivative": str(sp.diff(parsed, symbol)), "second_derivative": str(sp.diff(parsed, symbol, 2)), "variable": variable}
