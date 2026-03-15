import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/shared/lib/treaty";

export const useCreateDevice = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, label }: { email: string; label?: string }) => {
      const response = await api.kindle.post({ email, label });
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? errorValue.error
            : "Failed to create Kindle email";
        throw new Error(errorMessage);
      }
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kindleEmails"] });
      options?.onSuccess?.();
    },
  });
};
