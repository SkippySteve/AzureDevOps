import { createFileRoute } from "@tanstack/react-router";
import { UseComponent } from "../components/use.js";
import { LoginPage } from "@/components/loginPage.js";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const beforeLoadUser = context.queryClient.getQueryData(["user"]);
    return beforeLoadUser;
  },
  loader: async ({ context: { apiBaseUrl } }) =>
    await fetch(`${apiBaseUrl}/accuracy`).then((res) => res.json()),
  component: RouteComponent,
});

function RouteComponent() {
  const { apiBaseUrl, queryClient, beforeLoadUser } = Route.useRouteContext();
  const accuracy = Route.useLoaderData();
  if (!beforeLoadUser?.active) {
    return (
      <LoginPage
        accuracy={accuracy}
        apiBaseUrl={apiBaseUrl}
        queryClient={queryClient}
      />
    );
  }

  return (
    <UseComponent
      accuracy={accuracy}
      apiBaseUrl={apiBaseUrl}
      queryClient={queryClient}
    />
  );
}
