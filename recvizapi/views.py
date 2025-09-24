import networkx as nx
from django.shortcuts import render
from django.http import JsonResponse, FileResponse
import os
from .DatasetManager import DatasetManager
from .GraphService import GraphService
from .RecommendationService import RecommendationService
from .SimilarityService import SimilarityService
import random
import numpy

if 'RECVIZ_DS_PATH' not in os.environ:
    raise EnvironmentError('Environment variable RECVIZ_DS_PATH is not set')

if "RECVIZ_CACHE_PATH" not in os.environ:
    raise EnvironmentError("Environment variable RECVIZ_CACHE_PATH is not set")

dataset_manager = DatasetManager()
recommendation_service = RecommendationService(dataset_manager)
graph_service = GraphService(os.environ['RECVIZ_CACHE_PATH'], dataset_manager)
similarity_service = SimilarityService()

def index(request):
    return render(request, "recexplainapp/index.html", {})

def get_inter_graph(request, dataset_name):
    filters = {}
    for key, values in request.GET.lists():
        filters[key] = values

    graph_obj = graph_service.get_graph(dataset_name, filters)
    gexf_path = None
    if graph_obj:
        if isinstance(graph_obj, str):
            gexf_path = graph_obj
        elif graph_obj.is_ready():
            gexf_path = graph_obj.get_gexf_path()
        if gexf_path is not None:
            response = FileResponse(open(gexf_path, "rb"), content_type="application/xml")
            response["Content-Disposition"] = "attachment; filename=inter_graph.gexf"
            return response
    return JsonResponse({"error": "Graph not found"}, status=404)

def get_louvain(request, dataset_name):
    filters = {}
    for key, values in request.GET.lists():
        filters[key] = values
    louvain_parts = graph_service.get_louvain(dataset_name, filters)
    return JsonResponse(louvain_parts)

def get_available_datasets(request):
    return JsonResponse({"datasets": dataset_manager.get_available_datasets()})

def get_dataset_models(request, dataset_name):
    model_dict = dataset_manager.get_available_models(dataset_name)
    if model_dict is not None:
        return JsonResponse({"models": list(model_dict.keys())})
    else:
        return JsonResponse({"models": []})

def get_features(request, dataset_name):
    dsm_entry = dataset_manager.get_dataset(dataset_name)
    if dsm_entry and dsm_entry["dataset_obj"].get_validity():
        dataset_obj = dsm_entry["dataset_obj"]
        return JsonResponse({"fields": dataset_obj.get_features()})

def get_item_mapping(request, dataset_name):
    dsm_entry = dataset_manager.get_dataset(dataset_name)
    if dsm_entry and dsm_entry["dataset_obj"].get_validity():
        dataset_obj = dsm_entry["dataset_obj"]
        return JsonResponse({"fields": dataset_obj.get_user_features()})

def get_interaction_history_k(request, dataset_name, k, uid):
    dsm_entry = dataset_manager.get_dataset(dataset_name)
    result = []
    if dsm_entry and dsm_entry["dataset_obj"].get_validity():
        dataset_obj = dsm_entry["dataset_obj"]
        user_mapping = dataset_obj.get_user_mapping()
        item_mapping = dataset_obj.get_item_mapping()
        uid = str(uid)
        if uid in user_mapping:
            user = user_mapping[uid]
            if "interaction_history" in user:
                if len(user["interaction_history"]) >= k:
                    for elt in user["interaction_history"][-k:]:
                        result.append(item_mapping.get(elt["item_id"], {}).get("movie_title", f"Unknown ID {elt["item_id"]}"))
    return JsonResponse({"result": result})

def get_topk_all(request, dataset_name, model_name, k):
    return JsonResponse(recommendation_service.get_topk_all(dataset_name, model_name + ".pth", k))

def get_topk_uid(request, dataset_name, model_name, k, uid):
    return JsonResponse(recommendation_service.get_topk_uid(dataset_name, model_name + ".pth", k, uid))

