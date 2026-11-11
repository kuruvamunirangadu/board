"""Safe, deterministic symbolic and numerical mathematics helpers."""

from __future__ import annotations

import ast
import base64
import io
import math
import operator
import re
from typing import Any

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import sympy as sp
from scipy.integrate import quad


_SYMBOLS = {name: sp.Symbol(name, real=True) for name in ("x", "y", "z", "t", "a", "b", "c")}
_CONSTANTS = {"pi": sp.pi, "E": sp.E}
_FUNCTIONS = {
    "sin": sp.sin, "cos": sp.cos, "tan": sp.tan, "cot": sp.cot,
    "sec": sp.sec, "csc": sp.csc, "sqrt": sp.sqrt, "log": sp.log,
    "ln": sp.log, "exp": sp.exp, "abs": sp.Abs,
}
_BINOPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.Pow: operator.pow,
}


class ExpressionError(ValueError):
    """Raised when input is outside the small, explicit math grammar."""


def _from_ast(node: ast.AST) -> sp.Expr:
    if isinstance(node, ast.Expression):
        return _from_ast(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
        if not math.isfinite(float(node.value)):
            raise ExpressionError("Numbers must be finite.")
        return sp.Integer(node.value) if isinstance(node.value, int) else sp.Float(node.value)
    if isinstance(node, ast.Name):
        if node.id in _SYMBOLS:
            return _SYMBOLS[node.id]
        if node.id in _CONSTANTS:
            return _CONSTANTS[node.id]
        raise ExpressionError(f"Unsupported name: {node.id}")
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
        value = _from_ast(node.operand)
        return value if isinstance(node.op, ast.UAdd) else -value
    if isinstance(node, ast.BinOp) and type(node.op) in _BINOPS:
        left, right = _from_ast(node.left), _from_ast(node.right)
        if isinstance(node.op, ast.Pow) and (right.is_number and abs(float(right)) > 100):
            raise ExpressionError("Exponent magnitude must not exceed 100.")
        return _BINOPS[type(node.op)](left, right)
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in _FUNCTIONS and not node.keywords:
        args = [_from_ast(arg) for arg in node.args]
        if len(args) != 1:
            raise ExpressionError("Math functions take exactly one argument.")
        return _FUNCTIONS[node.func.id](args[0])
    raise ExpressionError("Expression contains unsupported syntax.")


def parse_expression(source: str) -> sp.Expr | sp.Equality:
    text = (source or "").strip().replace("−", "-").replace("×", "*").replace("÷", "/")
    text = text.replace("²", "**2").replace("³", "**3").replace("^", "**")
    # Support common classroom notation (5x, 2(x+1), (x+1)(x-1)) while
    # keeping parsing inside the strict AST allowlist below.
    text = re.sub(r"(\d(?:\d|\.\d)*)(?=[A-Za-z(])", r"\1*", text)
    text = re.sub(r"(\))(?=[A-Za-z(])", r"\1*", text)
    if not text or len(text) > 500:
        raise ExpressionError("Expression is required and must be at most 500 characters.")
    if text.count("=") > 1:
        raise ExpressionError("Only one equality is supported.")
    try:
        if "=" in text:
            left, right = text.split("=", 1)
            return sp.Eq(_from_ast(ast.parse(left.strip(), mode="eval")), _from_ast(ast.parse(right.strip(), mode="eval")))
        return _from_ast(ast.parse(text, mode="eval"))
    except (SyntaxError, TypeError, ZeroDivisionError, OverflowError) as exc:
        raise ExpressionError("Could not parse this mathematical expression.") from exc


def _numeric_callable(expr: sp.Expr, variable: sp.Symbol) -> Any:
    return sp.lambdify(variable, expr, modules=["numpy"])


def analyze(expression: str, operation: str = "simplify", variable: str = "x", lower: float | None = None, upper: float | None = None, samples: int = 401) -> dict[str, Any]:
    if variable not in _SYMBOLS:
        raise ExpressionError("Variable must be one of x, y, z, t, a, b, or c.")
    if operation not in {"simplify", "differentiate", "integrate", "solve", "plot"}:
        raise ExpressionError("Operation must be simplify, differentiate, integrate, solve, or plot.")
    if not 50 <= samples <= 2000:
        raise ExpressionError("Samples must be between 50 and 2000.")

    parsed = parse_expression(expression)
    symbol = _SYMBOLS[variable]
    if operation == "solve":
        if not isinstance(parsed, sp.Equality):
            parsed = sp.Eq(parsed, 0)
        result: Any = sp.solve(parsed, symbol)
        symbolic = [sp.sstr(item) for item in result]
        value: Any = symbolic
    else:
        expr = parsed.lhs - parsed.rhs if isinstance(parsed, sp.Equality) else parsed
        if operation == "differentiate":
            result = sp.diff(expr, symbol)
        elif operation == "integrate":
            result = sp.integrate(expr, symbol)
        else:
            result = sp.simplify(expr)
        symbolic = sp.sstr(result)
        value = symbolic

        if operation == "integrate" and lower is not None and upper is not None:
            if not all(math.isfinite(v) for v in (lower, upper)) or lower >= upper:
                raise ExpressionError("Integration bounds must be finite and lower must be less than upper.")
            fn = _numeric_callable(expr, symbol)
            numerical, error = quad(lambda point: float(np.asarray(fn(point))), lower, upper, limit=200)
            value = {"antiderivative": symbolic, "definite_integral": numerical, "estimated_error": error}

    response: dict[str, Any] = {
        "service": "visios-math",
        "operation": operation,
        "input": expression,
        "normalized_expression": sp.sstr(parsed),
        "result": value,
        "libraries": {"symbolic": "SymPy", "numerical": "NumPy + SciPy", "plotting": "Matplotlib"},
    }
    if operation == "plot":
        if isinstance(parsed, sp.Equality):
            if parsed.lhs == _SYMBOLS["y"]:
                parsed = parsed.rhs
            else:
                raise ExpressionError("Plot supports explicit functions in the form y = expression.")
        if lower is None:
            lower = -10.0
        if upper is None:
            upper = 10.0
        if not math.isfinite(lower) or not math.isfinite(upper) or lower >= upper:
            raise ExpressionError("Plot bounds must be finite and lower must be less than upper.")
        grid = np.linspace(lower, upper, samples)
        fn = _numeric_callable(parsed, symbol)
        with np.errstate(all="ignore"):
            ys = np.asarray(fn(grid), dtype=np.complex128)
        if ys.ndim == 0:
            ys = np.full_like(grid, ys)
        ys = np.broadcast_to(ys, grid.shape)
        real_y = np.where(np.abs(ys.imag) < 1e-10, ys.real, np.nan)
        real_y = np.where(np.isfinite(real_y) & (np.abs(real_y) < 1e6), real_y, np.nan)
        fig, ax = plt.subplots(figsize=(7, 4), dpi=120)
        ax.plot(grid, real_y, color="#0891b2", linewidth=2)
        ax.axhline(0, color="#64748b", linewidth=0.8)
        ax.axvline(0, color="#64748b", linewidth=0.8)
        ax.grid(True, alpha=0.2)
        ax.set_xlabel(variable)
        ax.set_ylabel("f(" + variable + ")")
        ax.set_title(sp.sstr(parsed))
        fig.tight_layout()
        image = io.BytesIO()
        fig.savefig(image, format="png", bbox_inches="tight")
        plt.close(fig)
        response["plot"] = {
            "x": grid.tolist(),
            "y": [None if not np.isfinite(point) else float(point) for point in real_y],
            "image_base64": base64.b64encode(image.getvalue()).decode("ascii"),
        }
    return response
