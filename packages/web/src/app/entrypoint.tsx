import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Root } from "~/pages/root";

import { AppModals } from "./providers/AppModals";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppModals />

    <Root />
  </StrictMode>,
);
