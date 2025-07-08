# RecViz Starter Guide
Almost everything you need to know in 1 minute flat: https://youtu.be/FmvEd6L8uUA

Tips list to get started:
- You start in the User-item Interaction Layer
- On the bottom left of each visualiser, there is a flip switch to activate Louvain community detection, to see better some related clusters of nodes
- Top-10 recommendations are also shown with green edges on the graphs
- Square = item, circle = user, edge = interaction
- If you click a user to select them, it will hide all edges except the ones connected to that user
- A list of node attributes will appear on the top right for selected nodes
- If you click outside it will deselect the user
- There is a search bar to search users/items by id on the top left
- Left click to pan, scroll wheel / trackpad to zoom
- Choose a dataset from the top right button (Change Dataset)
- Click Fetch New Graph on the top left of each visualiser to open the dialog
- If you'd like, choose how you would like to filter the dataset by choosing an attribute from the list
- Then type either a value to include or a range to include (inclusive x-y)
- You can add multiple attributes to filter at once
- To assign specific colours to nodes that match the filters, click on the coloured circles, to get a colour palette to choose from
- Choose a model file to show recommendations from with the Model dropdown
- When you're ready, click Fetch Graph!
- You can select one user from each of the left and right graphs to enter the User Comparison Layer
- Drag the slider to adjust the k-value for the top-k recommendations that are shown in the top half using parallel sets of nodes
- Edges denote commonalities between the four sets
- The left user has a blue set (sequential ground truth if applicable) and a green set (recommendations)
- The right user has the same but mirrored
- The bottom half of this layer contains metrics cards to compare the users, which can be exported to CSV with the "Export CSV" button on the top right
