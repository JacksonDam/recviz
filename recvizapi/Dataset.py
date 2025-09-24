import os

class Dataset:
    def __init__(self, dataset_dir_path, inter_files, user_files, item_files, dataset_sub_dir, models):
        self.user_mapping = {}
        self.user_ids = None
        self.user_features = ["user_history_length"]
        self.item_features = []
        self.item_mapping = {}
        self.interaction_history = {}
        self.timestamps = None
        self.item_ids = None
        self.models = models
        self.dataset_name = dataset_sub_dir
        self.valid = False

        for user_file in user_files:
            self.load_user_features(os.path.join(dataset_dir_path, user_file))

        for item_file in item_files:
            self.load_item_features(os.path.join(dataset_dir_path, item_file))

        if self.user_mapping and self.item_mapping:
            self.user_ids = sorted(list(self.user_mapping.keys()))
            self.item_ids = sorted(list(self.item_mapping.keys()))

            for inter_file in inter_files:
                self.load_inter_file(os.path.join(dataset_dir_path, inter_file))

            if self.interaction_history and self.timestamps is not None:
                self.timestamps = sorted(list(self.timestamps))
                self.valid = True

    def load_user_features(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            field_names = f.readline().strip().split('\t')
            for idx, field_name in enumerate(field_names):
                self.user_features.append(field_name.split(':')[0])
            for line in f:
                fields = line.strip().split('\t')
                user_id = fields[0]
                for idx, field_name in enumerate(field_names):
                    if user_id not in self.user_mapping:
                        self.user_mapping[user_id] = {"user_history_length": 0, "interaction_history": []}
                    self.user_mapping[user_id][field_name.split(':')[0]] = fields[idx]

    def load_item_features(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            field_names = [field.split(':')[0] for field in f.readline().strip().split('\t')]
            self.item_features.extend(field_names)
            for line in f:
                fields = line.strip().split('\t')
                item_id = fields[0]
                self.item_mapping[item_id] = {
                    field_names[i]: fields[i] for i in range(len(fields))
                }

    def load_inter_file(self, file_path):
        self.timestamps = set()
        with open(file_path, 'r', encoding='utf-8') as f:
            field_names = [field.split(':')[0] for field in f.readline().strip().split('\t')]
            for line in f:
                fields = line.strip().split('\t')
                timestamp = fields[-1]
                if timestamp not in self.interaction_history:
                    self.interaction_history[timestamp] = []
                self.interaction_history[timestamp].append({field_names[i]: fields[i] for i in range(len(fields) - 1)})
                if field_names[0] == 'user_id' and fields[0] in self.user_ids:
                    self.user_mapping[fields[0]]["user_history_length"] += 1
                    self.user_mapping[fields[0]]["interaction_history"].append({field_names[i]: fields[i] for i in range(1, len(fields) - 1)})
                self.timestamps.add(timestamp)
        for user in self.user_mapping:
            if "interaction_history" in self.user_mapping[user]:
                self.user_mapping[user]["interaction_history_str"] = str(self.user_mapping[user]["interaction_history"])

    def get_user_ids(self):
        return self.user_ids

    def get_user_mapping(self):
        return self.user_mapping

    def get_user_features(self):
        return self.user_features

    def get_item_features(self):
        return self.item_features

    def get_features(self):
        return self.user_features + self.item_features

    def get_item_ids(self):
        return self.item_ids

    def get_item_mapping(self):
        return self.item_mapping

    def get_timestamps(self):
        return self.timestamps

    def get_interaction_history(self):
        return self.interaction_history

    def get_models(self):
        return self.models

    def get_dataset_name(self):
        return self.dataset_name

    def get_validity(self):
        return self.valid