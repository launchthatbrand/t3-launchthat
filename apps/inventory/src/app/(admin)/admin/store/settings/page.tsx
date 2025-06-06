"use client";

import { useState } from "react";
import { Check, Save } from "lucide-react";

import { Switch } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

export default function OrderSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // These would typically be loaded from your database or state management
  const [settings, setSettings] = useState({
    autoConfirmOrders: true,
    sendEmailNotifications: true,
    defaultOrderStatus: "pending_payment",
    taxRate: "8",
    shippingRate: "5",
    freeShippingThreshold: "50",
    currencyCode: "USD",
    inventoryManagement: true,
  });

  const handleSaveSettings = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Order Settings</h2>
        <p className="text-muted-foreground">
          Configure how orders are processed and managed
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure general order processing settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-confirm">Auto-confirm orders</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically confirm orders after payment is received
                </p>
              </div>
              <Switch
                id="auto-confirm"
                checked={settings.autoConfirmOrders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoConfirmOrders: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send email notifications for order status changes
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.sendEmailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, sendEmailNotifications: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-status">Default order status</Label>
              <Select
                value={settings.defaultOrderStatus}
                onValueChange={(value) =>
                  setSettings({ ...settings, defaultOrderStatus: value })
                }
              >
                <SelectTrigger id="default-status">
                  <SelectValue placeholder="Select default status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_payment">
                    Pending Payment
                  </SelectItem>
                  <SelectItem value="pending_fulfillment">
                    Pending Fulfillment
                  </SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Shipping</CardTitle>
            <CardDescription>
              Configure tax, shipping, and currency settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                value={settings.taxRate}
                onChange={(e) =>
                  setSettings({ ...settings, taxRate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-rate">Flat Shipping Rate ($)</Label>
              <Input
                id="shipping-rate"
                type="number"
                min="0"
                value={settings.shippingRate}
                onChange={(e) =>
                  setSettings({ ...settings, shippingRate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="free-shipping">Free Shipping Threshold ($)</Label>
              <Input
                id="free-shipping"
                type="number"
                min="0"
                value={settings.freeShippingThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    freeShippingThreshold: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Orders above this amount qualify for free shipping
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={settings.currencyCode}
                onValueChange={(value) =>
                  setSettings({ ...settings, currencyCode: value })
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>
              Configure how inventory is managed with orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inventory-management">
                  Enable inventory management
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically reduce inventory when orders are placed
                </p>
              </div>
              <Switch
                id="inventory-management"
                checked={settings.inventoryManagement}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, inventoryManagement: checked })
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
