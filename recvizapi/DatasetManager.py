import os
from recvizapi.Dataset import Dataset

class DatasetManager:
    def __init__(self):
        dataset_path = os.environ['RECVIZ_DS_PATH']
        self.datasets = {}
        for dataset_sub_dir in os.listdir(dataset_path):
            dataset_dir_path = os.path.join(dataset_path, dataset_sub_dir)
            if os.path.isdir(dataset_dir_path):
                atomic_files = os.listdir(dataset_dir_path)
                inter_files = []
                user_files = []
                item_files = []
                models = {}
                for artifact in atomic_files:
                    if artifact.endswith('.inter'):
                        inter_files.append(artifact)
                    elif artifact.endswith('.user'):
                        user_files.append(artifact)
                    elif artifact.endswith('.item'):
                        item_files.append(artifact)
                    elif artifact == "models":
                        model_dir = os.path.join(dataset_path, dataset_sub_dir, artifact)
                        if os.path.isdir(model_dir):
                            for model_file in os.listdir(model_dir):
                                if model_file.endswith('.pth'):
                                    models[model_file] = os.path.join(model_dir, model_file)

                if user_files and item_files:
                    loaded_ds = Dataset(dataset_dir_path,
                                        inter_files,
                                        user_files,
                                        item_files,
                                        dataset_sub_dir,
                                        models)
                    if loaded_ds.get_validity():
                        self.datasets[dataset_sub_dir] = {"dataset_obj": loaded_ds, "models": models}

        print("VALID LOADED DATASETS: ", self.datasets)

    def get_available_datasets(self):
        return list(self.datasets.keys())

    def get_dataset(self, ds_name):
        if ds_name in self.datasets:
            return self.datasets[ds_name]

    def get_available_models(self, ds_name):
        ds_entry = self.get_dataset(ds_name)
        if ds_entry is not None and "dataset_obj" in ds_entry:
            ds_obj = ds_entry["dataset_obj"]
            return ds_obj.get_models()