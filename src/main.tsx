import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Portal from "./portal.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Portal />
  </StrictMode>
);
