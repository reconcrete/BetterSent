import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Root } from "~/pages/root";
import { History } from "~/pages/history";
import { Settings } from "~/pages/settings";
import { SignIn } from "~/pages/sign-in";
import { Onboarding } from "~/pages/onboarding";

import { AppLayout } from "~/widgets/appLayout";
import { TooltipProvider } from "~/shared/ui";

import { AnalyticsProvider } from "./providers/AnalyticsProvider";
import { AppModals } from "./providers/AppModals";
import { QueryProvider } from "./providers/QueryProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsProvider>
      <QueryProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppModals />
            <Routes>
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<Root />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryProvider>
    </AnalyticsProvider>
  </StrictMode>
);
