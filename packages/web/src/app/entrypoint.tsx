import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Root } from "~/pages/root";

import { AppModals } from "./providers/AppModals";
import { QueryProvider } from "./providers/QueryProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <AppModals />

      <Root />
    </QueryProvider>
  </StrictMode>
);
