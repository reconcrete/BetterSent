import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/shared/lib/treaty";

export const BILLING_STATUS_KEY = ["billingStatus"];

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: BILLING_STATUS_KEY,
    queryFn: async () => {
      const response = await api.billing.status.get();
      if (response.error) {
        throw new Error("Failed to fetch billing status");
      }
      return response.data?.data;
    },
    staleTime: 30_000,
  });
};

export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.billing.checkout.post();
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? errorValue.error
            : "Failed to create checkout session";
        throw new Error(errorMessage);
      }
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
  });
};

export const useCreatePortal = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.billing.portal.post();
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? errorValue.error
            : "Failed to create portal session";
        throw new Error(errorMessage);
      }
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
  });
};
