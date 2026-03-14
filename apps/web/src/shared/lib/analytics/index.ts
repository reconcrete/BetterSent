import { usePostHog } from "@posthog/react";
import { useMemo } from "react";

export const useAnalytics = () => {
  const posthog = usePostHog();

  return useMemo(
    () => ({
      capture: (event: string, properties?: Record<string, unknown>) => {
        posthog.capture(event, properties);
      },
      identify: (userId: string, traits?: Record<string, unknown>) => {
        posthog.identify(userId, traits);
      },
      reset: () => {
        posthog.reset();
      },
    }),
    [posthog],
  );
};
