import pytest
from recvizapi.RecommendationService import RecommendationService
from recvizapi.GraphService import compute_graph_key

class FakeTensor:
    def __init__(self, value):
        self.value = value
    def tolist(self):
        return self.value
    def cpu(self):
        return self.value if isinstance(self.value, list) else [self.value]

class FakeRecboleDataset:
    uid_field = "uid"
    iid_field = "iid"
    def token2id(self, field, tokens):
        if field == self.uid_field:
            return [int(token) for token in tokens]
        return tokens
    def id2token(self, field, ids):
        if field == self.iid_field:
            return [[str(i) for i in sublist] for sublist in ids]
        if field == self.uid_field:
            return [str(token) for token in ids]
        return ids

class FakeDatasetRec:
    def get_models(self):
        return {"model1": "model1.pth"}
    def get_item_mapping(self):
        return {"1": {"movie_title": "Test Movie"}}
    def get_user_ids(self):
        return ["1"]

class FakeDatasetManager:
    def get_dataset(self, ds_name):
        return {"dataset_obj": FakeDatasetRec()}

def fake_load_data_and_model(model_file):
    config = {"device": "cpu"}
    model = "fake_model"
    dataset = FakeRecboleDataset()
    train_data = "train"
    valid_data = "valid"
    test_data = "test"
    return config, model, dataset, train_data, valid_data, test_data

def fake_full_sort_topk(uid_series, model, test_data, k, device):
    topk_score = [FakeTensor([0.9, 0.8])]
    topk_iid_list = FakeTensor([[1, 2]])
    return topk_score, topk_iid_list

@pytest.fixture(autouse=True)
def monkeypatch_recbole(monkeypatch):
    monkeypatch.setattr("recvizapi.RecommendationService.load_data_and_model", fake_load_data_and_model)
    monkeypatch.setattr("recvizapi.RecommendationService.full_sort_topk", fake_full_sort_topk)

@pytest.fixture
def rec_service():
    dataset_manager = FakeDatasetManager()
    service = RecommendationService(dataset_manager)
    return service

def test_load_model_caches(rec_service):
    result1 = rec_service.load_model("ds1", "model1")
    result2 = rec_service.load_model("ds1", "model1")
    assert result1 is result2

def test_get_topk(rec_service):
    config, model, dataset, train_data, valid_data, test_data, ds_obj = rec_service.load_model("ds1", "model1")
    uid_series = dataset.token2id(dataset.uid_field, ds_obj.get_user_ids())
    recommendations = rec_service.get_topk(config, ds_obj, dataset, uid_series, model, test_data, 2)
    assert "user-1" in recommendations

def test_get_topk_all(rec_service):
    recs = rec_service.get_topk_all("ds1", "model1", 2)
    assert isinstance(recs, dict)
    assert "user-1" in recs

def test_get_topk_uid(rec_service):
    recs = rec_service.get_topk_uid("ds1", "model1", 2, "1")
    assert "user-1" in recs

def test_compute_graph_key_with_filters():
    filters = {"age": ["30", "25"]}
    key = compute_graph_key("ds1", filters)
    assert key == "ds1_age:25,30"

def test_compute_graph_key_without_filters():
    key = compute_graph_key("ds1", None)
    assert key == "ds1"
