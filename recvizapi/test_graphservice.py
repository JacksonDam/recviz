import pytest
from recvizapi.GraphService import GraphService, compute_graph_key

class FakeDatasetManager:
    def get_dataset(self, ds_name):
        return {"dataset_obj": None}

class FakeGraph:
    def __init__(self, dataset_name, filters, cache_dir, graph_key, dataset_manager):
        self.dataset_name = dataset_name
        self.filters = filters
        self.cache_dir = cache_dir
        self.graph_key = graph_key
        self.dataset_manager = dataset_manager

@pytest.fixture
def fake_dataset_manager():
    return FakeDatasetManager()

def test_invalid_cache_path(tmp_path, fake_dataset_manager):
    non_existent = tmp_path / "nonexistent"
    with pytest.raises(EnvironmentError):
        GraphService(str(non_existent), fake_dataset_manager)

def test_cached_file_loaded(tmp_path, fake_dataset_manager):
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()
    gexf_file = cache_dir / "dataset1.gexf"
    gexf_file.write_text("dummy")
    service = GraphService(str(cache_dir), fake_dataset_manager)
    assert service.cached.get("dataset1") == str(gexf_file)

def test_get_graph_returns_cached_when_no_filters(tmp_path, fake_dataset_manager):
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()
    gexf_file = cache_dir / "dataset1.gexf"
    gexf_file.write_text("dummy")
    service = GraphService(str(cache_dir), fake_dataset_manager)
    result = service.get_graph("dataset1", None)
    assert result == str(gexf_file)

def test_get_graph_creates_new_graph_with_filters(tmp_path, fake_dataset_manager, monkeypatch):
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()
    monkeyatch_target = "recvizapi.GraphService.Graph"
    monkeypatch.setattr(monkeyatch_target, FakeGraph)
    service = GraphService(str(cache_dir), fake_dataset_manager)
    filters = {"age": ["30"]}
    result = service.get_graph("ds1", filters)
    assert isinstance(result, FakeGraph)

def test_compute_graph_key_with_filters():
    filters = {"age": ["30", "25"]}
    key = compute_graph_key("ds1", filters)
    assert key == "ds1_age:25,30"

def test_compute_graph_key_without_filters():
    key = compute_graph_key("ds1", None)
    assert key == "ds1"
