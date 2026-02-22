import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast.js";
import { Button } from "@/components/ui/button.js";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.js";
import { Input } from "@/components/ui/input.js";
import { useNavigate, useRouter } from "@tanstack/react-router";

const FormSchema = z.object({
  email: z.string().min(2, {
    message: "Email must be at least 2 characters.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

const postData = async ({ email, password }, apiBaseUrl) => {
  const response = await fetch(`${apiBaseUrl}/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const Login = ({ apiBaseUrl, queryClient }) => {
  const navigate = useNavigate({ from: "/" });
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const res = await postData(data, apiBaseUrl);
    if (res.JWT == undefined) {
      toast({
        title: "Login Failed",
        description: res.Error,
      });
    } else {
      localStorage.setItem("access_token", res.JWT);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      router.invalidate();
      navigate({ to: "/" });
      toast({
        title: "Login Successful",
        description: res.Success,
      });
    }
  }

  return (
    <>
      <h1>Login</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Email here"
                    {...field}
                    className="mx-auto sm:w-1/2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Password here"
                    {...field}
                    className="mx-auto sm:w-1/2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </>
  );
};
