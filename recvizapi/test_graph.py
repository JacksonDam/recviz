from pathlib import Path
import pytest
import networkx as nx
from recvizapi.Graph import Graph

class FakeDataset:
    def get_user_mapping(self):
        return {"1": {"age": "30"}}

    def get_item_mapping(self):
        return {"a": {"category": "test"}}

    def get_timestamps(self):
        return [0]

    def get_interaction_history(self):
        return {0: [{"user_id": "1", "item_id": "a"}]}

class FakeDatasetManager:
    def get_dataset(self, ds_name):
        return {"dataset_obj": FakeDataset()}

@pytest.fixture(autouse=True)
def forceatlas2_monkeypatch(monkeypatch):
    monkeypatch.setattr(nx, "forceatlas2_layout", lambda g, gravity, max_iter: {node: (0.5, 0.5) for node in g.nodes})
    monkeypatch.setattr("recvizapi.Graph.use_gpu_layout", False)

@pytest.fixture
def cache_dir(tmp_path):
    return str(tmp_path)

@pytest.fixture
def fake_dataset_manager():
    return FakeDatasetManager()

@pytest.fixture
def graph_instance(fake_dataset_manager, cache_dir):
    filters = {}
    graph_key = "testgraph"
    graph_obj = Graph("ds1", filters, cache_dir, graph_key, fake_dataset_manager)
    return graph_obj

def test_user_nodes_prepared(graph_instance):
    assert "1" in graph_instance.user_nodes

def test_item_nodes_prepared(graph_instance):
    assert "a" in graph_instance.item_nodes

def test_graph_has_edge(graph_instance):
    user_node_id = graph_instance.user_nodes["1"]["id"]
    item_node_id = graph_instance.item_nodes["a"]["id"]
    assert graph_instance.nx_graph.has_edge(user_node_id, item_node_id)

def test_gexf_file_written(graph_instance):
    gexf_path = graph_instance.get_gexf_path()
    assert Path(gexf_path).exists()

def test_graph_ready(graph_instance):
    assert graph_instance.is_ready()

def test_layout_coordinates_updated(graph_instance):
    for node in graph_instance.nx_graph.nodes:
        x = graph_instance.nx_graph.nodes[node]["x"]
        y = graph_instance.nx_graph.nodes[node]["y"]
        assert (x, y) == (0.5, 0.5)
