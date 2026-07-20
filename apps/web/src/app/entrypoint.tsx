import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Root } from "~/pages/root";
import { History } from "~/pages/history";
import { Settings } from "~/pages/settings";
import { SignIn } from "~/pages/sign-in";
import { Onboarding } from "~/pages/onboarding";
import { DeviceApproval } from "~/pages/device";

import { AppLayout } from "~/widgets/appLayout";
import { TooltipProvider } from "~/shared/ui";
import { AnalyticsProvider } from "./providers/AnalyticsProvider";
import { AppModals } from "./providers/AppModals";
import { QueryProvider } from "./providers/QueryProvider";
import { WebSocketProvider } from "./providers/WebSocketProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsProvider>
      <QueryProvider>
        <TooltipProvider>
          <BrowserRouter>
            <WebSocketProvider>
              <AppModals />
              <Routes>
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/device" element={<DeviceApproval />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Root />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Routes>
            </WebSocketProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryProvider>
    </AnalyticsProvider>
  </StrictMode>
);
