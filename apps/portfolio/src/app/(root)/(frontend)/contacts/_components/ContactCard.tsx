"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { formatPhoneNumber } from "@convex-config/shared";
import { useMutation } from "convex/react";
import {
  Building,
  Edit,
  Mail,
  MoreVertical,
  Phone,
  Tag,
  Trash2,
  UserCircle,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui";

interface ContactCardProps {
  contact: {
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
  };
  isAdmin?: boolean;
}

export const ContactCard = ({ contact, isAdmin = false }: ContactCardProps) => {
  const router = useRouter();
  const deleteContact = useMutation(api.contacts.crud.deleteContact);

  const handleViewContact = () => {
    const baseRoute = isAdmin ? "/admin/contacts" : "/contacts";
    router.push(`${baseRoute}/${contact._id}`);
  };

  const handleEditContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    const baseRoute = isAdmin ? "/admin/contacts" : "/contacts";
    router.push(`${baseRoute}/${contact._id}/edit`);
  };

  const handleDeleteContact = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this contact?")) {
      await deleteContact({ contactId: contact._id });
    }
  };

  const getCustomerTypeColor = (type?: string) => {
    switch (type) {
      case "lead":
        return "bg-blue-100 text-blue-800";
      case "prospect":
        return "bg-purple-100 text-purple-800";
      case "customer":
        return "bg-green-100 text-green-800";
      case "former-customer":
        return "bg-amber-100 text-amber-800";
      case "partner":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLeadStatusColor = (status?: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-purple-100 text-purple-800";
      case "qualified":
        return "bg-emerald-100 text-emerald-800";
      case "proposal":
        return "bg-amber-100 text-amber-800";
      case "negotiation":
        return "bg-orange-100 text-orange-800";
      case "won":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "dormant":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-colors hover:border-primary/50 ${
        isAdmin ? "" : "border shadow"
      }`}
      onClick={handleViewContact}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-primary/10 p-3">
              <UserCircle className="h-10 w-10 text-primary/80" />
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {contact.firstName} {contact.lastName}
              </h3>
              {contact.jobTitle && contact.company && (
                <p className="text-sm text-muted-foreground">
                  {contact.jobTitle} at {contact.company}
                </p>
              )}
              {contact.jobTitle && !contact.company && (
                <p className="text-sm text-muted-foreground">
                  {contact.jobTitle}
                </p>
              )}
              {!contact.jobTitle && contact.company && (
                <p className="text-sm text-muted-foreground">
                  {contact.company}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditContact}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDeleteContact}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{contact.email}</span>
          </div>
          {contact.phone && (
            <div className="flex items-center">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {formatPhoneNumber(contact.phone)}
              </span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center">
              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{contact.company}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {contact.customerType && (
            <Badge
              variant="secondary"
              className={getCustomerTypeColor(contact.customerType)}
            >
              {contact.customerType.replace("-", " ")}
            </Badge>
          )}
          {contact.leadStatus && (
            <Badge
              variant="secondary"
              className={getLeadStatusColor(contact.leadStatus)}
            >
              {contact.leadStatus}
            </Badge>
          )}
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
