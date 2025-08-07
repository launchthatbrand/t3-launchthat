"use client";

import React, { useState } from "react";
import { Check, Edit3, X } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
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

import type { OrderFormData } from "./OrderForm";

interface OrderAddressSectionProps {
  formData: OrderFormData;
  onInputChange: (field: string, value: string) => void;
  onFormDataChange: (updater: (prev: OrderFormData) => OrderFormData) => void;
  showShipping?: boolean; // New prop to control shipping section visibility
  showPayment?: boolean; // New prop to control payment section visibility
}

export function OrderAddressSection({
  formData,
  onInputChange,
  onFormDataChange,
  showShipping = true,
  showPayment = true,
}: OrderAddressSectionProps) {
  const [editingBilling, setEditingBilling] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);

  // Helper to format address for display
  const formatAddress = (address: OrderFormData["billingAddress"]) => {
    const parts = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      `${address.city}${address.stateOrProvince ? `, ${address.stateOrProvince}` : ""} ${address.postalCode}`,
      address.country !== "US" ? address.country : "",
      address.phoneNumber,
    ].filter(Boolean);

    return parts.length > 0 ? parts : ["No address set"];
  };

  const formatEmail = () => {
    return formData.email || "No email address";
  };

  const handleCopyBillingToShipping = () => {
    onFormDataChange((prev) => ({
      ...prev,
      shippingAddress: { ...prev.billingAddress },
    }));
    toast.success("Billing address copied to shipping");
  };

  const handleLoadBillingAddress = () => {
    // This would typically load from user's saved addresses
    toast.info("Load billing address feature coming soon");
  };

  return (
    <div className="grid min-w-[66.66%] grid-cols-2 gap-8">
      {/* Billing Section */}
      <Card className="border-none p-0 shadow-none">
        <CardHeader className="p-0 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Billing</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingBilling(!editingBilling)}
            >
              {editingBilling ? (
                <X className="h-4 w-4" />
              ) : (
                <Edit3 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!editingBilling ? (
            // Display mode
            <div className="space-y-2 text-sm">
              <div className="space-y-1">
                {formatAddress(formData.billingAddress).map((line, index) => (
                  <div
                    key={index}
                    className={
                      index === 0 ? "font-medium" : "text-muted-foreground"
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div className="border-t pt-2">
                <div className="text-muted-foreground">Email address:</div>
                <div className="text-blue-600 underline">{formatEmail()}</div>
              </div>
              {formData.billingAddress.phoneNumber && (
                <div>
                  <div className="text-muted-foreground">Phone:</div>
                  <div className="text-blue-600 underline">
                    {formData.billingAddress.phoneNumber}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Edit mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="billingFirstName" className="text-xs">
                    First name
                  </Label>
                  <Input
                    id="billingFirstName"
                    value={formData.billingAddress.fullName.split(" ")[0] ?? ""}
                    onChange={(e) => {
                      const lastName = formData.billingAddress.fullName
                        .split(" ")
                        .slice(1)
                        .join(" ");
                      onInputChange(
                        "billingAddress.fullName",
                        `${e.target.value} ${lastName}`.trim(),
                      );
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="billingLastName" className="text-xs">
                    Last name
                  </Label>
                  <Input
                    id="billingLastName"
                    value={
                      formData.billingAddress.fullName
                        .split(" ")
                        .slice(1)
                        .join(" ") ?? ""
                    }
                    onChange={(e) => {
                      const firstName =
                        formData.billingAddress.fullName.split(" ")[0] || "";
                      onInputChange(
                        "billingAddress.fullName",
                        `${firstName} ${e.target.value}`.trim(),
                      );
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="billingCompany" className="text-xs">
                  Company (optional)
                </Label>
                <Input
                  id="billingCompany"
                  value={formData.company}
                  onChange={(e) => onInputChange("company", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="billingAddress1" className="text-xs">
                  Address
                </Label>
                <Input
                  id="billingAddress1"
                  value={formData.billingAddress.addressLine1}
                  onChange={(e) =>
                    onInputChange("billingAddress.addressLine1", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="billingAddress2" className="text-xs">
                  Apartment, suite, etc. (optional)
                </Label>
                <Input
                  id="billingAddress2"
                  value={formData.billingAddress.addressLine2}
                  onChange={(e) =>
                    onInputChange("billingAddress.addressLine2", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="billingCity" className="text-xs">
                    City
                  </Label>
                  <Input
                    id="billingCity"
                    value={formData.billingAddress.city}
                    onChange={(e) =>
                      onInputChange("billingAddress.city", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="billingState" className="text-xs">
                    State
                  </Label>
                  <Input
                    id="billingState"
                    value={formData.billingAddress.stateOrProvince}
                    onChange={(e) =>
                      onInputChange(
                        "billingAddress.stateOrProvince",
                        e.target.value,
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="billingPostal" className="text-xs">
                    ZIP code
                  </Label>
                  <Input
                    id="billingPostal"
                    value={formData.billingAddress.postalCode}
                    onChange={(e) =>
                      onInputChange("billingAddress.postalCode", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="billingCountry" className="text-xs">
                  Country/Region
                </Label>
                <Select
                  value={formData.billingAddress.country}
                  onValueChange={(value) =>
                    onInputChange("billingAddress.country", value)
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="billingPhone" className="text-xs">
                  Phone
                </Label>
                <Input
                  id="billingPhone"
                  value={formData.billingAddress.phoneNumber}
                  onChange={(e) =>
                    onInputChange("billingAddress.phoneNumber", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadBillingAddress}
                  className="text-xs"
                >
                  Load billing address
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingBilling(false)}
                  className="text-xs"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Section */}
      {showShipping && (
        <Card className="border-none p-0 shadow-none">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Shipping</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingShipping(!editingShipping)}
              >
                {editingShipping ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Edit3 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!editingShipping ? (
              // Display mode
              <div className="space-y-2 text-sm">
                <div className="space-y-1">
                  {formData.shippingAddress.addressLine1 ? (
                    formatAddress(formData.shippingAddress).map(
                      (line, index) => (
                        <div
                          key={index}
                          className={
                            index === 0
                              ? "font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {line}
                        </div>
                      ),
                    )
                  ) : (
                    <div className="text-muted-foreground">
                      No shipping address set.
                    </div>
                  )}
                </div>
                {formData.shippingAddress.phoneNumber && (
                  <div className="border-t pt-2">
                    <div className="text-muted-foreground">Phone:</div>
                    <div className="text-blue-600 underline">
                      {formData.shippingAddress.phoneNumber}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Edit mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="shippingFirstName" className="text-xs">
                      First name
                    </Label>
                    <Input
                      id="shippingFirstName"
                      value={
                        formData.shippingAddress.fullName.split(" ")[0] || ""
                      }
                      onChange={(e) => {
                        const lastName = formData.shippingAddress.fullName
                          .split(" ")
                          .slice(1)
                          .join(" ");
                        onInputChange(
                          "shippingAddress.fullName",
                          `${e.target.value} ${lastName}`.trim(),
                        );
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingLastName" className="text-xs">
                      Last name
                    </Label>
                    <Input
                      id="shippingLastName"
                      value={
                        formData.shippingAddress.fullName
                          .split(" ")
                          .slice(1)
                          .join(" ") || ""
                      }
                      onChange={(e) => {
                        const firstName =
                          formData.shippingAddress.fullName.split(" ")[0] || "";
                        onInputChange(
                          "shippingAddress.fullName",
                          `${firstName} ${e.target.value}`.trim(),
                        );
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shippingAddress1" className="text-xs">
                    Address
                  </Label>
                  <Input
                    id="shippingAddress1"
                    value={formData.shippingAddress.addressLine1}
                    onChange={(e) =>
                      onInputChange(
                        "shippingAddress.addressLine1",
                        e.target.value,
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingAddress2" className="text-xs">
                    Apartment, suite, etc. (optional)
                  </Label>
                  <Input
                    id="shippingAddress2"
                    value={formData.shippingAddress.addressLine2}
                    onChange={(e) =>
                      onInputChange(
                        "shippingAddress.addressLine2",
                        e.target.value,
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="shippingCity" className="text-xs">
                      City
                    </Label>
                    <Input
                      id="shippingCity"
                      value={formData.shippingAddress.city}
                      onChange={(e) =>
                        onInputChange("shippingAddress.city", e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingState" className="text-xs">
                      State
                    </Label>
                    <Input
                      id="shippingState"
                      value={formData.shippingAddress.stateOrProvince}
                      onChange={(e) =>
                        onInputChange(
                          "shippingAddress.stateOrProvince",
                          e.target.value,
                        )
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingPostal" className="text-xs">
                      ZIP code
                    </Label>
                    <Input
                      id="shippingPostal"
                      value={formData.shippingAddress.postalCode}
                      onChange={(e) =>
                        onInputChange(
                          "shippingAddress.postalCode",
                          e.target.value,
                        )
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shippingCountry" className="text-xs">
                    Country/Region
                  </Label>
                  <Select
                    value={formData.shippingAddress.country}
                    onValueChange={(value) =>
                      onInputChange("shippingAddress.country", value)
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shippingPhone" className="text-xs">
                    Phone
                  </Label>
                  <Input
                    id="shippingPhone"
                    value={formData.shippingAddress.phoneNumber}
                    onChange={(e) =>
                      onInputChange(
                        "shippingAddress.phoneNumber",
                        e.target.value,
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBillingToShipping}
                    className="text-xs"
                  >
                    Copy billing address to shipping
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingShipping(false)}
                    className="text-xs"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Done
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Section */}
      {showPayment && (
        <Card className="border-none p-0 shadow-none">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payment</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Placeholder for payment editing logic
                  toast.info("Payment editing feature coming soon");
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                Payment method: {formData.paymentMethod ?? "Not specified"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
