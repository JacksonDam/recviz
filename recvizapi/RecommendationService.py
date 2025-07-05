from recbole.quick_start import load_data_and_model
from recbole.utils.case_study import full_sort_topk

class RecommendationService:
    def __init__(self, dataset_manager):
        self.dataset_manager = dataset_manager
        self._model_cache = {}

    def load_model(self, dataset_name, model_name):
        key = (dataset_name, model_name)
        if key in self._model_cache:
            return self._model_cache[key]

        dsm_entry = self.dataset_manager.get_dataset(dataset_name)
        if dsm_entry is not None and 'dataset_obj' in dsm_entry:
            ds_obj = dsm_entry['dataset_obj']
            models = ds_obj.get_models()
            if model_name in models:
                config, model, dataset, train_data, valid_data, test_data = load_data_and_model(
                    model_file=models[model_name]
                )
                result = (config, model, dataset, train_data, valid_data, test_data, ds_obj)
                self._model_cache[key] = result
                return result

    def get_topk(self, config, ds_obj, dataset, uid_series, model, test_data, k):
        topk_score, topk_iid_list = full_sort_topk(uid_series, model, test_data, k=k, device=config['device'])
        external_item_list = dataset.id2token(dataset.iid_field, topk_iid_list.cpu())
        recommendations = {}
        item_mapping = ds_obj.get_item_mapping()
        for idx, uid in enumerate(uid_series):
            item_score_pair = list(zip(external_item_list[idx], topk_score[idx].tolist()))
            item_score_pair = [
                [
                    item_mapping.get(str(pair[0]), {}).get("movie_title", f"Unknown ID {pair[0]}"),
                    f'item-{pair[0]}',
                    pair[1]
                ]
                for pair in item_score_pair
            ]
            item_score_pair.sort(key=lambda x: x[2], reverse=True)
            recommendations[f'user-{dataset.id2token(dataset.uid_field, [uid])[0]}'] = item_score_pair
        return recommendations

    def get_topk_all(self, dataset_name, model_name, k):
        config, model, dataset, train_data, valid_data, test_data, ds_obj = self.load_model(dataset_name, model_name)
        uid_series = dataset.token2id(dataset.uid_field, ds_obj.get_user_ids())
        return self.get_topk(config, ds_obj, dataset, uid_series, model, test_data, k)

    def get_topk_uid(self, dataset_name, model_name, k, uid):
        config, model, dataset, train_data, valid_data, test_data, ds_obj = self.load_model(dataset_name, model_name)
        uid_series = dataset.token2id(dataset.uid_field, [str(uid)])
        return self.get_topk(config, ds_obj, dataset, uid_series, model, test_data, k)
