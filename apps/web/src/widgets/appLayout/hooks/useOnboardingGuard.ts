import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";

export const useOnboardingGuard = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const onboardingTriggered = useRef(false);
  const isOnboardedCached = session && localStorage.getItem("bettersent_onboarded") === session.user.id;

  useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await api.user.me.get();
      if (response.error) throw new Error("Failed to fetch profile");
      if (!response.data.data.onboarded && !onboardingTriggered.current) {
        onboardingTriggered.current = true;
        navigate("/onboarding", { replace: true });
      }
      return response.data;
    },
    enabled: !!session && !isOnboardedCached,
  });
};
