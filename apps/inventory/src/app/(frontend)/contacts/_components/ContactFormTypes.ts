import { z } from "zod";

// Define form schema with Zod
export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  notes: z.string().optional(),
  customerType: z
    .enum(["lead", "prospect", "customer", "former-customer", "partner"])
    .optional(),
  leadStatus: z
    .enum([
      "new",
      "contacted",
      "qualified",
      "proposal",
      "negotiation",
      "won",
      "lost",
      "dormant",
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  // Additional fields could be added for address, social profiles, etc.
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export interface ContactFormProps {
  initialData?: Partial<ContactFormValues>;
  onSubmit: (data: ContactFormValues) => void;
  isSubmitting: boolean;
}
