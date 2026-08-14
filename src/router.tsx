import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // Cache dữ liệu 5 phút
        gcTime: 1000 * 60 * 30, // Giữ bộ nhớ cache 30 phút
        refetchOnWindowFocus: false, // Tránh refetch rác khi đổi tab
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // Tự động nạp trước dữ liệu khi hover link
    defaultPreloadStaleTime: 1000 * 60 * 5,
  });

  return router;
};
