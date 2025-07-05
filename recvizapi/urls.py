from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("get_available_datasets", views.get_available_datasets, name='get_available_datasets'),
    path("get_dataset_models/<slug:dataset_name>", views.get_dataset_models, name='get_dataset_models'),
    path("get_inter_graph/<slug:dataset_name>/", views.get_inter_graph, name='get_inter_graph'),
    path("get_louvain/<slug:dataset_name>/", views.get_louvain, name='get_louvain'),
    path("get_user_features/<slug:dataset_name>", views.get_user_features, name='get_user_features'),
    path("get_topk_all/<slug:dataset_name>/<slug:model_name>/<int:k>", views.get_topk_all, name='get_topk_all'),
    path("get_topk_uid/<slug:dataset_name>/<slug:model_name>/<int:k>/<int:uid>", views.get_topk_uid, name='get_topk_uid'),
    path("calculate_user_similarity_metrics/<slug:dataset_name>/<slug:model1>/<slug:model2>/<int:k>/<slug:uid1>/<slug:uid2>", views.calculate_user_similarity_metrics, name="calculate_user_similarity_metrics"),
    path("get_interaction_history_k/<slug:dataset_name>/<int:k>/<int:uid>", views.get_interaction_history_k, name="get_interaction_history_k"),
    path("get_user_interaction_graph_similarity_metrics/<slug:dataset_name>/<slug:uid1>/<slug:uid2>", views.get_user_interaction_graph_similarity_metrics, name="get_user_interaction_graph_similarity_metrics"),
]