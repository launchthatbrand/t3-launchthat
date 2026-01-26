"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";

import { ContactDetailsPanel, ContactEditor } from "launchthat-plugin-crm/frontend";
import { api } from "@convex-config/_generated/api";

export const CrmContactEditorClient = ({ contactId }: { contactId?: string }) => {
  const router = useRouter();
  const shouldQuery = Boolean(contactId);

  const contact = useQuery(
    api.platform.crm.getContact,
    shouldQuery ? { contactId: contactId as string } : "skip",
  );
  const meta = useQuery(
    api.platform.crm.getContactMeta,
    shouldQuery ? { contactId: contactId as string } : "skip",
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <ContactEditor
        contactId={contactId}
        getContactQuery={api.platform.crm.getContact}
        getContactMetaQuery={api.platform.crm.getContactMeta}
        createContactMutation={api.platform.crm.createContact}
        updateContactMutation={api.platform.crm.updateContact}
        deleteContactMutation={api.platform.crm.deleteContact}
        onSaved={(id) => {
          if (!contactId && id) {
            router.push(`/platform/crm/contacts/${id}`);
          }
        }}
        onDeleted={() => router.push("/platform/crm/contacts")}
      />
      <ContactDetailsPanel contact={contact as any} meta={meta as any} />
    </div>
  );
};
