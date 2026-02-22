import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button.js";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.js";
import { Textarea } from "./ui/textarea.js";
import { toast } from "../hooks/use-toast.js";
import { Switch } from "./ui/switch.js";
import { Input } from "@/components/ui/input.js";
import { Card } from "@/components/ui/card.js";
import { ToastAction } from "@/components/ui/toast.js";

export function UseComponent({ accuracy, apiBaseUrl, queryClient }) {
  return (
    <>
      <Card className="px-4 py-4"><strong>Model Accuracy: {accuracy}</strong></Card>
      <div className="my-4" />
      <Card className="px-4 py-4">
        <TextForm apiBaseUrl={apiBaseUrl} queryClient={queryClient} />
      </Card>
      <div className="my-4" />

      <Card className="px-4 py-4">
        <AISpam apiBaseUrl={apiBaseUrl} queryClient={queryClient} />
      </Card>
      <div className="my-4" />

      <Card className="px-4 py-4">
        <DatasetForm apiBaseUrl={apiBaseUrl} />
      </Card>
    </>
  );
}

const TextForm = ({ apiBaseUrl, queryClient }) => {
  const navigate = useNavigate({ from: "/" });
  const [text, setText] = React.useState("");

  const emailSchema = z.object({
    text: z
      .string()
      .min(1, {
        message: "Email for analysis cannot be blank.",
      })
      .max(10000, {
        message:
          "Email for analysis cannot be more than 10,000 characters long.",
      }),
  });

  const postUserEmail = async (values: z.infer<typeof emailSchema>) => {
    const response = await fetch(`${apiBaseUrl}/user_prediction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("access_token"),
      },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setText("");
    queryClient.invalidateQueries({ queryKey: ["emails"] });
    toast({
      description: "Result: " + data.status,
      action: (
        <ToastAction
          altText="Go to Results"
          onClick={() => navigate({ to: "/previous" })}
        >
          Go to Results
        </ToastAction>
      ),
    });
  };

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      text: text,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(postUserEmail)} className="space-y-2">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl font-bold">
                Submit Email for Analysis
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={8}
                  cols={70}
                  placeholder="Place email here for analysis"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                <h1 className="text-2xl font-bold">
                  Prevent being caught in spam filters
                </h1>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="hover:bg-sky-700 rounded-lg transition-colors duration-200"
          type="submit"
        >
          Submit
        </Button>
      </form>
    </Form>
  );
};

function AISpam({ apiBaseUrl, queryClient }) {
  const navigate = useNavigate({ from: "/" });
  const AISpamSchema = z.object({
    predict_spam: z.boolean().default(true),
  });

  const form = useForm<z.infer<typeof AISpamSchema>>({
    resolver: zodResolver(AISpamSchema),
    defaultValues: {
      predict_spam: true,
    },
  });

  const createAISpam = async (data: z.infer<typeof AISpamSchema>) => {
    const response = await fetch(`${apiBaseUrl}/llm_prediction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("access_token"),
      },
      body: JSON.stringify(data),
    });
    const apiData = await response.json();

    queryClient.invalidateQueries({ queryKey: ["emails"] });

    toast({
      description: "Result: " + apiData.status,
      action: (
        <ToastAction
          altText="Go to Results"
          onClick={() => navigate({ to: "/previous" })}
        >
          Go to Results
        </ToastAction>
      ),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createAISpam)}>
        <FormField
          control={form.control}
          name="predict_spam"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl font-bold">
                Create LLM Generated Email for Analysis
              </FormLabel>
              <div class="flex flex-row justify-center">
                <div>
                  <FormDescription>
                    <h1 className="text-2xl font-bold">
                      Tell the LLM to create Spam:{" "}
                    </h1>
                  </FormDescription>
                </div>
                <div className="py-4">
                  <FormControl>
                    <Switch
                      className="scale-150"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </div>
            </FormItem>
          )}
        />
        <Button
          className="hover:bg-sky-700 rounded-lg transition-colors duration-200"
          type="submit"
        >
          Generate
        </Button>
      </form>
    </Form>
  );
}

function DatasetForm({ apiBaseUrl }) {
  const navigate = useNavigate({ from: "/" });
  const DatasetSchema = z.object({
    id: z.coerce
      .number()
      .min(0, {
        message: "Dataset ID must be between 0 and 5571.",
      })
      .max(5571, {
        message: "Dataset ID must be between 0 and 5571.",
      }),
  });

  const form = useForm<z.infer<typeof DatasetSchema>>({
    resolver: zodResolver(DatasetSchema),
    defaultValues: {
      id: 0,
    },
  });

  const sendDatasetPost = async (id: z.infer<typeof DatasetSchema>) => {
    const response = await fetch(`${apiBaseUrl}/dataset_prediction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("access_token"),
      },
      body: JSON.stringify(id),
    });
    const resData = await response.json();
    toast({
      description: "Result: " + resData.status,
      action: (
        <ToastAction
          altText="Go to Results"
          onClick={() => navigate({ to: "/previous" })}
        >
          Go to Results
        </ToastAction>
      ),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(sendDatasetPost)}>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl font-bold">
                Dataset Index ID for Analysis
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Dataset ID goes here"
                  {...field}
                  className="mx-auto sm:w-1/6"
                />
              </FormControl>
              <FormDescription>
                <h1 className="text-xl font-bold">
                  Input a number between 0 and 5571 to analyze an email with
                  that ID from the dataset
                </h1>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="hover:bg-sky-700 rounded-lg transition-colors duration-200"
          type="submit"
        >
          Submit
        </Button>
      </form>
    </Form>
  );
}
