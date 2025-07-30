"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { CheckCircle, Package, Settings, Star, User } from "lucide-react";
import type {
  MultiPageDialogConfig,
  MultiPageDialogStepProps,
} from "@acme/ui/multi-page-dialog";
import React, { useState } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { MultiPageDialog } from "@acme/ui/multi-page-dialog";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";

// Helper function to safely convert unknown values to strings
const safeString = (value: unknown): string => {
  if (value == null) return "";
  return String(value);
};

export default function MultiPageDialogTestPage() {
  const [completedData, setCompletedData] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Simple wizard configuration
  const simpleWizardConfig: MultiPageDialogConfig = {
    title: "Quick Setup Wizard",
    description: "Get started in just a few steps",
    showStepIndicator: true,
    showProgress: true,
    steps: [
      {
        id: "welcome",
        title: "Welcome",
        description: "Let's get you started",
        component: WelcomeStep,
      },
      {
        id: "settings",
        title: "Basic Settings",
        description: "Configure your preferences",
        component: SettingsStep,
      },
      {
        id: "complete",
        title: "Complete",
        description: "You're all set!",
        component: CompleteStep,
        showNext: false,
      },
    ],
    onComplete: (data) => {
      console.log("Simple wizard completed:", data);
      setCompletedData(data);
    },
  };

  // Complex form configuration
  const complexFormConfig: MultiPageDialogConfig = {
    title: "User Registration",
    description: "Complete your profile setup in a few simple steps",
    showStepIndicator: true,
    showProgress: true,
    size: "xl",
    initialData: {
      // Personal Info
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",

      // Address
      address: "123 Main Street",
      city: "San Francisco",
      state: "California",
      zipCode: "94102",
      country: "United States",

      // Payment
      cardNumber: "4532 1234 5678 9012",
      expiryMonth: "12",
      expiryYear: "25",
      cvv: "123",
      cardholderName: "John Doe",

      // Preferences
      bio: "I'm a software developer who loves building great user experiences. I enjoy working with modern web technologies and am passionate about creating accessible, performant applications.",
      interests: ["Technology", "Music", "Travel"],
      newsletter: true,
    },
    steps: [
      {
        id: "personal",
        title: "Personal Information",
        description: "Tell us about yourself",
        component: PersonalInfoStep,
        validation: (data) => {
          return !!(
            safeString(data.firstName).trim() &&
            safeString(data.lastName).trim() &&
            safeString(data.email).trim()
          );
        },
      },
      {
        id: "address",
        title: "Address",
        description: "Where are you located?",
        component: AddressStep,
        validation: (data) => {
          return !!(
            safeString(data.address).trim() && safeString(data.city).trim()
          );
        },
      },
      {
        id: "payment",
        title: "Payment Information",
        description: "Secure payment details",
        component: PaymentStep,
        optional: true,
      },
      {
        id: "preferences",
        title: "Preferences",
        description: "Customize your experience",
        component: PreferencesStep,
      },
      {
        id: "review",
        title: "Review & Submit",
        description: "Confirm your information",
        component: ReviewStep,
        showNext: false,
      },
    ],
    onComplete: (data) => {
      console.log("Complex form completed:", data);
      setCompletedData(data);
    },
  };

  // Data-driven configuration
  const dataDrivenConfig: MultiPageDialogConfig = {
    title: "Dynamic Workflow",
    description: "Steps that pass data between each other",
    showStepIndicator: true,
    showProgress: false,
    steps: [
      {
        id: "select-package",
        title: "Select Package",
        description: "Choose your plan",
        component: PackageSelectionStep,
      },
      {
        id: "customize",
        title: "Customize",
        description: "Tailor your selection",
        component: CustomizationStep,
      },
      {
        id: "summary",
        title: "Order Summary",
        description: "Review your order",
        component: OrderSummaryStep,
        showNext: false,
      },
    ],
    onComplete: (data) => {
      console.log("Data-driven workflow completed:", data);
      setCompletedData(data);
    },
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Multi-Page Dialog Showcase</h1>
        <p className="mt-2 text-muted-foreground">
          Explore different multi-step dialog configurations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Simple Wizard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Simple Wizard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A basic 3-step wizard with welcome, settings, and completion
              steps.
            </p>
            <div className="space-y-2">
              <Badge variant="secondary">Step Indicators</Badge>
              <Badge variant="secondary">Progress Bar</Badge>
              <Badge variant="secondary">Validation</Badge>
            </div>
            <MultiPageDialog
              config={simpleWizardConfig}
              trigger={
                <Button className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Start Simple Wizard
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Complex Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Complex Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A comprehensive 5-step registration form with validation and
              optional steps.
            </p>
            <div className="space-y-2">
              <Badge variant="secondary">Form Validation</Badge>
              <Badge variant="secondary">Optional Steps</Badge>
              <Badge variant="secondary">Large Dialog</Badge>
            </div>
            <MultiPageDialog
              config={complexFormConfig}
              trigger={
                <Button className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  Start Registration
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Data-Driven */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Data-Driven
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A workflow where data flows between steps to create dynamic
              experiences.
            </p>
            <div className="space-y-2">
              <Badge variant="secondary">Dynamic Content</Badge>
              <Badge variant="secondary">Data Flow</Badge>
              <Badge variant="secondary">Conditional Logic</Badge>
            </div>
            <MultiPageDialog
              config={dataDrivenConfig}
              trigger={
                <Button className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  Configure Package
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {completedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Last Completed Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-4 text-sm">
              {JSON.stringify(completedData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Step Components

function WelcomeStep({ goNext }: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
        <Star className="h-10 w-10 text-blue-600" />
      </div>
      <div>
        <h3 className="text-lg font-medium">Welcome to the Setup Wizard</h3>
        <p className="text-muted-foreground">
          We'll help you get everything configured in just a few simple steps.
        </p>
      </div>
      <Button onClick={goNext} className="w-full">
        Get Started
      </Button>
    </div>
  );
}

function SettingsStep({ data, updateData }: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Basic Settings</h3>
        <p className="text-muted-foreground">
          Configure your basic preferences
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={safeString(data.username)}
            onChange={(e) => updateData({ username: e.target.value })}
            placeholder="Enter your username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Theme Preference</Label>
          <select
            id="theme"
            value={safeString(data.theme)}
            onChange={(e) => updateData({ theme: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="notifications"
            checked={Boolean(data.notifications)}
            onCheckedChange={(checked) =>
              updateData({ notifications: checked })
            }
          />
          <Label htmlFor="notifications">Enable notifications</Label>
        </div>
      </div>
    </div>
  );
}

function CompleteStep(_props: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-medium">Setup Complete!</h3>
        <p className="text-muted-foreground">
          Your configuration has been saved successfully.
        </p>
      </div>
    </div>
  );
}

function PersonalInfoStep({ data, updateData }: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Personal Information</h3>
        <p className="text-muted-foreground">
          Please provide your basic information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={safeString(data.firstName)}
            onChange={(e) => updateData({ firstName: e.target.value })}
            placeholder="John"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={safeString(data.lastName)}
            onChange={(e) => updateData({ lastName: e.target.value })}
            placeholder="Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={safeString(data.email)}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={safeString(data.phone)}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>
    </div>
  );
}

function AddressStep({ data, updateData }: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Address Information</h3>
        <p className="text-muted-foreground">Where are you located?</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={safeString(data.address)}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={safeString(data.city)}
              onChange={(e) => updateData({ city: e.target.value })}
              placeholder="San Francisco"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={safeString(data.state)}
              onChange={(e) => updateData({ state: e.target.value })}
              placeholder="California"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
            <Input
              id="zipCode"
              value={safeString(data.zipCode)}
              onChange={(e) => updateData({ zipCode: e.target.value })}
              placeholder="94102"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={safeString(data.country)}
              onChange={(e) => updateData({ country: e.target.value })}
              placeholder="United States"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentStep({ data, updateData }: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Payment Information</h3>
        <p className="text-muted-foreground">
          This step is optional and can be completed later
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            value={safeString(data.cardNumber)}
            onChange={(e) => updateData({ cardNumber: e.target.value })}
            placeholder="1234 5678 9012 3456"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryMonth">Month</Label>
            <select
              id="expiryMonth"
              value={safeString(data.expiryMonth)}
              onChange={(e) => updateData({ expiryMonth: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryYear">Year</Label>
            <select
              id="expiryYear"
              value={safeString(data.expiryYear)}
              onChange={(e) => updateData({ expiryYear: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">YY</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option
                  key={i}
                  value={String(new Date().getFullYear() + i).slice(-2)}
                >
                  {String(new Date().getFullYear() + i).slice(-2)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              value={safeString(data.cvv)}
              onChange={(e) => updateData({ cvv: e.target.value })}
              placeholder="123"
              maxLength={4}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardholderName">Cardholder Name</Label>
          <Input
            id="cardholderName"
            value={safeString(data.cardholderName)}
            onChange={(e) => updateData({ cardholderName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
      </div>
    </div>
  );
}

function PreferencesStep({ data, updateData }: MultiPageDialogStepProps) {
  const availableInterests = [
    "Technology",
    "Music",
    "Sports",
    "Travel",
    "Cooking",
    "Reading",
    "Gaming",
    "Art",
  ];

  const currentInterests = Array.isArray(data.interests) ? data.interests : [];

  const toggleInterest = (interest: string) => {
    const interests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];
    updateData({ interests });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Preferences</h3>
        <p className="text-muted-foreground">
          Customize your experience with us
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={safeString(data.bio)}
            onChange={(e) => updateData({ bio: e.target.value })}
            placeholder="Tell us a bit about yourself..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Interests</Label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {availableInterests.map((interest) => (
              <Button
                key={interest}
                variant={
                  currentInterests.includes(interest) ? "secondary" : "outline"
                }
                size="sm"
                onClick={() => toggleInterest(interest)}
                className="justify-start"
              >
                {interest}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="newsletter"
            checked={Boolean(data.newsletter)}
            onCheckedChange={(checked) => updateData({ newsletter: checked })}
          />
          <Label htmlFor="newsletter">Subscribe to newsletter</Label>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ data }: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Review Your Information</h3>
        <p className="text-muted-foreground">
          Please review your information before submitting
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="mb-2 font-medium">Personal Information</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Name: {safeString(data.firstName)} {safeString(data.lastName)}
            </p>
            <p>Email: {safeString(data.email)}</p>
            <p>Phone: {safeString(data.phone)}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2 font-medium">Address</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{safeString(data.address)}</p>
            <p>
              {safeString(data.city)}, {safeString(data.state)}{" "}
              {safeString(data.zipCode)}
            </p>
            <p>{safeString(data.country)}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2 font-medium">Preferences</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Bio: {safeString(data.bio || "Not provided")}</p>
            <p>
              Interests:{" "}
              {Array.isArray(data.interests)
                ? data.interests.join(", ")
                : "None selected"}
            </p>
            <p>Newsletter: {data.newsletter ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackageSelectionStep({ data, updateData }: MultiPageDialogStepProps) {
  const packages = [
    {
      id: "basic",
      name: "Basic",
      price: 9.99,
      features: ["Feature A", "Feature B"],
    },
    {
      id: "pro",
      name: "Pro",
      price: 19.99,
      features: ["Feature A", "Feature B", "Feature C"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 49.99,
      features: ["All Features", "Priority Support"],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Choose Your Package</h3>
        <p className="text-muted-foreground">
          Select the plan that works best for you
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              data.selectedPackage === pkg.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() =>
              updateData({
                selectedPackage: pkg.id,
                packageName: pkg.name,
                packagePrice: pkg.price,
              })
            }
          >
            <CardHeader>
              <CardTitle>{pkg.name}</CardTitle>
              <div className="text-2xl font-bold">${pkg.price}/mo</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {pkg.features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CustomizationStep({ data, updateData }: MultiPageDialogStepProps) {
  const addons = [
    { id: "storage", name: "Extra Storage", price: 5 },
    { id: "support", name: "Priority Support", price: 10 },
    { id: "analytics", name: "Advanced Analytics", price: 15 },
  ];

  const selectedAddons = Array.isArray(data.addons) ? data.addons : [];

  const toggleAddon = (addon: (typeof addons)[0]) => {
    const isSelected = selectedAddons.some((a: any) => a.id === addon.id);
    const newAddons = isSelected
      ? selectedAddons.filter((a: any) => a.id !== addon.id)
      : [...selectedAddons, addon];
    updateData({ addons: newAddons });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Customize Your Package</h3>
        <p className="text-muted-foreground">
          Selected: {safeString(data.packageName)} - $
          {safeString(data.packagePrice)}/mo
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Add-ons</h4>
        {addons.map((addon) => {
          const isSelected = selectedAddons.some((a: any) => a.id === addon.id);
          return (
            <div
              key={addon.id}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 ${
                isSelected ? "bg-muted" : ""
              }`}
              onClick={() => toggleAddon(addon)}
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleAddon(addon)}
                />
                <span>{addon.name}</span>
              </div>
              <span className="font-medium">+${addon.price}/mo</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderSummaryStep({ data }: MultiPageDialogStepProps) {
  const basePrice = Number(data.packagePrice) || 0;
  const addons = Array.isArray(data.addons) ? data.addons : [];
  const addonsTotal = addons.reduce(
    (sum: number, addon: any) => sum + (addon.price || 0),
    0,
  );
  const total = basePrice + addonsTotal;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Order Summary</h3>
        <p className="text-muted-foreground">Review your selection</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span>{safeString(data.packageName)} Package</span>
          <span>${basePrice.toFixed(2)}/mo</span>
        </div>

        {addons.length > 0 && (
          <>
            <Separator />
            {addons.map((addon: any, index: number) => (
              <div
                key={index}
                className="flex justify-between text-sm text-muted-foreground"
              >
                <span>{addon.name}</span>
                <span>+${(addon.price || 0).toFixed(2)}/mo</span>
              </div>
            ))}
          </>
        )}

        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${total.toFixed(2)}/mo</span>
        </div>
      </div>
    </div>
  );
}
