"use client";

import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { useEffect, useState } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { cn } from "@acme/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof formSchema>;

export interface SSOProvider {
  id: string;
  name: string;
  icon?: React.ElementType;
  iconPath?: string;
  signIn?: () => Promise<void> | void;
}

export interface LoginFormProps {
  className?: string;
  providers?: SSOProvider[];
  title?: string;
  description?: string;
  onSubmit?: (data: LoginFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  forgotPasswordLabel?: string;
  signUpLabel?: string;
}

export function LoginForm({
  className,
  providers = [],
  title = "Welcome back",
  description = "Sign in to your account",
  onSubmit: customOnSubmit,
  isSubmitting,
  onForgotPassword,
  onSignUp,
  forgotPasswordLabel = "Forgot your password?",
  signUpLabel = "Sign up",
}: LoginFormProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  async function handleSubmit(data: LoginFormValues) {
    if (!customOnSubmit) return;
    setInternalLoading(true);
    try {
      await customOnSubmit(data);
    } finally {
      setInternalLoading(false);
    }
  }

  const pending = isSubmitting ?? internalLoading;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {providers.length > 0 && (
          <>
            <div className="grid gap-2">
              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="w-full"
                  disabled={pending}
                  onClick={() => {
                    if (provider.signIn) {
                      const result = provider.signIn();
                      if (result instanceof Promise) {
                        void result;
                      }
                    }
                  }}
                >
                  {provider.icon && <provider.icon className="mr-2 h-4 w-4" />}
                  Sign in with {provider.name}
                </Button>
              ))}
            </div>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="m@example.com"
                      type="email"
                      disabled={pending}
                      {...field}
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    {onForgotPassword ? (
                      <button
                        type="button"
                        className="text-sm underline-offset-4 hover:underline"
                        onClick={onForgotPassword}
                      >
                        {forgotPasswordLabel}
                      </button>
                    ) : null}
                  </div>
                  <FormControl>
                    <Input type="password" disabled={pending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Login"}
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          {onSignUp ? (
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={onSignUp}
            >
              {signUpLabel}
            </button>
          ) : (
            <span className="underline underline-offset-4">{signUpLabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
