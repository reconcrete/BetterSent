import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Root } from "~/pages/root";
import { History } from "~/pages/history";
import { Settings } from "~/pages/settings";

import { AppLayout } from "~/widgets/appLayout";

import { AnalyticsProvider } from "./providers/AnalyticsProvider";
import { AppModals } from "./providers/AppModals";
import { QueryProvider } from "./providers/QueryProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsProvider>
      <QueryProvider>
        <BrowserRouter>
          <AppModals />
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Root />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryProvider>
    </AnalyticsProvider>
  </StrictMode>
);
