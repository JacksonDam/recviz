import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EventHandler from "../EventHandler";

let registeredEvents: Record<string, Function> = {};

const fakeRegisterEvents = vi.fn((events: Record<string, Function>) => {
  registeredEvents = events;
});

const fakeSetSettings = vi.fn();

const fakeGraph = {
  getNodeAttributes: vi.fn(),
  neighbors: vi.fn(),
  edge: vi.fn(),
  getEdgeAttribute: vi.fn(),
  extremities: vi.fn(),
};

const fakeSigma = {
  getGraph: () => fakeGraph,
};

vi.mock("@react-sigma/core", () => ({
  useRegisterEvents: () => fakeRegisterEvents,
  useSetSettings: () => fakeSetSettings,
  useSigma: () => fakeSigma,
}));

const setSelectedNode = vi.fn();
const setNodeAttributes = vi.fn();
const setInteractionHistory = vi.fn();

beforeEach(() => {
  registeredEvents = {};
  fakeRegisterEvents.mockClear();
  fakeSetSettings.mockClear();
  setSelectedNode.mockClear();
  setNodeAttributes.mockClear();
  setInteractionHistory.mockClear();
  fakeGraph.getNodeAttributes.mockReset();
  fakeGraph.neighbors.mockReset();
  fakeGraph.edge.mockReset();
  fakeGraph.getEdgeAttribute.mockReset();
  fakeGraph.extremities.mockReset();
});

describe("EventHandler", () => {
  it("registers clickStage and clickNode events on mount", () => {
    render(
      <EventHandler
        setSelectedNode={setSelectedNode}
        setNodeAttributes={setNodeAttributes}
        setInteractionHistory={setInteractionHistory}
      />
    );

    expect(fakeRegisterEvents).toHaveBeenCalledTimes(1);
    expect(typeof registeredEvents.clickStage).toBe("function");
    expect(typeof registeredEvents.clickNode).toBe("function");
  });

  it("handles clickNode event correctly", async () => {
    const nodeData = {
      label: "Should be excluded",
      type: "irrelevant",
      size: 10,
      x: 0,
      y: 0,
      color: "#000",
      user_id: "user123",
      interaction_history_str: "history data",
      extra: "extraValue",
    };

    fakeGraph.getNodeAttributes.mockReturnValue(nodeData);
    fakeGraph.neighbors.mockReturnValue(["n1", "n2"]);
    fakeGraph.edge.mockImplementation((source: string, target: string) => `${source}-${target}`);
    fakeGraph.getEdgeAttribute.mockImplementation((_edgeKey: string, attr: string) => {
      return attr === "color" ? "green" : undefined;
    });

    fakeGraph.extremities.mockImplementation((edge: string) => {
      if (edge === "node1-n1") {
        return ["node1", "n1"];
      }
      return ["nodeX", "nodeY"];
    });

    render(
      <EventHandler
        setSelectedNode={setSelectedNode}
        setNodeAttributes={setNodeAttributes}
        setInteractionHistory={setInteractionHistory}
      />
    );

    const clickNodeEvent = { node: "node1" };
    registeredEvents.clickNode(clickNodeEvent);

    await waitFor(() => {
      expect(setNodeAttributes).toHaveBeenCalledWith({
        user_id: "user123",
        interaction_history_str: "history data",
        extra: "extraValue",
      });
    });

    expect(setSelectedNode).toHaveBeenCalledWith("user123");
    expect(setInteractionHistory).toHaveBeenCalledWith("history data");

    expect(fakeSetSettings).toHaveBeenCalledTimes(1);
    const settingsArg = fakeSetSettings.mock.calls[0][0];
    expect(settingsArg).toHaveProperty("nodeReducer");
    expect(settingsArg).toHaveProperty("edgeReducer");
    expect(settingsArg).toHaveProperty("labelColor");

    const { nodeReducer, edgeReducer } = settingsArg;

    const clickedNodeData = { size: 5 };
    const updatedClickedNodeData = nodeReducer("node1", clickedNodeData);
    expect(updatedClickedNodeData.size).toBe(20);
    expect(updatedClickedNodeData.forceLabel).toBe(true);

    const neighborNodeData = { color: "blue" };
    const updatedNeighborData = nodeReducer("n1", neighborNodeData);
    expect(updatedNeighborData.color).toBe("orange");

    const otherNodeData = { color: "red", label: "Test", zIndex: 0 };
    const updatedOtherData = nodeReducer("other", otherNodeData);
    expect(updatedOtherData.color).toBe("#282828");
    expect(updatedOtherData.zIndex).toBe(-1);
    expect(updatedOtherData.label).toBeNull();

    const edgeData = { hidden: false };
    const updatedEdgeData = edgeReducer("node1-n1", edgeData);
    expect(updatedEdgeData.hidden).toBe(false);

    const updatedEdgeData2 = edgeReducer("nodeX-nodeY", edgeData);
    expect(updatedEdgeData2.hidden).toBe(true);
  });

  it("handles clickStage event correctly after a clickNode event", async () => {
    fakeGraph.getNodeAttributes.mockReturnValue({});

    render(
      <EventHandler
        setSelectedNode={setSelectedNode}
        setNodeAttributes={setNodeAttributes}
        setInteractionHistory={setInteractionHistory}
      />
    );

    registeredEvents.clickNode({ node: "node1" });
    registeredEvents.clickStage({});

    await waitFor(() => {
      expect(fakeSetSettings).toHaveBeenCalledTimes(2);
      const stageSettings = fakeSetSettings.mock.calls[1][0];
      expect(stageSettings).toHaveProperty("nodeReducer");
      expect(stageSettings).toHaveProperty("edgeReducer");
      expect(stageSettings).toHaveProperty("labelColor");
      expect(stageSettings).toHaveProperty("labelRenderedSizeThreshold");
    });
    expect(setNodeAttributes).toHaveBeenCalledWith({});
    expect(setSelectedNode).toHaveBeenCalledWith(null);
  });
});
