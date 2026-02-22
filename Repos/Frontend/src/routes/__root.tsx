import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator.js";
import "../App.css";
import { Button } from "@/components/ui/button.js";

interface RouterContext {
  apiBaseUrl;
  queryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context }) => {
    const beforeLoadUser = context.queryClient.getQueryData(["user"]);
    return { beforeLoadUser };
  },
  component: () => {
    const navigate = useNavigate();
    const { beforeLoadUser, queryClient } = Route.useRouteContext();
    const router = useRouter();

    return (
      <>
        <div class="flex-col h-full">
          <div className="absolute top-4 right-4">
            {!beforeLoadUser?.detail && (
              <Button
                variant="ghost"
                onClick={async () => {
                  localStorage.removeItem("access_token");
                  await queryClient.invalidateQueries({ queryKey: ["user"] });
                  router.invalidate();
                  navigate({ to: "/" });
                }}
                className="px-3 py-6 hover:bg-sky-700 rounded-lg transition-colors duration-200 dark:text-white"
              >
                Logout
              </Button>
            )}
          </div>

          <div class="lg:flex justify-center w-100">
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 lg:w-auto">
              <Button variant="link" className="px-3 py-6">
                <Link
                  to="/"
                  className="hover:bg-sky-700 rounded-lg transition-colors duration-200 text-3xl dark:text-white  px-4 py-2"
                  activeProps={{
                    className:
                      "font-bold underline bg-card rounded-lg px-4 py-2",
                  }}
                >
                  {beforeLoadUser?.active ? "Use ML Model" : "Login"}
                </Link>
              </Button>
            </div>

            <Separator className="hidden lg:block" orientation="vertical" />
            <Separator className="lg:hidden" orientation="horizontal" />

            <div class="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 lg:w-auto">
              <Button variant="link" className="px-3 py-6">
                <Link
                  to="/previous"
                  className="hover:bg-sky-700 rounded-lg transition-colors duration-200 text-3xl dark:text-white  px-4 py-2"
                  activeProps={{
                    className:
                      "font-bold underline bg-card rounded-lg px-4 py-2",
                  }}
                >
                  Previous ML Results
                </Link>
              </Button>
            </div>

            <Separator className="hidden lg:block" orientation="vertical" />
            <Separator className="lg:hidden" orientation="horizontal" />

            <div class="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 lg:w-auto">
              <Button variant="link" className="px-3 py-6">
                <Link
                  to="/visuals"
                  className="hover:bg-sky-700 rounded-lg transition-colors duration-200 text-3xl dark:text-white  px-4 py-2"
                  activeProps={{
                    className:
                      "font-bold underline bg-card rounded-lg px-4 py-2",
                  }}
                >
                  ML Model Visuals
                </Link>
              </Button>
            </div>

            {beforeLoadUser?.admin && (
              <>
                <Separator className="hidden lg:block" orientation="vertical" />
                <Separator className="lg:hidden" orientation="horizontal" />

                <div class="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 lg:w-auto">
                  <Button variant="link" className="px-3 py-6">
                    <Link
                      to="/admin"
                      className="hover:bg-sky-700 rounded-lg transition-colors duration-200 text-3xl dark:text-white  px-4 py-2"
                      activeProps={{
                        className:
                          "font-bold underline bg-card rounded-lg px-4 py-2",
                      }}
                    >
                      Admin
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex h-6 items-center space-x-8">
          <Separator />
        </div>
        <Outlet />
      </>
    );
  },
});
