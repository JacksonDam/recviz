import React, {useState, useEffect, useMemo} from "react";
import { Visualiser } from "./Visualiser";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import InfoDrawer from "./InfoDrawer";
import Dialog from "@mui/material/Dialog";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { TransitionProps } from "@mui/material/transitions";
import Slide from "@mui/material/Slide";
import Zoom from "@mui/material/Zoom";
import { Card, CardContent } from "@mui/material";
import ComparisonView from "./ComparisonView";

const Transition = React.forwardRef(function Transition(
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ComparisonViewComponent = React.memo(ComparisonView);

export const App = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leftInteractionHistory, setLeftInteractionHistory] = useState<string | null>(null);
  const [rightInteractionHistory, setRightInteractionHistory] = useState<string | null>(null);
  const [leftSelectedModel, setLeftSelectedModel] = useState<string | null>(null);
  const [rightSelectedModel, setRightSelectedModel] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<string[] | null>(null);
  const [dataset, setDataset] = useState<string | null>(null);
  const [leftNode, setLeftNode] = useState<string | null>(null);
  const [rightNode, setRightNode] = useState<string | null>(null);
  const [userComparisonOpen, setUserComparisonOpen] = useState(false);

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const fetchDatasets = async () => {
    try {
      const response = await fetch("http://localhost:8000/recvizapi/get_available_datasets");
      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.statusText}`);
      }
      const data = await response.json();
      setDatasets(data.datasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  useEffect(() => {
    if (!datasets) {
      fetchDatasets();
    }
  }, [datasets]);

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSelectDataset = (selectedDataset: string) => {
    if (selectedDataset !== dataset) {
      setDataset(selectedDataset);
    }
    setDialogOpen(false);
  };

  const openComparisonView = () => {
    setUserComparisonOpen(true);
  };

  const closeComparisonView = () => {
    setUserComparisonOpen(false);
  };

  const memoisedComparisonView = useMemo(() => {
    return (
      <ComparisonViewComponent
        dataset={dataset}
        model1={leftSelectedModel}
        model2={rightSelectedModel}
        user1={leftNode}
        user2={rightNode}
        user1InteractionHistory={leftInteractionHistory}
        user2InteractionHistory={rightInteractionHistory}
        onClose={closeComparisonView}
      />
    );
  }, [userComparisonOpen, dataset, leftSelectedModel, rightSelectedModel, leftNode, rightNode]);

  return (
    <div>
      <AppBar position="static" style={{ width: "100vw" }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RecViz{dataset ? ": " + dataset : ""}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={openComparisonView}
            sx={{ mr: 2 }}
            disabled={leftNode === null || rightNode === null}
          >
            User comparison view
          </Button>
          <Button variant="contained" color="primary" onClick={handleDialogOpen}>
            Change dataset
          </Button>
        </Toolbar>
      </AppBar>

      <div style={{ position: "absolute" }}>
        <Visualiser setInteractionHistory={setLeftInteractionHistory} onModelChange={setLeftSelectedModel} onSelectNode={setLeftNode} dataset={dataset} />
      </div>
      <div style={{ left: "50vw", position: "absolute" }}>
        <Visualiser setInteractionHistory={setRightInteractionHistory} onModelChange={setRightSelectedModel} onSelectNode={setRightNode} dataset={dataset} />
      </div>
      <InfoDrawer open={drawerOpen} toggleDrawer={toggleDrawer} />

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        TransitionComponent={Transition}
        sx={{ width: "100vw", backdropFilter: "blur(0.5rem)" }}
      >
        <Box padding="1rem">
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontSize="1.5rem">
              Select a Dataset
            </Typography>
            <IconButton
              onClick={handleDialogClose}
              sx={{
                aspectRatio: "1",
                padding: "0",
                width: "30px",
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Card variant="outlined" style={{ minHeight: "70px" }}>
            <CardContent>
              {datasets === null ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                  <CircularProgress />
                </Box>
              ) : (
                <List disablePadding={true} sx={{maxHeight: "512px", overflowY: "auto"}}>
                  {datasets.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      textAlign={"center"}
                      paddingTop={"9px"}
                    >
                      No datasets available.
                    </Typography>
                  ) : (
                    datasets.map((dsName) => (
                      <ListItemButton key={dsName} onClick={() => handleSelectDataset(dsName)}>
                        {dsName}
                      </ListItemButton>
                    ))
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Dialog>

      <Zoom in={userComparisonOpen} timeout={300} unmountOnExit>
        <Box
          sx={{
            position: "fixed",
            top: "64px",
            left: 0,
            width: "100vw",
            height: "calc(100vh - 64px)",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {memoisedComparisonView}
        </Box>
      </Zoom>
    </div>
  );
};

export default App;
