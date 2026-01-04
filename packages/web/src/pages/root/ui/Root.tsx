import { useQuery } from "@tanstack/react-query";
import { api } from "~/shared/lib/treaty";

export const Root = () => {
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.health.get(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching health status</div>;

  return <div>API Status: {response?.data?.status}</div>;
};