def calculate_user_similarity_metrics(request, dataset_name, model1, model2, k, uid1, uid2):
    recs_1 = recommendation_service.get_topk_uid(dataset_name, model1 + ".pth", k, uid1)
    recs_2 = recommendation_service.get_topk_uid(dataset_name, model2 + ".pth", k, uid2)
    user_id_1, preds_1 = next(iter(recs_1.items()))
    user_id_2, preds_2 = next(iter(recs_2.items()))
    user1_recs = [title for title, item_id, rating in preds_1]
    user2_recs = [title for title, item_id, rating in preds_2]
    user1_rec_ids = [str(item_id).split('-')[-1] for title, item_id, rating in preds_1]
    user2_rec_ids = [str(item_id).split('-')[-1] for title, item_id, rating in preds_2]
    user1_history = None
    user1_history_ids = None
    user2_history = None
    user2_history_ids = None
    dsm_entry = dataset_manager.get_dataset(dataset_name)
    if dsm_entry and dsm_entry["dataset_obj"].get_validity():
        dataset_obj = dsm_entry["dataset_obj"]
        user_mapping = dataset_obj.get_user_mapping()

        if uid1 in user_mapping and uid2 in user_mapping:
            user1_history = [str(elt) for elt in user_mapping[uid1]["interaction_history"]]
            user1_history_ids = [str(elt['item_id']) for elt in user_mapping[uid1]["interaction_history"]]
            user2_history = [str(elt) for elt in user_mapping[uid2]["interaction_history"]]
            user2_history_ids = [str(elt['item_id']) for elt in user_mapping[uid2]["interaction_history"]]

    if user1_history and user2_history:
        results = {
            "overlap_recs": similarity_service.overlap_coefficient(user1_recs, user2_recs),
            "sorenson_recs": similarity_service.sorenson_dice(user1_recs, user2_recs),
            "jaccard_recs": similarity_service.jaccard(user1_recs, user2_recs),
            "cosine_recs": similarity_service.list_cosine(user1_recs, user2_recs),
            "overlap_hist": similarity_service.overlap_coefficient(user1_history, user2_history),
            "sorenson_hist": similarity_service.sorenson_dice(user1_history, user2_history),
            "jaccard_hist": similarity_service.jaccard(user1_history, user2_history),
            "cosine_hist": similarity_service.list_cosine(user1_history, user2_history),
            "overlap_rh1": similarity_service.overlap_coefficient(user1_history_ids, user1_rec_ids),
            "sorenson_rh1": similarity_service.sorenson_dice(user1_history_ids, user1_rec_ids),
            "jaccard_rh1": similarity_service.jaccard(user1_history_ids, user1_rec_ids),
            "cosine_rh1": similarity_service.list_cosine(user1_history_ids, user1_rec_ids),
            "overlap_rh2": similarity_service.overlap_coefficient(user2_history_ids, user2_rec_ids),
            "sorenson_rh2": similarity_service.sorenson_dice(user2_history_ids, user2_rec_ids),
            "jaccard_rh2": similarity_service.jaccard(user2_history_ids, user2_rec_ids),
            "cosine_rh2": similarity_service.list_cosine(user2_history_ids, user2_rec_ids),
            "overlap_rg1": similarity_service.overlap_coefficient(user1_history_ids[-k:], user1_rec_ids),
            "sorenson_rg1": similarity_service.sorenson_dice(user1_history_ids[-k:], user1_rec_ids),
            "jaccard_rg1": similarity_service.jaccard(user1_history_ids[-k:], user1_rec_ids),
            "cosine_rg1": similarity_service.list_cosine(user1_history_ids[-k:], user1_rec_ids),
            "overlap_rg2": similarity_service.overlap_coefficient(user2_history_ids[-k:], user2_rec_ids),
            "sorenson_rg2": similarity_service.sorenson_dice(user2_history_ids[-k:], user2_rec_ids),
            "jaccard_rg2": similarity_service.jaccard(user2_history_ids[-k:], user2_rec_ids),
            "cosine_rg2": similarity_service.list_cosine(user2_history_ids[-k:], user2_rec_ids),
        }
        return JsonResponse(results)
    else:
        return JsonResponse({})

def get_user_interaction_history(dataset_name, uid):
    dsm_entry = dataset_manager.get_dataset(dataset_name)
    result = []
    if dsm_entry and dsm_entry["dataset_obj"].get_validity():
        dataset_obj = dsm_entry["dataset_obj"]
        user_mapping = dataset_obj.get_user_mapping()
        item_mapping = dataset_obj.get_item_mapping()
        uid = str(uid)
        if uid in user_mapping:
            user = user_mapping[uid]
            if "interaction_history" in user:
                for elt in user["interaction_history"]:
                    result.append(item_mapping.get(elt["item_id"], {}).get("movie_title", f"Unknown ID {elt["item_id"]}"))
    return result

# def get_user_edit_distance(dataset_name, history1, uid1, history2, uid2):
#     G1 = nx.Graph()
#     user_node = f"user_{uid1}"
#     G1.add_node(user_node, type="user")
#     for interacted in history1:
#         if not G1.has_node(interacted):
#             G1.add_node(interacted, type="item")
#         G1.add_edge(user_node, interacted)
#
#     G2 = nx.Graph()
#     user_node = f"user_{uid2}"
#     G2.add_node(user_node, type="user")
#     for interacted in history2:
#         if not G2.has_node(interacted):
#             G2.add_node(interacted, type="item")
#         G2.add_edge(user_node, interacted)
#
#     paths, ged = nx.optimal_edit_paths(G1, G2)
#
#     return ged

def get_user_panther_similarity(dataset_name, history1, uid1, history2, uid2):
    G = nx.Graph()

    user1_node = f"user_{uid1}"
    user2_node = f"user_{uid2}"
    G.add_node(user1_node, type="user")
    G.add_node(user2_node, type="user")

    for interacted in history1:
        if not G.has_node(interacted):
            G.add_node(interacted, type="item")
        G.add_edge(user1_node, interacted)

    for interacted in history2:
        if not G.has_node(interacted):
            G.add_node(interacted, type="item")
        G.add_edge(user2_node, interacted)

    k_val = len(G.nodes()) - 1
    random.seed(42)
    numpy.random.seed(42)
    sim_dict = nx.panther_similarity(G, user1_node, k=k_val)

    similarity_score = sim_dict.get(user2_node, 0.0)
    return similarity_score

def get_user_interaction_graph_similarity_metrics(request, dataset_name, uid1, uid2):
    history1 = get_user_interaction_history(dataset_name, uid1)
    history2 = get_user_interaction_history(dataset_name, uid2)

    if not history1:
        return JsonResponse({"error": "Missing/empty interaction history for uid1"})
    elif not history2:
        return JsonResponse({"error": "Missing/empty interaction history for uid2"})

    return JsonResponse(
        {
            "panther_similarity": get_user_panther_similarity(dataset_name, history1, uid1, history2, uid2),
        }
    )