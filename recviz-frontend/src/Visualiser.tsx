import React, { useRef, useState, useEffect, useCallback } from 'react';
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Zoom from '@mui/material/Zoom';
import { TransitionProps } from '@mui/material/transitions';
import {SigmaContainer, useLoadGraph, SearchControl} from "@react-sigma/core";
import { NodeSquareProgram } from "@sigma/node-square";
import "@react-sigma/core/lib/react-sigma.min.css";
import Graph from "graphology";
import { parse } from "graphology-gexf/browser";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControlLabel,
  Switch
} from "@mui/material";
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import Collapse from '@mui/material/Collapse';
import { TransitionGroup } from 'react-transition-group';
import AttributeList from "./AttributeList";
import ColorPalette from "./ColorPalette";
import { hslToHex } from "./ColorPalette";
import EventHandler, { EventHandlerHandle } from "./EventHandler";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

interface FeatureData {
  fields: string[];
}

interface ModelData {
  models: string[];
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Zoom ref={ref} {...props} />;
});

export const Visualiser: React.FC<{
  setInteractionHistory: (history: string | null) => void,
  onModelChange: (selectedModel: string | null) => void,
  onSelectNode: (id: string | null) => void,
  dataset: string | null
}> = React.memo(({ setInteractionHistory, onModelChange, onSelectNode, dataset }) => {
  const [graph, setGraph] = useState<Graph | null>(null);
  const eventHandlerRef = useRef<EventHandlerHandle>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const modelRef = useRef<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const filterCategoryRef = useRef<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [filtersToApply, setFiltersToApply] = useState<Map<string, string>>(new Map());
  const filterQueryRef = useRef<string>("");
  const [nodeAttributes, setNodeAttributes] = useState<Record<string, unknown>>({});
  const [colorPopover, setColorPopover] = useState<{
    key: string | null;
    anchorEl: HTMLElement | null;
  }>({ key: null, anchorEl: null });
  const [louvainActive, setLouvainActive] = useState(false);
  const [originalColors, setOriginalColors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!dataset) return;
    fetch(`http://localhost:8000/recvizapi/get_features/${dataset}`)
      .then((response) => response.json())
      .then((data: FeatureData) => {
        if (data.fields.length > 0 && data.fields !== features) {
          setFeatures(data.fields);
          if (data.fields.length > 0) {
            filterCategoryRef.current = data.fields[0];
          }
        }
      })
      .catch((error) => console.error("Error fetching features:", error));

    fetch(`http://localhost:8000/recvizapi/get_dataset_models/${dataset}`)
      .then((response) => response.json())
      .then((data: ModelData) => {
        setModels(data.models);
        if (data.models.length > 0) {
          modelRef.current = data.models[0];
        }
      })
      .catch((error) => console.error("Error fetching models:", error));
  }, [dataset]);

  const filterKey = (category: string, query: string) => `${category}::${query}`;

  const addFilter = () => {
    const category = filterCategoryRef.current;
    const query = filterQueryRef.current;
    if (category && query) {
      const key = filterKey(category, query);
      setFiltersToApply((prev) => {
        const newMap = new Map(prev);
        if (!newMap.has(key)) {
          newMap.set(key, "#00000000");
        }
        return newMap;
      });
    }
  };

  const removeFilter = (key: string) => {
    setFiltersToApply((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  };

  const toggleDialog = useCallback(() => {
    setDialogOpen((prevState) => !prevState);
  }, []);

  const handleColorButtonClick = (
    key: string,
    event: React.MouseEvent<HTMLElement>
  ) => {
    setColorPopover({ key, anchorEl: event.currentTarget });
  };

  const handleColorSelect = (color: string, close = true) => {
    if (colorPopover.key) {
      setFiltersToApply((prev) => {
        const newMap = new Map(prev);
        if (colorPopover.key != null) {
          newMap.set(colorPopover.key, color);
        }
        return newMap;
      });
    }
    if (close) {
      setColorPopover({ key: null, anchorEl: null });
    }
  };

  const handlePopoverClose = () => {
    setColorPopover({ key: null, anchorEl: null });
  };

  const renderFilterItem = (key: string, color: string) => {
    const [filterCategory, filterQuery] = key.split("::");
    return (
      <Collapse key={`${filterCategory}-${filterQuery}`}>
        <ListItem
          sx={{
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              marginRight: 2,
              overflowWrap: 'break-word',
            }}
          >
            {`${filterCategory}: ${filterQuery}`}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              onClick={(event) => handleColorButtonClick(key, event)}
              sx={{
                width: 24,
                height: 24,
                minWidth: 24,
                padding: 0,
                flexShrink: 0,
                borderRadius: '50%',
                border: '1px solid #ccc',
                ...(color === "#00000000"
                  ? {
                      backgroundImage:
                        'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 50%, #ccc 50%, #ccc 75%, transparent 75%, transparent)',
                      backgroundSize: '10px 10px',
                    }
                  : {
                      backgroundColor: color,
                    }),
              }}
            />

            <Button
              onClick={() => removeFilter(key)}
              sx={{
                width: 36,
                height: 36,
                minWidth: 36,
                padding: 0,
                flexShrink: 0,
              }}
            >
              <DeleteIcon />
            </Button>
          </Stack>
        </ListItem>
      </Collapse>
    );
  };

  const fetchGraphData = () => {
    if (!modelRef.current) {
      alert("Please specify a model.");
      return;
    }

    setLoading(true);
    toggleDialog();

    const modelName = modelRef.current?.endsWith(".pth")
      ? modelRef.current.slice(0, -4)
      : modelRef.current;

    const params = new URLSearchParams(
      Array.from(filtersToApply.keys()).map((key) => {
        const [cat, query] = key.split("::");
        return [cat, query];
      })
    );

    fetch(`http://localhost:8000/recvizapi/get_inter_graph/${dataset}/?${params.toString()}`)
      .then((response) => response.text())
      .then((gexf_data) => {
        const graphologyGraph = parse(Graph, gexf_data);

        fetch(`http://localhost:8000/recvizapi/get_topk_all/${dataset}/${modelName}/10`)
          .then((response) => response.json())
          .then((topKData: Record<string, [string, string][]>) => {
            const edgeMap = new Map();
            graphologyGraph.forEachEdge((edge) => {
              const source = graphologyGraph.source(edge);
              const target = graphologyGraph.target(edge);
              if (!edgeMap.has(source)) edgeMap.set(source, new Map());
              edgeMap.get(source).set(target, edge);
            });

            Object.entries(topKData).forEach(([userKey, recommendations]) => {
              recommendations.forEach(([, itemKey]) => {
                if (edgeMap.has(userKey) && edgeMap.get(userKey).has(itemKey)) {
                  const edge = edgeMap.get(userKey).get(itemKey);
                  graphologyGraph.setEdgeAttribute(edge, "color", "green");
                }
              });
            });

            graphologyGraph.forEachNode((node) => {
              const nodeType = graphologyGraph.getNodeAttribute(node, "type");
              if (nodeType === "circle") {
                const filterFeature = graphologyGraph.getNodeAttribute(node, "filter_feature");
                const filterQuery = graphologyGraph.getNodeAttribute(node, "filter_query");
                if (filterFeature && filterQuery) {
                  const key = `${filterFeature}::${filterQuery}`;
                  const mappedColor = filtersToApply.get(key);
                  if (mappedColor && mappedColor !== "#00000000") {
                    graphologyGraph.setNodeAttribute(node, "color", mappedColor);
                    return;
                  }
                }
                graphologyGraph.setNodeAttribute(node, "color", "blue");
              }
              else {
                graphologyGraph.setNodeAttribute(node, "color", "green");
              }
            });

            setGraph(graphologyGraph);
          })
          .catch((error) => {
            console.error("Error fetching top-k recommendations:", error);
          });
      })
      .catch((error) => console.error("Error fetching graph data:", error))
      .finally(() => {
        setLoading(false);
        onModelChange(modelName);
      });
  };

  const toggleLouvainCommunities = () => {
    if (!dataset || !graph) {
      alert("Dataset or graph not available.");
      return;
    }

    if (!louvainActive) {
      if (Object.keys(originalColors).length === 0) {
        const savedColors: Record<string, string> = {};
        graph.forEachNode((node) => {
          savedColors[node] = graph.getNodeAttribute(node, "color");
        });
        setOriginalColors(savedColors);
      }

      const params = new URLSearchParams(
        Array.from(filtersToApply.keys()).map((key) => {
          const [cat, query] = key.split("::");
          return [cat, query];
        })
      );

      fetch(`http://localhost:8000/recvizapi/get_louvain/${dataset}/?${params.toString()}`)
        .then((response) => response.json())
        .then((communityMapping: Record<string, number>) => {
          const communityIds = Array.from(new Set(Object.values(communityMapping)));
          const communityColors: Record<number, string> = {};
          communityIds.forEach((comm, index) => {
            const hue = (index * 360) / communityIds.length;
            communityColors[comm] = hslToHex(hue, 70, 50);
          });

          graph.forEachNode((node) => {
            const comm = communityMapping[node];
            if (comm !== undefined) {
              graph.setNodeAttribute(node, "color", communityColors[comm]);
            }
          });
          setGraph(graph);
          eventHandlerRef.current?.resetSettings();
        })
        .catch((error) => console.error("Couldn't get Louvain communities:", error));
    }
    else {
      graph.forEachNode((node) => {
        if (originalColors[node]) {
          graph.setNodeAttribute(node, "color", originalColors[node]);
        }
      });
      setGraph(graph);
      eventHandlerRef.current?.resetSettings();
    }
    setLouvainActive(!louvainActive);
  };

  const LoadGraph: React.FC<{ graph: Graph }> = ({ graph }) => {
    const loadGraph = useLoadGraph();
    useEffect(() => {
      loadGraph(graph);
    }, [graph, loadGraph]);

    return null;
  };

  return (
    <div ref={containerRef} style={{ position: "relative", height: "calc(100vh - 64px)", width: "50vw" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <CircularProgress style={{ color: "white" }} size={72} disableShrink />
        </div>
      )}
      <AttributeList attributes={nodeAttributes} />
      <Button
        variant="contained"
        style={{ position: "absolute", top: "12px", left: "12px", zIndex: 1 }}
        onClick={toggleDialog}
        disabled={!dataset}
      >
        {dialogOpen ? "Close Menu" : "Fetch New Graph"}
      </Button>
      <Box
        sx={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          zIndex: 1,
          backgroundColor: "rgba(18, 18, 18, 0.88)",
          backdropFilter: "blur(4px)",
          paddingRight: "15px",
          borderRadius: "6px",
          boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)"
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={louvainActive}
              onChange={toggleLouvainCommunities}
              color="primary"
              disabled={!graph}
            />
          }
          label="Louvain"
          labelPlacement="start"
        />
      </Box>
      <SigmaContainer
        style={{ height: "100%", width: "100%" }}
        settings={{
          allowInvalidContainer: true,
          nodeProgramClasses: {
            square: NodeSquareProgram,
          },
          labelFont: "Roboto",
          labelColor: { color: "#6c3cb8" },
        }}
      >
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          style={{
            position: "absolute",
            width: "50vw",
          }}
          container={containerRef.current || undefined}
          TransitionComponent={Transition}
          hideBackdrop={true}
          disableEnforceFocus={true}
        >
          <Card>
            <CardContent style={{ padding: "1.2rem" }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontSize="1.5rem">
                  Add/Remove Filters
                </Typography>
                <IconButton
                  onClick={toggleDialog}
                  sx={{
                    aspectRatio: "1",
                    padding: "0",
                    width: "30px",
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Stack spacing={3} direction="row">
                <Box style={{ paddingTop: "1em", width: "220px" }}>
                  <Stack spacing={2}>
                    <Stack>
                      Filter category:
                      <Select
                        onChange={(e) => {
                          filterCategoryRef.current = e.target.value;
                        }}
                        label="Select a category to filter by"
                        defaultValue={filterCategoryRef.current || ""}
                      >
                        {features.map((field) => (
                          <MenuItem key={field} value={field}>
                            {field}
                          </MenuItem>
                        ))}
                      </Select>
                    </Stack>
                    <Stack>
                      Filter query:
                      <TextField
                        label="Value x or range x-y (inclusive)"
                        defaultValue={filterQueryRef.current}
                        onChange={(e) => {
                          filterQueryRef.current = e.target.value;
                        }}
                        variant="standard"
                      />
                    </Stack>
                    <Button variant="contained" onClick={addFilter}>
                      Add Filter
                    </Button>
                  </Stack>
                </Box>
                <Box style={{ paddingTop: "1em", width: "300px" }}>
                  <Stack spacing={2}>
                    <Stack>
                      Model:
                      <Select
                        onChange={(e) => {
                          modelRef.current = e.target.value;
                        }}
                        label="Select a model"
                        defaultValue={modelRef.current || ""}
                      >
                        {models.map((model) => (
                          <MenuItem key={model} value={model}>
                            {model}
                          </MenuItem>
                        ))}
                      </Select>
                    </Stack>
                    <Card
                        variant="outlined"
                        style={{ minHeight: "70px", maxHeight: "256px", overflowY: "auto" }}
                    >
                      <CardContent>
                        <List>
                          {filtersToApply.size === 0 ? (
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              textAlign={"center"}
                              paddingTop={"9px"}
                            >
                              No filters currently applied.
                            </Typography>
                          ) : (
                            <TransitionGroup>
                              {Array.from(filtersToApply.entries()).map(([key, color]) =>
                                renderFilterItem(key, color)
                              )}
                            </TransitionGroup>
                          )}
                        </List>
                      </CardContent>
                    </Card>
                    <Button variant="contained" onClick={fetchGraphData}>
                      Fetch Graph
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Dialog>
        <ColorPalette
          anchorEl={colorPopover.anchorEl}
          open={Boolean(colorPopover.anchorEl)}
          onClose={handlePopoverClose}
          onColorSelect={handleColorSelect}
        />
        {graph && graph.order > 0 && (
          <EventHandler
            ref={eventHandlerRef}
            setSelectedNode={onSelectNode}
            setInteractionHistory={setInteractionHistory}
            setNodeAttributes={setNodeAttributes}
          />
        )}
        <LoadGraph graph={graph || new Graph()} />
        {!graph && !loading && (
          <div
            style={{
              position: "absolute",
              width: "50vw",
              top: "calc(50vh - 64px)",
              textAlign: "center",
              fontFamily: "Roboto",
              fontWeight: 400,
              fontSize: "1.5rem",
            }}
          >
            Load a dataset to get started
          </div>
        )}
        <SearchControl
          style={{
            position: "absolute",
            top: "60px",
            left: "12px",
            zIndex: 1,
            width: "165px",
          }}
        />
      </SigmaContainer>
    </div>
  );
});

export default Visualiser;
