/*eslint @typescript-eslint/no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
import React, {useEffect, useImperativeHandle, forwardRef} from "react";
import { useRegisterEvents, useSetSettings, useSigma } from "@react-sigma/core";

interface EventHandlerProps {
  setSelectedNode: (id: string | null) => void;
  setNodeAttributes: (attributes: Record<string, unknown>) => void;
  setInteractionHistory: (history: string | null) => void;
}

export interface EventHandlerHandle {
  resetSettings: () => void;
}

const excludedKeys = new Set(["label", "type", "size", "x", "y", "color"]);

const EventHandler = forwardRef<EventHandlerHandle, EventHandlerProps>(({ setSelectedNode, setNodeAttributes, setInteractionHistory }, ref) => {
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const setSettings = useSetSettings();
  let clickedStatus = false;

  const resetSettings = () => {
    setSettings({
      nodeReducer: (_, nodeData) => nodeData,
      edgeReducer: (_, edgeData) => edgeData,
      labelColor: { color: "#6c3cb8" },
      labelRenderedSizeThreshold: 6,
    });
  };

  useImperativeHandle(ref, () => ({
    resetSettings,
  }));

  useEffect(() => {
    registerEvents({
      clickStage: (_) => {
        if (clickedStatus) {
          resetSettings();
          setNodeAttributes({});
          setSelectedNode(null);
          clickedStatus = false;
        }
      },
      clickNode: (event) => {
        clickedStatus = true;
        const clicked = event.node;
        const nodeData = graph.getNodeAttributes(clicked);
        const filteredNodeData: Record<string, unknown> = {};

        for (const key in nodeData) {
          if (!excludedKeys.has(key)) {
            filteredNodeData[key] = nodeData[key];
          }
        }
        setNodeAttributes(filteredNodeData);

        if ("user_id" in nodeData) {
          setSelectedNode(nodeData["user_id"]);
        }

        if("interaction_history_str" in nodeData) {
          setInteractionHistory(nodeData["interaction_history_str"]);
        }

        const neighbors = new Set(graph.neighbors(clicked));
        const neighborEdgeColorMap = new Map<string, string>();
        neighbors.forEach((neighbor) => {
          const edgeKey = graph.edge(clicked, neighbor);
          if (edgeKey) {
            const color = graph.getEdgeAttribute(edgeKey, "color");
            neighborEdgeColorMap.set(neighbor, color);
          }
        });

        setSettings({
          nodeReducer: (node, nodeData) => {
            if (node === clicked) {
              return {
                ...nodeData,
                size: nodeData.size * 4,
                forceLabel: true,
              };
            }
            if (neighborEdgeColorMap.has(node)) {
              const color = neighborEdgeColorMap.get(node);
              return {
                ...nodeData,
                color: color === "green" ? "orange" : "green",
              };
            }
            return {
              ...nodeData,
              color: "#282828",
              zIndex: -1,
              label: null,
            };
          },

          edgeReducer: (edge, edgeData) => {
            const [source, target] = graph.extremities(edge);
            if (source === clicked || target === clicked) {
              return { ...edgeData };
            }
            return { ...edgeData, hidden: true };
          },
          labelColor: { color: "#ffffff" },
        });
      },
    });
  }, [registerEvents, setNodeAttributes, setSettings, graph, setSelectedNode]);

  return null;
});

export default React.memo(EventHandler);
