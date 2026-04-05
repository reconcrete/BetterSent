import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/shared/lib/treaty";
import { useAnalytics } from "~/shared/lib";

export const useMarkOnboarded = () => {
  const queryClient = useQueryClient();
  const { capture } = useAnalytics();

  return useMutation({
    mutationFn: async () => {
      const response = await api.user.me.onboard.post();
      if (response.error) throw new Error("Failed to complete onboarding");
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.id) {
        localStorage.setItem("bettersent_onboarded", data.data.id);
      }
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      capture("onboarding_completed");
    },
  });
};
