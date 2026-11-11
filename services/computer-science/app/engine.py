from __future__ import annotations

from typing import Any

import networkx as nx


def analyze_dependency_graph(nodes: list[str], edges: list[tuple[str, str]]) -> dict[str, Any]:
    if not nodes or len(nodes) > 1000 or len(edges) > 5000:
        raise ValueError("graph must contain 1–1000 nodes and at most 5000 edges")
    if any(not isinstance(node, str) or not node or len(node) > 120 for node in nodes) or len(set(nodes)) != len(nodes):
        raise ValueError("nodes must be unique non-empty strings up to 120 characters")
    graph = nx.DiGraph()
    graph.add_nodes_from(nodes)
    for edge in edges:
        if len(edge) != 2 or edge[0] not in graph or edge[1] not in graph:
            raise ValueError("every edge must connect two declared nodes")
        graph.add_edge(*edge)
    cyclic = not nx.is_directed_acyclic_graph(graph)
    return {
        "task": "dependency_graph_analysis",
        "node_count": graph.number_of_nodes(),
        "edge_count": graph.number_of_edges(),
        "is_acyclic": not cyclic,
        "topological_order": list(nx.topological_sort(graph)) if not cyclic else None,
        "strongly_connected_components": [sorted(component) for component in nx.strongly_connected_components(graph)],
        "verified": True,
    }


def parse_python(source: str) -> dict[str, Any]:
    if not source.strip() or len(source) > 100_000:
        raise ValueError("source must contain 1 to 100000 characters")
    try:
        import tree_sitter_python
        from tree_sitter import Language, Parser
    except ImportError as exc:
        raise RuntimeError("Tree-sitter Python grammar is missing; install services/computer-science/requirements.txt") from exc
    parser = Parser(Language(tree_sitter_python.language()))
    tree = parser.parse(source.encode("utf-8"))
    nodes: list[dict[str, Any]] = []

    def visit(node, depth: int = 0):
        if len(nodes) >= 10_000:
            return
        nodes.append({"type": node.type, "start_row": node.start_point.row + 1, "start_column": node.start_point.column + 1, "end_row": node.end_point.row + 1, "named": node.is_named, "has_error": node.has_error})
        for child in node.children:
            visit(child, depth + 1)

    visit(tree.root_node)
    return {"task": "syntax_tree", "language": "python", "has_error": tree.root_node.has_error, "root_type": tree.root_node.type, "nodes": nodes, "node_count": len(nodes), "verified": True}
