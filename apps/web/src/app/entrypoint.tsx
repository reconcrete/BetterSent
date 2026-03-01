import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Root } from "~/pages/root";
import { History } from "~/pages/history";

import { AppModals } from "./providers/AppModals";
import { QueryProvider } from "./providers/QueryProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <BrowserRouter>
        <AppModals />
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  </StrictMode>
);
