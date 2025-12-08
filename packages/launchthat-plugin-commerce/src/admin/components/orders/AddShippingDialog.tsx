"use client";

import React, { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@acme/ui";

interface AddShippingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddShipping: (method: string, description: string, price: number) => void;
}

// Predefined shipping methods
const SHIPPING_METHODS = [
  {
    name: "Standard Shipping",
    description: "5-7 business days",
    defaultPrice: 9.99,
  },
  {
    name: "Express Shipping",
    description: "2-3 business days",
    defaultPrice: 19.99,
  },
  {
    name: "Overnight Shipping",
    description: "Next business day",
    defaultPrice: 29.99,
  },
  {
    name: "Free Shipping",
    description: "5-10 business days",
    defaultPrice: 0,
  },
  {
    name: "Local Pickup",
    description: "Pick up at store location",
    defaultPrice: 0,
  },
  {
    name: "Custom Shipping",
    description: "Custom shipping method",
    defaultPrice: 0,
  },
];

export function AddShippingDialog({
  open,
  onOpenChange,
  onAddShipping,
}: AddShippingDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [customMethod, setCustomMethod] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);

  // Handle method selection
  const handleMethodChange = (value: string) => {
    setSelectedMethod(value);

    if (value === "Custom Shipping") {
      setCustomMethod("");
      setDescription("");
      setPrice(0);
    } else {
      const method = SHIPPING_METHODS.find((m) => m.name === value);
      if (method) {
        setCustomMethod("");
        setDescription(method.description);
        setPrice(method.defaultPrice);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalMethod =
      selectedMethod === "Custom Shipping" ? customMethod : selectedMethod;

    if (!finalMethod || !description || price < 0) {
      return; // Basic validation
    }

    onAddShipping(finalMethod, description, price);

    // Reset form
    setSelectedMethod("");
    setCustomMethod("");
    setDescription("");
    setPrice(0);
  };

  // Handle dialog close
  const handleClose = () => {
    setSelectedMethod("");
    setCustomMethod("");
    setDescription("");
    setPrice(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Shipping</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shipping Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="shipping-method">Shipping Method</Label>
            <Select value={selectedMethod} onValueChange={handleMethodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select shipping method" />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING_METHODS.map((method) => (
                  <SelectItem key={method.name} value={method.name}>
                    <div className="flex flex-col">
                      <span>{method.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {method.description} - ${method.defaultPrice.toFixed(2)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Method Name (only show if Custom Shipping selected) */}
          {selectedMethod === "Custom Shipping" && (
            <div className="space-y-2">
              <Label htmlFor="custom-method">Custom Method Name</Label>
              <Input
                id="custom-method"
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                placeholder="Enter custom shipping method name"
                required
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter shipping description"
              rows={2}
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !selectedMethod ||
                (selectedMethod === "Custom Shipping" && !customMethod)
              }
            >
              Add Shipping
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
