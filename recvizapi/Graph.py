import os
import networkx as nx

use_gpu_layout = True

try:
    import cugraph as cu
except ImportError:
    print("cuGraph is unavailable, will fall back to CPU graph layout.")
    use_gpu_layout = False

class Graph:
    def __init__(self, dataset_name, filters, cache_dir, graph_key, dataset_manager, skip_write=False):
        self.dataset_name = dataset_name
        self.dataset_manager = dataset_manager
        self.user_nodes = {}
        self.item_nodes = {}
        self.nx_graph = None
        self.gexf_path = None
        self.filters = filters
        self.cache_dir = cache_dir
        self.graph_key = graph_key
        self.ds_obj = None
        self.ready = False
        self.prepare_nodes()
        self.assemble_graph()
        self.layout_graph()
        if not skip_write:
            self.write_gexf()

    def prepare_nodes(self):
        self.ds_obj = self.dataset_manager.get_dataset(self.dataset_name)["dataset_obj"]
        if self.ds_obj is not None:
            user_mapping = self.ds_obj.get_user_mapping()
            for user_id in user_mapping:
                self.user_nodes[user_id] = user_mapping[user_id]
                self.user_nodes[user_id]['id'] = f"user-{user_id}"
                self.user_nodes[user_id]['label'] = f"User {user_id}"
                self.user_nodes[user_id]['type'] = "circle"
                self.user_nodes[user_id]['x'] = 1
                self.user_nodes[user_id]['y'] = 1
                self.user_nodes[user_id]['size'] = 2

            item_mapping = self.ds_obj.get_item_mapping()
            for item_id in item_mapping:
                self.item_nodes[item_id] = item_mapping[item_id]
                self.item_nodes[item_id]['id'] = f"item-{item_id}"
                self.item_nodes[item_id]['label'] = f"Item {item_id}"
                self.item_nodes[item_id]['x'] = 1
                self.item_nodes[item_id]['y'] = 1
                self.item_nodes[item_id]['size'] = 2
                self.item_nodes[item_id]['type'] = "square"

    def assemble_graph(self):
        self.nx_graph = nx.Graph()
        timestamps = self.ds_obj.get_timestamps()
        interaction_history = self.ds_obj.get_interaction_history()
        if self.filters:
            users_to_include = set()
            items_to_include = set()
            print("WOW", self.filters)
            for filter_feature, filter_queries in self.filters.items():
                for filter_query in filter_queries:
                    if "-" in filter_query:
                        try:
                            num1_str, num2_str = filter_query.split("-")
                            num1 = int(num1_str)
                            num2 = int(num2_str)
                        except (TypeError, ValueError):
                            continue
                        for user_id in self.user_nodes:
                            user = self.user_nodes[user_id]
                            if filter_feature in user and num1 <= int(user[filter_feature]) <= num2:
                                user["filter_feature"] = filter_feature
                                user["filter_query"] = filter_query
                                users_to_include.add(user_id)
                                self.nx_graph.add_node(user["id"], **user)
                        for item_id in self.item_nodes:
                            item = self.item_nodes[item_id]
                            if filter_feature in item and num1 <= int(item[filter_feature]) <= num2:
                                item["filter_feature"] = filter_feature
                                item["filter_query"] = filter_query
                                items_to_include.add(item_id)
                                self.nx_graph.add_node(item["id"], **item)
                    else:
                        for user_id in self.user_nodes:
                            user = self.user_nodes[user_id]
                            if filter_feature in user and str(user[filter_feature]) == filter_query:
                                user["filter_feature"] = filter_feature
                                user["filter_query"] = filter_query
                                users_to_include.add(user_id)
                                self.nx_graph.add_node(user["id"], **user)
                        for item_id in self.item_nodes:
                            item = self.item_nodes[item_id]
                            print("WOAH", item, item_id)
                            if filter_feature in item and str(item[filter_feature]) == filter_query:
                                item["filter_feature"] = filter_feature
                                item["filter_query"] = filter_query
                                items_to_include.add(item_id)

            for timestamp in timestamps:
                print(users_to_include, items_to_include, "POW")
                ts_interactions = interaction_history[timestamp]
                print(ts_interactions, "CROW")
                for interaction in ts_interactions:
                    if "user_id" in interaction and "item_id" in interaction and interaction["user_id"] in users_to_include and (interaction["item_id"] in items_to_include or not items_to_include):
                        item = self.item_nodes[interaction["item_id"]]
                        item_node_id = item["id"]
                        self.nx_graph.add_node(item_node_id, **item)
                        user_node_id = self.user_nodes[interaction["user_id"]]["id"]
                        if self.nx_graph.has_edge(user_node_id, item_node_id):
                            self.nx_graph.add_edge(user_node_id, item_node_id,
                                                   self.nx_graph[user_node_id][item_node_id]['weight'] + 1)
                        self.nx_graph.add_edge(user_node_id, item_node_id, weight=1)
        else:
            for user_id in self.user_nodes:
                node_attributes = self.user_nodes[user_id]
                self.nx_graph.add_node(node_attributes["id"], **node_attributes)

            for item_id in self.item_nodes:
                node_attributes = self.item_nodes[item_id]
                self.nx_graph.add_node(node_attributes["id"], **node_attributes)

            for timestamp in timestamps:
                ts_interactions = interaction_history[timestamp]
                for interaction in ts_interactions:
                    if "user_id" in interaction and "item_id" in interaction:
                        item = self.item_nodes[interaction["item_id"]]
                        item_node_id = item["id"]
                        user_node_id = self.user_nodes[interaction["user_id"]]["id"]
                        if self.nx_graph.has_edge(user_node_id, item_node_id):
                            self.nx_graph.add_edge(user_node_id, item_node_id,
                                                   self.nx_graph[user_node_id][item_node_id]['weight'] + 1)
                        self.nx_graph.add_edge(user_node_id, item_node_id, weight=1)

        print("ASSEMBLED NX GRAPH WITH", self.nx_graph.number_of_nodes(), "NODES", self.nx_graph.number_of_edges(), "EDGES")

    def layout_graph(self):
        if self.nx_graph is not None:
            initial_positions = nx.circular_layout(self.nx_graph)
            for node, pos in initial_positions.items():
                self.nx_graph.nodes[node]["x"] = pos[0]
                self.nx_graph.nodes[node]["y"] = pos[1]

            if use_gpu_layout:
                fa2_positions = cu.force_atlas2(self.nx_graph, gravity=10, max_iter=1500, outbound_attraction_distribution=False)
                fa2_pos_dict = {
                    row["vertex"]: [row["x"], row["y"]]
                    for row in fa2_positions.to_dict(orient="records")
                }
            else:
                fa2_pos_dict = nx.forceatlas2_layout(self.nx_graph, gravity=10, max_iter=1500)

            for node, pos in fa2_pos_dict.items():
                self.nx_graph.nodes[node]["x"] = pos[0]
                self.nx_graph.nodes[node]["y"] = pos[1]

    def get_louvain_parts(self):
        if self.nx_graph is not None:
            ret_parts = {}
            if use_gpu_layout:
                parts = cu.louvain(nx.convert_node_labels_to_integers(self.nx_graph))[0]
                for index, node_label in enumerate(self.nx_graph.nodes):
                    if "user" in node_label:
                        ret_parts[node_label] = parts[index]
            else:
                parts = nx.community.louvain_communities(self.nx_graph)
                for idx, label_set in enumerate(parts):
                    for label in label_set:
                        if "user" in label:
                            ret_parts[label] = idx
            return ret_parts

    def write_gexf(self):
        self.gexf_path = os.path.join(self.cache_dir, self.graph_key + ".gexf")
        for node in self.nx_graph.nodes:
            if "interaction_history" in self.nx_graph.nodes[node]:
                del self.nx_graph.nodes[node]["interaction_history"]
        nx.write_gexf(self.nx_graph, self.gexf_path)
        print("WROTE GEXF", self.graph_key + ".gexf")
        self.ready = True

    def get_gexf_path(self):
        return self.gexf_path

    def is_ready(self):
        return self.ready