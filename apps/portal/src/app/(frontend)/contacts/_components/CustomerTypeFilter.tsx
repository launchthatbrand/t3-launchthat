"use client";

import { Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui";

interface CustomerTypeFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export const CustomerTypeFilter = ({
  value,
  onChange,
}: CustomerTypeFilterProps) => {
  const customerTypes = [
    { value: "lead", label: "Lead" },
    { value: "prospect", label: "Prospect" },
    { value: "customer", label: "Customer" },
    { value: "former-customer", label: "Former Customer" },
    { value: "partner", label: "Partner" },
  ];

  const handleChange = (newValue: string) => {
    if (newValue === "all") {
      onChange(null);
    } else {
      onChange(newValue);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Filter by Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={value ?? "all"} onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {customerTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
