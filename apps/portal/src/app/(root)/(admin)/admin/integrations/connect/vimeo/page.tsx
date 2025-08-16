"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@acme/ui";

import { env } from "~/env";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Connection name must be at least 2 characters.",
  }),
  playlistIds: z.string().optional(),
  categories: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VIMEO_APP = {
  name: "Vimeo",
  description: "Connect to Vimeo to sync videos and playlists.",
  authType: "oauth",
  configTemplate: JSON.stringify({
    playlistIds: { type: "string", label: "Playlist IDs", required: false },
    categories: { type: "string", label: "Categories", required: false },
  }),
  isEnabled: true,
};

export default function VimeoConnectionPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);
  const [oauthToken, setOauthToken] = useState<string | null>(null);

  const apps =
    useQuery(api.integrations.apps.queries.list, { showDisabled: false }) ?? [];
  const vimeoApp = apps.find(
    (app: Doc<"apps">) => app.name.toLowerCase() === "vimeo",
  );

  const createApp = useMutation(api.integrations.apps.mutations.create);
  const createConnection = useMutation(
    api.integrations.connections.mutations.create,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      playlistIds: "",
      categories: "",
    },
  });

  // Detect OAuth callback with ?code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    const exchange = async () => {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/integrations/vimeo/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) throw new Error("Failed to exchange code");
        const data = await res.json();
        setOauthToken(data.access_token);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };

    exchange();
  }, []);

  const startOAuth = () => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.NEXT_PUBLIC_VIMEO_CLIENT_ID,
      redirect_uri: `${window.location.origin}/integrations/connect/vimeo`,
      scope: "public private video_files",
      state: "" + Date.now(),
    });
    window.location.href = `https://api.vimeo.com/oauth/authorize?${params.toString()}`;
  };

  const ensureVimeoApp = async (): Promise<string> => {
    if (vimeoApp) return vimeoApp._id;
    setDebug((p) => `${p ?? ""}\nCreating Vimeo app...`);
    return await createApp({ ...DEFAULT_VIMEO_APP });
  };

  const handleSave = async (values: FormValues) => {
    if (!oauthToken) throw new Error("Authorize with Vimeo first");

    setIsProcessing(true);
    try {
      const appId = await ensureVimeoApp();
      const credentials = JSON.stringify({
        accessToken: oauthToken,
        playlistIds: values.playlistIds,
        categories: values.categories,
      });
      await createConnection({
        appId,
        name: values.name,
        ownerId: "system",
        credentials,
        status: "active",
      });
      router.push("/integrations?tab=connections");
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-2"
        onClick={() => router.push("/integrations")}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Integrations
      </Button>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Connect Vimeo</CardTitle>
          <CardDescription>
            Authorize with Vimeo to allow the portal to fetch your videos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connection Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Vimeo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="playlistIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlist IDs</FormLabel>
                    <FormControl>
                      <Input placeholder="123,456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <FormControl>
                      <Input placeholder="education,tech" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* If we already have an OAuth code flow token handled, allow saving */}
              {oauthToken ? (
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Connection
                </Button>
              ) : (
                <Button type="button" onClick={startOAuth} className="w-full">
                  Connect with Vimeo
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {debug && (
        <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-4 text-xs">
          {debug}
        </pre>
      )}
    </div>
  );
}
