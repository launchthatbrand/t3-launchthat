"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

interface PlaceholderStateProps {
  label: string;
}

export const PlaceholderState = ({ label }: PlaceholderStateProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{label}</CardTitle>
      <CardDescription>
        This view reuses the same layout slots ready for future data hookups.
      </CardDescription>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      Nothing to show just yet.
    </CardContent>
  </Card>
);

