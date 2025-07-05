import networkx as nx
import numpy as np
class SimilarityService:
    def __init__(self):
        pass

    def overlap_coefficient(self, a, b):
        set_a = set(a)
        set_b = set(b)
        return len(set_a.intersection(set_b)) / min(len(set_a), len(set_b))

    def sorenson_dice(self, a, b):
        set_a = set(a)
        set_b = set(b)
        return (2 * len(set_a.intersection(set_b))) / (len(set_a) + len(set_b))

    def jaccard(self, a, b):
        set_a = set(a)
        set_b = set(b)
        return len(set_a.intersection(set_b)) / len(set_a.union(set_b))

    def list_cosine(self, a, b):
        ids = {}
        elements = set()

        for elt in a:
            elements.add(elt)
        for elt in b:
            elements.add(elt)

        for elt_id, elt in enumerate(elements):
            ids[elt] = elt_id

        sparse_vec_a = np.zeros(len(elements))
        sparse_vec_b = np.zeros(len(elements))

        for elt in a:
            sparse_vec_a[ids[elt]] += 1
        for elt in b:
            sparse_vec_b[ids[elt]] += 1

        return np.dot(sparse_vec_a, sparse_vec_b) / (np.linalg.norm(sparse_vec_a) * np.linalg.norm(sparse_vec_b))

    def graph_edit_distance(self, g1, g2):
        return nx.graph_edit_distance(g1, g2)

    def simrank_similarity(self, g, user1, user2):
        return nx.simrank_similarity(g, source=user1, target=user2)