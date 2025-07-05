import pytest

from recvizapi.Dataset import Dataset

@pytest.fixture
def temp_dataset_dir(tmp_path):
    user_file = tmp_path / "users.txt"
    item_file = tmp_path / "items.txt"
    inter_file = tmp_path / "interactions.txt"

    user_file.write_text("user_id\tage:age\n1\t25\n", encoding='utf-8')
    item_file.write_text("item_id\ttype:type\nitem1\tbook\n", encoding='utf-8')
    inter_file.write_text("user_id\titem_id\ttimestamp:ts\n1\titem1\t1743179400\n", encoding='utf-8')

    return {
        "dataset_dir": tmp_path,
        "user_files": [user_file.name],
        "item_files": [item_file.name],
        "inter_files": [inter_file.name]
    }

@pytest.fixture
def dataset_instance(temp_dataset_dir):
    dataset_dir = str(temp_dataset_dir["dataset_dir"])
    user_files = temp_dataset_dir["user_files"]
    item_files = temp_dataset_dir["item_files"]
    inter_files = temp_dataset_dir["inter_files"]
    dataset_sub_dir = "test_dataset"
    models = []

    ds = Dataset(dataset_dir, inter_files, user_files, item_files, dataset_sub_dir, models)
    return ds

def test_validity(dataset_instance):
    assert dataset_instance.get_validity() is True

def test_user_ids(dataset_instance):
    assert dataset_instance.get_user_ids() == ['1']

def test_user_mapping_contains_user(dataset_instance):
    assert '1' in dataset_instance.get_user_mapping()

def test_user_history_length(dataset_instance):
    user_mapping = dataset_instance.get_user_mapping()
    assert user_mapping['1']["user_history_length"] == 1

def test_user_interaction_history_length(dataset_instance):
    user_mapping = dataset_instance.get_user_mapping()
    assert len(user_mapping['1']["interaction_history"]) == 1

def test_user_features_contains_default(dataset_instance):
    assert "user_history_length" in dataset_instance.get_user_features()

def test_user_features_contains_age(dataset_instance):
    assert "age" in dataset_instance.get_user_features()

def test_item_ids(dataset_instance):
    assert dataset_instance.get_item_ids() == ['item1']

def test_item_mapping_contains_item(dataset_instance):
    assert 'item1' in dataset_instance.get_item_mapping()

def test_item_mapping_feature(dataset_instance):
    item_mapping = dataset_instance.get_item_mapping()
    assert item_mapping['item1']["type"] == "book"

def test_interaction_history_contains_timestamp(dataset_instance):
    assert "1743179400" in dataset_instance.get_interaction_history()

def test_timestamps(dataset_instance):
    assert dataset_instance.get_timestamps() == ["1743179400"]

def test_dataset_name(dataset_instance):
    assert dataset_instance.get_dataset_name() == "test_dataset"

def test_models(dataset_instance):
    assert dataset_instance.get_models() == []
