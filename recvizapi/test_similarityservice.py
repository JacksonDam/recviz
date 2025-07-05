import networkx as nx
from recvizapi.SimilarityService import SimilarityService

def test_overlap_coefficient():
    service = SimilarityService()
    result = service.overlap_coefficient([1, 2, 3], [2, 3, 4])
    assert result == 2 / 3

def test_sorenson_dice():
    service = SimilarityService()
    result = service.sorenson_dice([1, 2, 3], [2, 3, 4])
    assert result == 4 / 6

def test_jaccard():
    service = SimilarityService()
    result = service.jaccard([1, 2, 3], [2, 3, 4])
    assert result == 2 / 4

def test_list_cosine():
    service = SimilarityService()
    result = service.list_cosine([1, 2, 3], [2, 3, 4])
    assert round(result, 6) == round(2 / 3, 6)

def test_graph_edit_distance():
    service = SimilarityService()
    g1 = nx.Graph()
    g1.add_edges_from([(1, 2), (2, 3)])
    g2 = nx.Graph()
    g2.add_edges_from([(1, 2), (2, 3), (3, 4)])
    result = service.graph_edit_distance(g1, g2)
    assert result is not None

def test_simrank_similarity():
    service = SimilarityService()
    g = nx.Graph()
    g.add_edges_from([(1, 2), (2, 3), (3, 4)])
    result = service.simrank_similarity(g, 1, 3)
    assert result is not None