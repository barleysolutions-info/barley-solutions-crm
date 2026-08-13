import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().trim().min(1, "Název firmy je povinný."),
  ico: z.string().trim().optional(),
  dic: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  legal_form: z.string().trim().optional(),
  contact_person: z.string().trim().optional(),
  email: z.union([z.literal(""), z.string().trim().email("Neplatný e-mail.")]).optional(),
  phone: z.string().trim().optional(),
  website: z.string().trim().optional(),
  niche: z.string().trim().optional(),
  source: z.enum(["cold", "warm", "referral"]),
  owner_rep_id: z.string().uuid("Vyber vlastníka leadu."),
  sourced_by_rep_id: z.string().uuid().optional().or(z.literal("")),
  value_czk: z.string().trim().optional(),
  customer_value_czk: z.string().trim().optional(),
  next_follow_up: z.string().trim().optional(),
  follow_up_note: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const EMPTY_LEAD_FORM: LeadFormValues = {
  name: "",
  ico: "",
  dic: "",
  address: "",
  city: "",
  zip: "",
  legal_form: "",
  contact_person: "",
  email: "",
  phone: "",
  website: "",
  niche: "",
  source: "cold",
  owner_rep_id: "",
  sourced_by_rep_id: "",
  value_czk: "",
  customer_value_czk: "",
  next_follow_up: "",
  follow_up_note: "",
  notes: "",
};
