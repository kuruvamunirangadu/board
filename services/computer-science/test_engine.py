import pytest

from app.engine import analyze_dependency_graph, parse_python


def test_networkx_acyclic_order_and_cycle_detection():
    result = analyze_dependency_graph(["arrays", "graphs", "trees"], [("arrays", "graphs"), ("graphs", "trees")])
    assert result["is_acyclic"] is True
    assert result["topological_order"] == ["arrays", "graphs", "trees"]
    cyclic = analyze_dependency_graph(["a", "b"], [("a", "b"), ("b", "a")])
    assert cyclic["is_acyclic"] is False
    assert cyclic["topological_order"] is None


def test_graph_rejects_undeclared_edge_endpoint():
    with pytest.raises(ValueError):
        analyze_dependency_graph(["a"], [("a", "missing")])


def test_tree_sitter_python_parse():
    pytest.importorskip("tree_sitter")
    pytest.importorskip("tree_sitter_python")
    result = parse_python("def add(a, b):\n    return a + b\n")
    assert result["has_error"] is False
    assert any(node["type"] == "function_definition" for node in result["nodes"])
