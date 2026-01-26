"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui";

import type { ContactFormValues, ContactMetaRow, ContactRow } from "../types";

type ContactEditorProps = {
  contactId?: string;
  getContactQuery: unknown;
  getContactMetaQuery: unknown;
  createContactMutation: unknown;
  updateContactMutation: unknown;
  deleteContactMutation: unknown;
  onSaved?: (contactId: string) => void;
  onDeleted?: () => void;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyForm: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: "active",
  tags: "",
  notes: "",
};

const metaMap: Record<string, keyof ContactFormValues> = {
  "contact.firstName": "firstName",
  "contact.lastName": "lastName",
  "contact.email": "email",
  "contact.phone": "phone",
  "contact.notes": "notes",
};

const metaFromRows = (rows: ContactMetaRow[] | undefined): ContactFormValues => {
  const next = { ...emptyForm };
  if (!Array.isArray(rows)) return next;
  for (const row of rows) {
    const key = metaMap[row.key];
    if (!key) continue;
    const value =
      typeof row.value === "string"
        ? row.value
        : row.value === null || row.value === undefined
          ? ""
          : String(row.value);
    next[key] = value;
  }
  return next;
};

const buildMetaPayload = (values: ContactFormValues) => ({
  "contact.firstName": values.firstName.trim(),
  "contact.lastName": values.lastName.trim(),
  "contact.email": values.email.trim(),
  "contact.phone": values.phone.trim(),
  "contact.notes": values.notes.trim(),
});

export const ContactEditor = ({
  contactId,
  getContactQuery,
  getContactMetaQuery,
  createContactMutation,
  updateContactMutation,
  deleteContactMutation,
  onSaved,
  onDeleted,
}: ContactEditorProps) => {
  const contact = useQuery(
    getContactQuery as any,
    contactId ? { contactId } : "skip",
  ) as ContactRow | null | undefined;
  const metaRows = useQuery(
    getContactMetaQuery as any,
    contactId ? { contactId } : "skip",
  ) as ContactMetaRow[] | undefined;

  const createContact = useMutation(createContactMutation as any);
  const updateContact = useMutation(updateContactMutation as any);
  const deleteContact = useMutation(deleteContactMutation as any);

  const [form, setForm] = React.useState<ContactFormValues>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!contactId) {
      setForm(emptyForm);
      return;
    }
    if (!contact) return;

    const meta = metaFromRows(metaRows);
    const tags = Array.isArray(contact.tags) ? contact.tags.join(", ") : "";
    setForm({
      ...meta,
      status: contact.status || "active",
      tags,
    });
  }, [contactId, contact, metaRows]);

  const handleChange = (key: keyof ContactFormValues) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const nameFallback =
        `${form.firstName} ${form.lastName}`.trim() || form.email.trim() || "Contact";
      const title = nameFallback;
      const slug = slugify(title) || `contact-${Date.now()}`;
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (!contactId) {
        const created = await createContact({
          title,
          slug,
          status: form.status || "active",
          tags,
          meta: buildMetaPayload(form),
        });
        const newId = String(created?.contactId ?? "");
        toast.success("Contact created.");
        onSaved?.(newId);
        return;
      }

      await updateContact({
        contactId,
        title,
        slug,
        status: form.status || "active",
        tags,
        meta: buildMetaPayload(form),
      });
      toast.success("Contact updated.");
      onSaved?.(contactId);
    } catch {
      toast.error("Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contactId || deleting) return;
    setDeleting(true);
    try {
      await deleteContact({ contactId });
      toast.success("Contact deleted.");
      onDeleted?.();
    } catch {
      toast.error("Failed to delete contact.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{contactId ? "Edit contact" : "New contact"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input
              value={form.firstName}
              onChange={(event) => handleChange("firstName")(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input
              value={form.lastName}
              onChange={(event) => handleChange("lastName")(event.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={(event) => handleChange("email")(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(event) => handleChange("phone")(event.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Input
              value={form.status}
              onChange={(event) => handleChange("status")(event.target.value)}
              placeholder="active"
            />
          </div>
          <div className="space-y-2">
            <Label>Tags (comma separated)</Label>
            <Input
              value={form.tags}
              onChange={(event) => handleChange("tags")(event.target.value)}
              placeholder="alpha, beta"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(event) => handleChange("notes")(event.target.value)}
            rows={4}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {contactId ? "Save changes" : "Create contact"}
          </Button>
          {contactId ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:text-red-600"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
