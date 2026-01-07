import { z } from "zod";

const normalizeDigits = (value: string): string => value.replace(/\D/g, "");

export const checkoutAddressSchema = z.object({
  country: z.string().trim().min(1, "Country is required."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine(
      (v) => normalizeDigits(v).length >= 7,
      "Phone number looks invalid.",
    ),
  address1: z.string().trim().min(1, "Address is required."),
  address2: z.string().trim().optional().default(""),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State/Province is required."),
  postcode: z.string().trim().min(1, "Postal code is required."),
});

// A permissive "draft" schema for delivery address. We only enforce required
// address rules when `shipToDifferentAddress` is enabled.
const checkoutAddressDraftSchema = z.object({
  country: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
});

export const createCheckoutFormSchema = (opts: {
  allowDifferentShipping: boolean;
  requiresPaymentMethod: boolean;
  allowedPaymentMethodIds: Array<string>;
}) => {
  const {
    allowDifferentShipping,
    requiresPaymentMethod,
    allowedPaymentMethodIds,
  } = opts;

  return z
    .object({
      email: z.string().trim().email("Enter a valid email address."),
      paymentMethodId: z.string().trim(),
      shipToDifferentAddress: z.boolean().default(false),
      shipping: checkoutAddressSchema,
      delivery: checkoutAddressDraftSchema.default({}),
    })
    .superRefine((values, ctx) => {
      if (!allowDifferentShipping && values.shipToDifferentAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["shipToDifferentAddress"],
          message:
            "Shipping to a different address is not available for this cart.",
        });
      }

      if (values.shipToDifferentAddress) {
        const parsed = checkoutAddressSchema.safeParse(values.delivery);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            ctx.addIssue({
              ...issue,
              path: ["delivery", ...(issue.path ?? [])],
            });
          }
        }
      }

      if (requiresPaymentMethod) {
        const id = values.paymentMethodId.trim();
        if (!id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["paymentMethodId"],
            message: "Please choose a payment method.",
          });
        } else if (
          allowedPaymentMethodIds.length > 0 &&
          !allowedPaymentMethodIds.includes(id)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["paymentMethodId"],
            message: "Selected payment method is not available.",
          });
        }
      }
    });
};

export type CheckoutFormValues = z.infer<
  ReturnType<typeof createCheckoutFormSchema>
>;
