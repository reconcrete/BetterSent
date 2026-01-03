import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

import { AppModals } from "./providers/AppModals";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
        <BrowserRouter>

            <AppModals />

            <Routes>
              <Route path="/" element={<div>Hello World</div>} />
            </Routes>
        </BrowserRouter>
  </StrictMode>
);
