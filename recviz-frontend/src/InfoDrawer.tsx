import React from 'react';
import Drawer from '@mui/material/Drawer';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';

interface InfoDrawerProps {
  open: boolean;
  toggleDrawer: (open: boolean) => void;
}

export default function InfoDrawer({ open, toggleDrawer }: InfoDrawerProps) {
  const [helpDialogOpen, setHelpDialogOpen] = React.useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = React.useState(false);

  const handleHelpClick = () => {
    toggleDrawer(false);
    setHelpDialogOpen(true);
  };

  const handleAboutClick = () => {
    toggleDrawer(false);
    setAboutDialogOpen(true);
  };

  const DrawerList = (
    <List>
      <ListItem key="Help" disablePadding>
        <ListItemButton onClick={handleHelpClick}>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary="Help" />
        </ListItemButton>
      </ListItem>
      <ListItem key="About" disablePadding>
        <ListItemButton onClick={handleAboutClick}>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary="About this app" />
        </ListItemButton>
      </ListItem>
    </List>
  );

  return (
    <div>
      <Drawer open={open} onClose={() => toggleDrawer(false)}>
        {DrawerList}
      </Drawer>

      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)}>
        <DialogTitle>Help</DialogTitle>
        <DialogContent>
        <DialogContentText component="div">
          <h2>RecViz Starter Guide</h2>
          <p>Almost everything you need to know in 1 minute flat: <a href="https://www.youtube.com/watch?v=C-sAZBdgCtU" target="_blank" rel="noopener noreferrer">Watch here</a></p>
          <ul>
            <li>You start in the User-item Interaction Layer</li>
            <li>On the bottom left of each visualiser, there is a flip switch to activate Louvain community detection, to see better some related clusters of nodes</li>
            <li>Top-10 recommendations are also shown with green edges on the graphs</li>
            <li>Square = item, circle = user, edge = interaction</li>
            <li>If you click a user to select them, it will hide all edges except the ones connected to that user</li>
            <li>A list of node attributes will appear on the top right for selected nodes</li>
            <li>If you click outside it will deselect the user</li>
            <li>There is a search bar to search users/items by id on the top left</li>
            <li>Left click to pan, scroll wheel / trackpad to zoom</li>
            <li>Choose a dataset from the top right button (Change Dataset)</li>
            <li>Click Fetch New Graph on the top left of each visualiser to open the dialog</li>
            <li>If you'd like, choose how you would like to filter the dataset by choosing an attribute from the list</li>
            <li>Then type either a value to include or a range to include (inclusive x-y)</li>
            <li>You can add multiple attributes to filter at once</li>
            <li>To assign specific colours to nodes that match the filters, click on the coloured circles, to get a colour palette to choose from</li>
            <li>Choose a model file to show recommendations from with the Model dropdown</li>
            <li>When you're ready, click Fetch Graph!</li>
            <li>You can select one user from each of the left and right graphs to enter the User Comparison Layer</li>
            <li>Drag the slider to adjust the k-value for the top-k recommendations that are shown in the top half using parallel sets of nodes</li>
            <li>Edges denote commonalities between the four sets</li>
            <li>The left user has a blue set (sequential ground truth if applicable) and a green set (recommendations)</li>
            <li>The right user has the same but mirrored</li>
            <li>The bottom half of this layer contains metrics cards to compare the users, which can be exported to CSV with the "Export CSV" button on the top right</li>
          </ul>
        </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)}>
        <DialogTitle>About this app</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This app was developed in the aid of Recommender Systems research,<br/> as part of a Level 4
            Individual Project at the University of Glasgow.<br/><br/> Developed by Jackson Dam,
            supervised by Professor Iadh Ounis.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
