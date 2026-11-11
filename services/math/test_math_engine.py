import pytest
from fastapi import HTTPException

from app.main import MathRequest, analyze_math, health
from app.math_engine import ExpressionError, analyze, parse_expression


def test_safe_expression_parser_and_symbolic_operations():
    assert str(parse_expression("tan(x)^2 + cot(x)^2")) == "tan(x)**2 + cot(x)**2"
    assert str(parse_expression("x² − 5x + 6 = 0")) == "Eq(x**2 - 5*x + 6, 0)"
    assert analyze("x^2 + 2*x + 1", "differentiate")["result"] == "2*x + 2"
    assert analyze("x^2 - 5*x + 6 = 0", "solve")["result"] == ["2", "3"]


def test_definite_integral_uses_scipy_and_symbolics():
    result = analyze("x^2", "integrate", lower=0, upper=3)
    assert result["result"]["antiderivative"] == "x**3/3"
    assert result["result"]["definite_integral"] == pytest.approx(9)


def test_plot_uses_numpy_and_matplotlib():
    result = analyze("sin(x)", "plot", lower=-3.14, upper=3.14, samples=101)
    assert len(result["plot"]["x"]) == 101
    assert result["plot"]["y"][50] == pytest.approx(0, abs=1e-9)
    assert len(result["plot"]["image_base64"]) > 100

    explicit = analyze("y = 2x + 3", "plot", lower=-2, upper=2, samples=51)
    assert explicit["plot"]["y"][25] == pytest.approx(3)


def test_parser_rejects_code_execution_and_unknown_functions():
    with pytest.raises(ExpressionError):
        parse_expression("__import__('os').system('whoami')")
    with pytest.raises(ExpressionError):
        parse_expression("unknown(x)")


def test_api_health_and_validation():
    assert health()["service"] == "visios-math"
    response = analyze_math(MathRequest(expression="x^2", operation="solve"))
    assert response["result"] == ["0"]
    with pytest.raises(HTTPException) as error:
        analyze_math(MathRequest(expression="open('/tmp/x')"))
    assert error.value.status_code == 422
