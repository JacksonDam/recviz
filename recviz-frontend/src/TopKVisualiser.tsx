import React, { useState, useEffect } from "react";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import { NodeSquareProgram } from "@sigma/node-square";
import Graph from "graphology";
import "@react-sigma/core/lib/react-sigma.min.css";
import { Slider, Typography } from "@mui/material";

interface TopKVisualiserProps {
  dataset: string;
  model1: string;
  model2: string;
  k: number;
  setK: (k: number) => void;
  user1: string;
  user2: string;
}

const LoadGraph: React.FC<{ graph: Graph | null }> = ({ graph }) => {
  const loadGraph = useLoadGraph();
  useEffect(() => {
    if (graph) loadGraph(graph);
  }, [graph, loadGraph]);
  return null;
};

export const TopKVisualiser: React.FC<TopKVisualiserProps> = React.memo(
  ({ dataset, model1, model2, k, setK, user1, user2 }) => {
    const [graph, setGraph] = useState<Graph | null>(null);

    useEffect(() => {
      if (!dataset || !model1 || !model2 || !user1 || !user2) return;

      const fetchUser1 = fetch(
        `http://localhost:8000/recvizapi/get_topk_uid/${dataset}/${model1}/${k}/${user1}`
      ).then((response) => response.json());
      const fetchUser2 = fetch(
        `http://localhost:8000/recvizapi/get_topk_uid/${dataset}/${model2}/${k}/${user2}`
      ).then((response) => response.json());

      const fetchInteractionHistory1 = fetch(
        `http://localhost:8000/recvizapi/get_interaction_history_k/${dataset}/${k}/${user1}`
      ).then((response) => response.json());
      const fetchInteractionHistory2 = fetch(
        `http://localhost:8000/recvizapi/get_interaction_history_k/${dataset}/${k}/${user2}`
      ).then((response) => response.json());

      Promise.all([
        fetchUser1,
        fetchUser2,
        fetchInteractionHistory1,
        fetchInteractionHistory2,
      ])
        .then(([data1, data2, dataInt1, dataInt2]) => {
          const user1Key = Object.keys(data1)[0];
          const user2Key = Object.keys(data2)[0];
          const recommendations1: [string, string, number][] =
            data1[user1Key] || [];
          const recommendations2: [string, string, number][] =
            data2[user2Key] || [];
          const interactionHistory1 = dataInt1["result"] || [];
          const interactionHistory2 = dataInt2["result"] || [];

          const newGraph = new Graph();
          const xLeft = -500;
          const xRight = 500;
          const startY = 0;
          const spacingY = 50 * (window.innerHeight / window.innerWidth);

          recommendations1.forEach((rec, index) => {
            const [itemName, itemId, score] = rec;
            newGraph.addNode(`user1-${index}`, {
              label: `${itemName} (${itemId}, ${parseFloat(score.toPrecision(6))})`,
              x: xLeft,
              y: startY - index * spacingY,
              color: "green",
              size: 10,
              type: "square",
              itemName,
            });
          });

          recommendations2.forEach((rec, index) => {
            const [itemName, itemId, score] = rec;
            newGraph.addNode(`user2-${index}`, {
              label: `${itemName} (${itemId}, ${parseFloat(score.toPrecision(6))})`,
              x: xRight,
              y: startY - index * spacingY,
              color: "green",
              size: 10,
              type: "square",
              itemName,
            });
          });

          recommendations1.forEach((rec1, i) => {
            const itemName1 = rec1[0];
            recommendations2.forEach((rec2, j) => {
              const itemName2 = rec2[0];
              if (itemName1 === itemName2) {
                newGraph.addEdge(`user1-${i}`, `user2-${j}`);
              }
            });
          });

          if (
            interactionHistory1 &&
            interactionHistory2 &&
            interactionHistory1.length > 0 &&
            interactionHistory2.length > 0
          ) {
            const xLeftInteraction = xLeft - 600;
            interactionHistory1.forEach((itemName, index) => {
              newGraph.addNode(`interaction-user1-${index}`, {
                label: itemName,
                x: xLeftInteraction,
                y: startY - index * spacingY,
                color: "blue",
                size: 10,
                type: "square",
                itemName,
              });
            });

            const xRightInteraction = xRight + 600;
            interactionHistory2.forEach((itemName, index) => {
              newGraph.addNode(`interaction-user2-${index}`, {
                label: itemName,
                x: xRightInteraction,
                y: startY - index * spacingY,
                color: "blue",
                size: 10,
                type: "square",
                itemName,
              });
            });

            recommendations1.forEach((rec, i) => {
              const [itemName] = rec;
              interactionHistory1.forEach((intItemName) => {
                if (itemName.includes(intItemName)) {
                  newGraph.addEdge(`interaction-user1-${interactionHistory1.indexOf(intItemName)}`, `user1-${i}`);
                }
              });
            });

            recommendations2.forEach((rec, i) => {
              const [itemName] = rec;
              interactionHistory2.forEach((intItemName) => {
                if (itemName.includes(intItemName)) {
                  newGraph.addEdge(`user2-${i}`, `interaction-user2-${interactionHistory2.indexOf(intItemName)}`);
                }
              });
            });
          }

          setGraph(newGraph);
        })
        .catch((error) =>
          console.error("Error fetching recommendations or interaction history:", error)
        );
    }, [dataset, model1, model2, k, user1, user2]);

    return (
      <>
        <div style={{ width: "25vw", marginLeft: "8px" }}>
          <Typography variant="h5">k = {k}</Typography>
          <Slider
            value={k}
            onChange={(_, newValue) => setK(newValue)}
            step={1}
            marks
            min={1}
            max={50}
            valueLabelDisplay="auto"
          />
        </div>
        <SigmaContainer
          style={{ background: "transparent", height: "60vh" }}
          settings={{
            defaultNodeColor: "green",
            nodeProgramClasses: { square: NodeSquareProgram },
            renderLabels: true,
            labelDensity: 999,
            minCameraRatio: 0.1,
            maxCameraRatio: 1,
            labelThreshold: 0,
            labelFont: "Roboto",
            labelColor: { color: "white" },
            defaultLabelSize: 14,
          }}
        >
          <LoadGraph graph={graph} />
        </SigmaContainer>
      </>
    );
  }
);

export default TopKVisualiser;
