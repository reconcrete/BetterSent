import type { FC, PropsWithChildren } from "react";
import { useEffect } from "react";
import { PostHogProvider } from "@posthog/react";
import { useAnalytics } from "~/shared/lib";
import { useSession } from "~/shared/lib";

const AnalyticsIdentify = () => {
  const analytics = useAnalytics();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      analytics.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [analytics, session?.user]);

  useEffect(() => {
    if (session === null) {
      analytics.reset();
    }
  }, [analytics, session]);

  return null;
};

export const AnalyticsProvider: FC<PropsWithChildren> = ({ children }) => (
  <PostHogProvider
    apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY ?? ""}
    options={{
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: "2026-01-30",
    }}
  >
    <AnalyticsIdentify />
    {children}
  </PostHogProvider>
);
