import pytest

from app.engine import convert_units, damped_pendulum, projectile_motion, symbolic_mechanics


def test_unit_conversion_and_dimensions():
    pytest.importorskip("pint")
    result = convert_units(36, "kilometer/hour", "meter/second")
    assert result["converted_value"] == pytest.approx(10)
    assert "[length] / [time]" in result["dimensionality"]


def test_unit_conversion_rejects_incompatible_units():
    pytest.importorskip("pint")
    with pytest.raises(ValueError):
        convert_units(1, "meter", "second")


def test_projectile_known_range():
    result = projectile_motion(20, 45)
    assert result["range_meters"] == pytest.approx(20**2 / 9.80665, rel=1e-6)
    assert result["max_height_meters"] > 0


def test_pendulum_uses_ode_solver_and_restores_near_rest():
    result = damped_pendulum(0.2, duration=0.1, samples=11)
    assert result["solver"].startswith("scipy.solve_ivp")
    assert result["angle_radians"][0] == pytest.approx(0.2)
    assert result["angle_radians"][-1] < 0.2


def test_symbolic_derivatives():
    result = symbolic_mechanics("sin(t)")
    assert result["first_derivative"] == "cos(t)"
    assert result["second_derivative"] == "-sin(t)"


def test_symbolic_parser_rejects_python_execution_syntax():
    with pytest.raises(ValueError):
        symbolic_mechanics("__import__('os').system('whoami')")
