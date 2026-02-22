import React from "react";
import ReactDOM from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.js";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.js";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

interface User {
  email: string;
  fullname: string;
  admin: boolean;
  active: boolean;
}

const queryClient = new QueryClient();

function App() {
  const apiBaseUrl = "API_BASE_URL_PLACEHOLDER";

  useSuspenseQuery<User>({
    queryKey: ["user"],
    staleTime: Infinity,
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
      });
      const data = await response.json();
      return data.detail === "Not authenticated" ? null : data;
    },
  });

  return (
    <RouterProvider
      router={router}
      context={{
        apiBaseUrl,
        queryClient,
      }}
    />
  );
}

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<div>Loading app...</div>}>
        <Toaster />
        <App />
        <React.Suspense>
          <TanStackRouterDevtools router={router} />
        </React.Suspense>
        <ReactQueryDevtools initialIsOpen={false} />
      </React.Suspense>
    </QueryClientProvider>
  </React.StrictMode>,
);
