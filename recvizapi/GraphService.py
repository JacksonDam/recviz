import os
from recvizapi.Graph import Graph

def compute_graph_key(dataset_name, filters=None):
    if filters is None:
        return dataset_name
    parts = []
    for key in sorted(filters.keys()):
        values = filters[key]
        sorted_values = sorted(values)
        parts.append(f"{key}:{','.join(sorted_values)}")
    filters_str = "_".join(parts)
    return f"{dataset_name}_{filters_str}"

class GraphService:
    def __init__(self, cache_path, dataset_manager):
        if not os.path.exists(cache_path):
            raise EnvironmentError('Path read from RECVIZ_CACHE_PATH is invalid!')
        self.cached = {}
        self.cache_dir = cache_path
        self.dataset_manager = dataset_manager
        for file in os.listdir(self.cache_dir):
            if file.endswith('.gexf'):
                self.cached[file[:-5]] = os.path.join(self.cache_dir, file)
        print("CACHE:", self.cached)

    def get_graph(self, dataset_name, filters=None):
        if filters is None and dataset_name in self.cached:
            return self.cached[dataset_name]
        else:
            graph_key = compute_graph_key(dataset_name, filters)
            if graph_key in self.cached:
                return self.cached[graph_key]
            else:
                new_graph = Graph(dataset_name, filters, self.cache_dir, graph_key, self.dataset_manager)
                self.cached[graph_key] = new_graph
                return new_graph

    def get_louvain(self, dataset_name, filters=None):
        if filters is None and dataset_name + "_louvain" in self.cached:
            return self.cached[dataset_name + "_louvain"]
        else:
            graph_key = compute_graph_key(dataset_name, filters)
            if graph_key + "_louvain" not in self.cached:
                new_graph = Graph(dataset_name, filters, self.cache_dir, graph_key, self.dataset_manager, skip_write=True)
                self.cached[graph_key + "_louvain"] = new_graph.get_louvain_parts()
            return self.cached[graph_key + "_louvain"]