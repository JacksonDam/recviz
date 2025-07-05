// import {scan} from "react-scan";
// if (typeof window !== 'undefined') {
//   scan({
//     enabled: true,
//     log: true,
//   });
// }
import { createRoot } from "react-dom/client";
import "./index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

import App from "./App.tsx";

const rootNode = document.getElementById("root") as Element;
const root = createRoot(rootNode);

root.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);
