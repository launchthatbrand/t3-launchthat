"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";

import { Badge } from "../badge";
import { Button } from "../button";
import Image from "next/image";
import { cn } from "@acme/ui";

// Entity types that will be supported by the card
export type EntityType = "group" | "product" | "download" | "contact" | "event";

// Common props for all entity cards
interface EntityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  coverImage?: string;
  avatar?: string;
  avatarFallback?: string;
  badges?: Array<{
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }>;
  entityType: EntityType;
  showActions?: boolean;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  status?: string;
  metadata?: Record<string, React.ReactNode>;
  aspectRatio?: "portrait" | "square" | "video" | "auto";
  isHoverable?: boolean;
}

// Component for displaying a card with entity information
export const EntityCard = React.forwardRef<HTMLDivElement, EntityCardProps>(
  (
    {
      className,
      title,
      description,
      coverImage,
      avatar,
      avatarFallback,
      badges = [],
      entityType,
      showActions = true,
      actions,
      footer,
      status,
      metadata = {},
      aspectRatio = "auto",
      isHoverable = true,
      ...props
    },
    ref,
  ) => {
    // Determine aspect ratio styles
    const aspectRatioClass = {
      portrait: "aspect-[3/4]",
      square: "aspect-square",
      video: "aspect-video",
      auto: "",
    }[aspectRatio];

    // Size of avatar based on entity type
    const avatarSize = entityType === "contact" ? "h-16 w-16" : "h-10 w-10";

    return (
      <Card
        ref={ref}
        className={cn(
          "overflow-hidden",
          isHoverable && "transition-all hover:shadow-lg",
          entityType === "product" && "border-primary/10",
          entityType === "download" && "border-info/10",
          entityType === "group" && "border-secondary/10",
          entityType === "contact" && "border-success/10",
          entityType === "event" && "border-warning/10",
          className,
        )}
        {...props}
      >
        {coverImage && (
          <div className={cn("relative overflow-hidden", aspectRatioClass)}>
            <Image
              src={coverImage}
              alt={`${title} cover image`}
              fill
              className="object-cover transition-all hover:scale-105"
              priority={false}
            />
            {status && (
              <div className="absolute right-2 top-2">
                <Badge variant="secondary">{status}</Badge>
              </div>
            )}
          </div>
        )}
        <CardHeader
          className={
            entityType === "contact" ? "flex-row items-center gap-4" : ""
          }
        >
          {avatar && (
            <Avatar className={avatarSize}>
              <AvatarImage src={avatar} alt={title} />
              <AvatarFallback>
                {avatarFallback || title.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {badges.map((badge, index) => (
                  <Badge key={index} variant={badge.variant || "default"}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        {Object.keys(metadata).length > 0 && (
          <CardContent>
            <div className="grid gap-2">
              {Object.entries(metadata).map(([key, value], index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {key}
                  </span>
                  <span className="text-sm">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}

        {(showActions || footer) && (
          <CardFooter className="flex justify-between">
            {actions || (
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  View
                </Button>
                {entityType !== "download" && (
                  <Button size="sm">
                    {entityType === "product"
                      ? "Add to Cart"
                      : entityType === "contact"
                        ? "Contact"
                        : entityType === "event"
                          ? "RSVP"
                          : entityType === "group"
                            ? "Join"
                            : "Edit"}
                  </Button>
                )}
                {entityType === "download" && (
                  <Button size="sm">Download</Button>
                )}
              </div>
            )}
            {footer}
          </CardFooter>
        )}
      </Card>
    );
  },
);
EntityCard.displayName = "EntityCard";

// Specialized components for each entity type
export const GroupCard = React.forwardRef<
  HTMLDivElement,
  Omit<EntityCardProps, "entityType">
>((props, ref) => <EntityCard {...props} ref={ref} entityType="group" />);
GroupCard.displayName = "GroupCard";

export const ProductCard = React.forwardRef<
  HTMLDivElement,
  Omit<EntityCardProps, "entityType"> & { price?: React.ReactNode }
>(({ price, metadata = {}, ...props }, ref) => (
  <EntityCard
    {...props}
    ref={ref}
    entityType="product"
    metadata={{
      ...(price ? { Price: price } : {}),
      ...metadata,
    }}
  />
));
ProductCard.displayName = "ProductCard";

export const DownloadCard = React.forwardRef<
  HTMLDivElement,
  Omit<EntityCardProps, "entityType"> & {
    fileSize?: string;
    fileType?: string;
    downloadCount?: number;
  }
>(({ fileSize, fileType, downloadCount, metadata = {}, ...props }, ref) => (
  <EntityCard
    {...props}
    ref={ref}
    entityType="download"
    metadata={{
      ...(fileSize ? { "File Size": fileSize } : {}),
      ...(fileType ? { "File Type": fileType } : {}),
      ...(downloadCount !== undefined ? { Downloads: downloadCount } : {}),
      ...metadata,
    }}
  />
));
DownloadCard.displayName = "DownloadCard";

export const ContactCard = React.forwardRef<
  HTMLDivElement,
  Omit<EntityCardProps, "entityType"> & {
    email?: string;
    phone?: string;
    company?: string;
  }
>(({ email, phone, company, metadata = {}, ...props }, ref) => (
  <EntityCard
    {...props}
    ref={ref}
    entityType="contact"
    metadata={{
      ...(email ? { Email: email } : {}),
      ...(phone ? { Phone: phone } : {}),
      ...(company ? { Company: company } : {}),
      ...metadata,
    }}
  />
));
ContactCard.displayName = "ContactCard";

export const EventCard = React.forwardRef<
  HTMLDivElement,
  Omit<EntityCardProps, "entityType"> & {
    date?: string | Date;
    location?: string;
    attendees?: number;
  }
>(({ date, location, attendees, metadata = {}, ...props }, ref) => {
  let formattedDate: string | undefined;
  if (date) {
    if (typeof date === "string") {
      formattedDate = date;
    } else {
      formattedDate = date.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return (
    <EntityCard
      {...props}
      ref={ref}
      entityType="event"
      metadata={{
        ...(formattedDate ? { "Date & Time": formattedDate } : {}),
        ...(location ? { Location: location } : {}),
        ...(attendees !== undefined ? { Attendees: attendees } : {}),
        ...metadata,
      }}
    />
  );
});
EventCard.displayName = "EventCard";
