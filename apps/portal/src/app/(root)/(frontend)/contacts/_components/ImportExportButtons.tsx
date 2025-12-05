"use client";

import { Download, Upload } from "lucide-react";

import { Button } from "@acme/ui";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

// Define the Contact type based on the schema
interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  department?: string;
  tags?: string[];
  customerType?:
    | "lead"
    | "prospect"
    | "customer"
    | "former-customer"
    | "partner";
  leadStatus?:
    | "new"
    | "contacted"
    | "qualified"
    | "proposal"
    | "negotiation"
    | "won"
    | "lost"
    | "dormant";
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
}

interface ImportExportButtonsProps {
  userId: string | undefined;
  isAdmin?: boolean;
}

export const ImportExportButtons = ({
  userId,
  isAdmin = false,
}: ImportExportButtonsProps) => {
  const router = useRouter();
  const exportContacts = useQuery(
    api.core.crm.contacts.queries.exportContacts,
    {
      userId,
    },
  );

  const handleImport = () => {
    const importPath = isAdmin ? "/admin/contacts/import" : "/contacts/import";
    router.push(importPath);
  };

  const handleExport = () => {
    if (!exportContacts) return;

    // Format the data for CSV export
    const csvData = formatContactsForCSV(exportContacts);

    // Create a downloadable CSV file
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `contacts_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format contacts data for CSV export
  const formatContactsForCSV = (contacts: Contact[]) => {
    // Define CSV headers
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Job Title",
      "Tags",
      "Customer Type",
      "Lead Status",
      "Created At",
    ];

    // Format the CSV rows
    const rows = contacts.map((contact) => {
      return [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone ?? "",
        contact.company ?? "",
        contact.jobTitle ?? "",
        contact.tags ? contact.tags.join(", ") : "",
        contact.customerType ?? "",
        contact.leadStatus ?? "",
        new Date(contact.createdAt).toISOString().split("T")[0],
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",");
    });

    // Combine headers and rows
    return [headers.join(","), ...rows].join("\n");
  };

  return (
    <>
      <Button onClick={handleImport} variant="outline" className="w-full">
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      <Button
        onClick={handleExport}
        variant="outline"
        className="w-full"
        disabled={!exportContacts}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </>
  );
};
