"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useState, useTransition } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import type { PluginSingleViewComponentProps } from "launchthat-plugin-core";
import { Switch } from "@acme/ui/switch";
import { toast } from "sonner";

export const CourseLinkedProductTab = ({
  pluginName,
}: PluginSingleViewComponentProps) => {
  const [isSaving, startTransition] = useTransition();
  const [productId, setProductId] = useState<string>("");
  const [requiresPurchase, setRequiresPurchase] = useState(true);

  const handleSave = () => {
    if (!productId) {
      toast.error("Select or enter a product to link");
      return;
    }

    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Product link saved", {
        description: `Simulated via ${pluginName}. Replace with actual commerce mutation.`,
      });
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Link a product</CardTitle>
          <CardDescription>
            Tie this course to a storefront listing for access and checkout
            flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select storefront product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prod_101">Design Bootcamp</SelectItem>
                  <SelectItem value="prod_102">Business Bundle</SelectItem>
                  <SelectItem value="prod_103">Lifetime Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-product">Custom product ID</Label>
              <Input
                id="custom-product"
                placeholder="Optional: paste product identifier"
                onChange={(event) => setProductId(event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Require purchase</p>
              <p className="text-xs text-muted-foreground">
                Toggle to grant free access (e.g., for internal teams).
              </p>
            </div>
            <Switch
              checked={requiresPurchase}
              onCheckedChange={setRequiresPurchase}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save product link"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

