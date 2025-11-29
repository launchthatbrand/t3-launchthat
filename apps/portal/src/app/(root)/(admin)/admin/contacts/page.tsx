"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { formatPhoneNumber } from "@convex-config/shared";
import { useQuery } from "convex/react";
import {
  Building,
  Edit,
  Mail,
  Phone,
  PlusCircle,
  Tag,
  Trash2,
  UserCircle,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Separator,
} from "@acme/ui";

// Import EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import { CustomerTypeFilter } from "~/app/(root)/(frontend)/contacts/_components/CustomerTypeFilter";
import { ImportExportButtons } from "~/app/(root)/(frontend)/contacts/_components/ImportExportButtons";
import { TagFilter } from "~/app/(root)/(frontend)/contacts/_components/TagFilter";
import { EntityList } from "@acme/ui/entity-list/EntityList";

interface Contact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  tags?: string[];
  customerType?: string;
  leadStatus?: string;
}

export default function AdminContactsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCustomerType, setSelectedCustomerType] = useState<
    string | null
  >(null);

  // Get all available tags for the filter
  const availableTags = useQuery(api.contacts.queries.getTags, {
    userId: user?.id,
  });

  // Get contacts
  const contactsResult = useQuery(api.contacts.queries.getContacts, {
    userId: user?.id,
    filters: {
      ...(selectedTags.length > 0 ? { tags: selectedTags } : {}),
      ...(selectedCustomerType
        ? { customerType: selectedCustomerType as any }
        : {}),
    },
    paginationOpts: {
      numItems: 100, // Get more items since we'll use client-side filtering
      cursor: null,
    },
  });

  const contacts = contactsResult?.contacts || [];

  // Define column configurations for EntityList
  const columns: ColumnDefinition<Contact>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "firstName",
      sortable: true,
      cell: (contact) => (
        <div className="flex items-center">
          <div className="mr-2 rounded-full bg-primary/10 p-2">
            <UserCircle className="h-6 w-6 text-primary/80" />
          </div>
          <div>
            <div className="font-medium">
              {contact.firstName} {contact.lastName}
            </div>
            {(contact.jobTitle || contact.company) && (
              <div className="text-xs text-muted-foreground">
                {contact.jobTitle && contact.company
                  ? `${contact.jobTitle} at ${contact.company}`
                  : contact.jobTitle || contact.company}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact Info",
      accessorKey: "email",
      sortable: true,
      cell: (contact) => (
        <div className="space-y-1">
          <div className="flex items-center">
            <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{contact.email}</span>
          </div>
          {contact.phone && (
            <div className="flex items-center">
              <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
              <span className="text-sm">
                {formatPhoneNumber(contact.phone)}
              </span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center">
              <Building className="mr-1 h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{contact.company}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "customerType",
      header: "Type",
      accessorKey: "customerType",
      sortable: true,
      cell: (contact) => {
        if (!contact.customerType) return null;

        const typeColors: Record<string, string> = {
          lead: "bg-blue-100 text-blue-800",
          prospect: "bg-purple-100 text-purple-800",
          customer: "bg-green-100 text-green-800",
          "former-customer": "bg-amber-100 text-amber-800",
          partner: "bg-indigo-100 text-indigo-800",
        };

        const color =
          typeColors[contact.customerType] || "bg-gray-100 text-gray-800";

        return (
          <Badge variant="secondary" className={color}>
            {contact.customerType.replace("-", " ")}
          </Badge>
        );
      },
    },
    {
      id: "leadStatus",
      header: "Status",
      accessorKey: "leadStatus",
      sortable: true,
      cell: (contact) => {
        if (!contact.leadStatus) return null;

        const statusColors: Record<string, string> = {
          new: "bg-blue-100 text-blue-800",
          contacted: "bg-purple-100 text-purple-800",
          qualified: "bg-emerald-100 text-emerald-800",
          proposal: "bg-amber-100 text-amber-800",
          negotiation: "bg-orange-100 text-orange-800",
          won: "bg-green-100 text-green-800",
          lost: "bg-red-100 text-red-800",
          dormant: "bg-gray-100 text-gray-800",
        };

        const color =
          statusColors[contact.leadStatus] || "bg-gray-100 text-gray-800";

        return (
          <Badge variant="secondary" className={color}>
            {contact.leadStatus}
          </Badge>
        );
      },
    },
    {
      id: "tags",
      header: "Tags",
      accessorKey: "tags",
      sortable: false,
      cell: (contact) => {
        if (!contact.tags || contact.tags.length === 0) return null;

        return (
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<Contact>[] = [
    {
      id: "name",
      label: "Name",
      type: "text",
      field: "firstName",
    },
    {
      id: "email",
      label: "Email",
      type: "text",
      field: "email",
    },
    {
      id: "company",
      label: "Company",
      type: "text",
      field: "company",
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<Contact>[] = [
    {
      id: "view",
      label: "View",
      onClick: (contact) => router.push(`/admin/contacts/${contact._id}`),
      variant: "outline",
      icon: <UserCircle className="mr-2 h-4 w-4" />,
    },
    {
      id: "edit",
      label: "Edit",
      onClick: (contact) => router.push(`/admin/contacts/${contact._id}/edit`),
      variant: "secondary",
      icon: <Edit className="mr-2 h-4 w-4" />,
    },
    {
      id: "delete",
      label: "Delete",
      onClick: (contact) => {
        if (confirm("Are you sure you want to delete this contact?")) {
          router.push(`/admin/contacts/${contact._id}/delete`);
        }
      },
      variant: "destructive",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
    },
  ];

  // Custom header actions
  const headerActions = (
    <Link href="/admin/contacts/create">
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Contact
      </Button>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contacts Management</h1>
        {headerActions}
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Search and Filters */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter contacts by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Type</label>
              <CustomerTypeFilter
                value={selectedCustomerType}
                onChange={setSelectedCustomerType}
              />
            </div>

            {/* Tags Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              {availableTags ? (
                <TagFilter
                  tags={availableTags}
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                />
              ) : (
                <div className="h-10 animate-pulse rounded bg-muted" />
              )}
            </div>

            <Separator className="my-2" />

            {/* Import/Export */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Import/Export</label>
              <div className="grid grid-cols-2 gap-2">
                <ImportExportButtons userId={user?.id} isAdmin={true} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact List with EntityList */}
        <div className="col-span-3">
          <EntityList<Contact>
            data={contacts}
            columns={columns}
            filters={filters}
            isLoading={contactsResult === undefined}
            title="Contacts"
            description="Manage your contacts"
            defaultViewMode="list"
            viewModes={["list", "grid"]}
            entityActions={entityActions}
            actions={headerActions}
            emptyState={
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                <p className="text-muted-foreground">No contacts found</p>
                <Button asChild variant="outline">
                  <Link href="/admin/contacts/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add your first
                    contact
                  </Link>
                </Button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
