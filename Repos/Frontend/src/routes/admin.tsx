import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast.js";
import { Button } from "../components/ui/button.js";
import { Card } from "@/components/ui/card.js";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context }) => {
    const beforeLoadUser = context.queryClient.getQueryData(["user"]);
    if (!beforeLoadUser.admin) {
      throw redirect({ to: "/" });
    }
    return beforeLoadUser;
  },
  component: AdminComponent,
});

function AdminComponent() {
  const { apiBaseUrl, beforeLoadUser, queryClient } = Route.useRouteContext();
  const { toast } = useToast();

  const { isPending, isError, data, error } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      fetch(`${apiBaseUrl}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
      }).then((res) => res.json()),
  });

  const activateUser = async ({ typeChange, email }: UserChange) => {
    const response = await fetch(`${apiBaseUrl}/user/` + typeChange, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("access_token"),
      },
      body: JSON.stringify({ email }),
    });
    const json = await response.json();
    if (json.Success) {
      toast({
        title: "Success!",
        description: json.Success,
      });
    } else {
      toast({
        title: "Failed!",
        description: json.Error,
      });
    }
    return json;
  };

  const mutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  if (isPending) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }
  if (!beforeLoadUser) {
    return <span>Error: Current User Not Found</span>;
  }
  return (
    <>
      <h1 className="text-2xl font-bold">
        Modify User Active and Admin Status
      </h1>
      {data.map((user: UserType) => (
        <Card key={user.email} className="px-4 py-4 my-4">
          <li>
            {user.fullname} - {user.email}
          </li>

          {beforeLoadUser.email != user.email ? (
            <>
              <Button
                onClick={() =>
                  mutation.mutate({ typeChange: "activate", email: user.email })
                }
                type="submit"
              >
                {user.active ? "Disable Account" : "Enable Account"}
              </Button>
              <Button
                onClick={() =>
                  mutation.mutate({
                    typeChange: "add_admin",
                    email: user.email,
                  })
                }
                type="submit"
              >
                {user.admin ? "Disable Admin" : "Enable Admin"}
              </Button>
            </>
          ) : (
            "Current User (Cannot make changes)"
          )}
        </Card>
      ))}
    </>
  );
}

interface UserChange {
  typeChange: string;
  email: string;
}

type UserType = {
  email: string;
  fullname: string;
  admin: boolean;
  active: boolean;
};
