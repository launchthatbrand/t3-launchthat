"use client";

import { Doc, Id } from "@convex-config/_generated/dataModel";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui/toast";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Form schema
const paymentMethodSchema = z.object({
  // Account information
  accountName: z.string().min(1, "Account name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(4, "Account number must be at least 4 digits"),
  routingNumber: z.string().regex(/^\d{9}$/, "Routing number must be 9 digits"),
  accountType: z.enum(["checking", "savings"], {
    required_error: "Please select an account type",
  }),

  // Address information
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().default("US"),

  // Settings
  paymentProcessor: z.string().min(1, "Payment processor is required"),
  isDefault: z.boolean().default(false),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  bankAccountId?: Id<"bankAccounts">; // If provided, we're editing an existing account
  onSuccess: () => void;
  onCancel: () => void;
}

// Common US banks for selection
const commonBanks = [
  "Chase Bank",
  "Bank of America",
  "Wells Fargo",
  "Citibank",
  "US Bank",
  "PNC Bank",
  "Capital One",
  "TD Bank",
  "Bank of New York Mellon",
  "State Street Corporation",
  "Other",
];

// Payment processors
const paymentProcessors = [
  { value: "Stripe", label: "Stripe" },
  { value: "Authorize.Net", label: "Authorize.Net" },
  { value: "PayPal", label: "PayPal" },
  { value: "Square", label: "Square" },
];

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  bankAccountId,
  onSuccess,
  onCancel,
}) => {
  const createBankAccount = useMutation(api.ecommerce.createBankAccount);
  const updateBankAccount = useMutation(api.ecommerce.updateBankAccount);

  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      accountName: "",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      accountType: "checking",
      street1: "",
      street2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      paymentProcessor: "Stripe",
      isDefault: false,
    },
  });

  const isEditing = !!bankAccountId;

  const handleSubmit = async (data: PaymentMethodFormData) => {
    try {
      const addressData = {
        street1: data.street1,
        street2: data.street2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      };

      if (isEditing) {
        await updateBankAccount({
          bankAccountId: bankAccountId!,
          accountName: data.accountName,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          routingNumber: data.routingNumber,
          accountType: data.accountType,
          address: addressData,
          isDefault: data.isDefault,
        });
        toast.success("Bank account updated successfully");
      } else {
        await createBankAccount({
          accountName: data.accountName,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          routingNumber: data.routingNumber,
          accountType: data.accountType,
          address: addressData,
          paymentProcessor: data.paymentProcessor,
          isDefault: data.isDefault,
        });
        toast.success("Bank account added successfully");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving bank account:", error);
      toast.error(
        isEditing
          ? "Failed to update bank account"
          : "Failed to add bank account",
      );
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Account Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Information</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonBanks.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter account number"
                      />
                    </FormControl>
                    <FormDescription>
                      Your account number will be encrypted and secured
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="routingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routing Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123456789" maxLength={9} />
                    </FormControl>
                    <FormDescription>
                      9-digit bank routing number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isEditing && (
                <FormField
                  control={form.control}
                  name="paymentProcessor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Processor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select processor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentProcessors.map((processor) => (
                            <SelectItem
                              key={processor.value}
                              value={processor.value}
                            >
                              {processor.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Address Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address Information</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="street1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main Street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Street Address 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Apartment, suite, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="New York" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NY" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="10001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="US" disabled />
                    </FormControl>
                    <FormDescription>
                      Currently only US accounts are supported
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as default account</FormLabel>
                    <FormDescription>
                      This account will be used as the default for transfers
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Adding..."
                : isEditing
                  ? "Update Account"
                  : "Add Account"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
