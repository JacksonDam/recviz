import pytest
from recvizapi.DatasetManager import DatasetManager

class FakeDataset:
    def __init__(self, dataset_dir_path, inter_files, user_files, item_files, dataset_sub_dir, models):
        self.dataset_dir_path = dataset_dir_path
        self.inter_files = inter_files
        self.user_files = user_files
        self.item_files = item_files
        self.dataset_sub_dir = dataset_sub_dir
        self.models = models

    def get_validity(self):
        return True

    def get_models(self):
        return {"fake_model": "fake_path"}

@pytest.fixture
def dataset_env(tmp_path, monkeypatch):
    ds_dir = tmp_path / "ds1"
    ds_dir.mkdir()
    (ds_dir / "test.user").write_text("user")
    (ds_dir / "test.item").write_text("item")
    monkeypatch.setenv("RECVIZ_DS_PATH", str(tmp_path))
    import recvizapi.DatasetManager
    monkeypatch.setattr(recvizapi.DatasetManager, "Dataset", FakeDataset)
    return tmp_path

def test_get_available_datasets(dataset_env):
    dm = DatasetManager()
    assert dm.get_available_datasets() == ["ds1"]

def test_get_dataset(dataset_env):
    dm = DatasetManager()
    ds = dm.get_dataset("ds1")
    assert ds is not None

def test_get_available_models(dataset_env):
    dm = DatasetManager()
    models = dm.get_available_models("ds1")
    assert models == {"fake_model": "fake_path"}

def test_get_dataset_nonexistent(dataset_env):
    dm = DatasetManager()
    ds = dm.get_dataset("nonexistent")
    assert ds is None