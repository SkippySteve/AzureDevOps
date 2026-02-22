import React from "react";
import { Login } from "@/components/login.js";
import { Signup } from "@/components/signup.js";
import { Card } from "@/components/ui/card.js";

export const LoginPage = ({ accuracy, apiBaseUrl, queryClient }) => {
  return (
    <>
      <h1 className="text-2xl font-bold">
        Welcome to Steve's Spam Detection ML Model
      </h1>
      <p>Feel free to look around, but you must signup or login to use it.</p>
      <strong>Model Accuracy: {accuracy}</strong>
      <Card className="px-4 py-4 my-4">
        <Login apiBaseUrl={apiBaseUrl} queryClient={queryClient} />
      </Card>
      <Card className="px-4 py-4 my-4">
        <Signup apiBaseUrl={apiBaseUrl} />
      </Card>
    </>
  );
};
