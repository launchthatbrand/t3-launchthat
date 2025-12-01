"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Users,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";

import type { Id } from "../lib/types";
import { ContentToShare } from "./ShareDialog";

// Define a proper type for the feedItem
interface FeedItem {
  _id: Id<"feedItems">;
  title?: string;
  content: string;
  mediaUrls?: string[];
  creator?: {
    name: string;
    image?: string;
  };
}

interface SharedContentCardProps {
  content: ContentToShare;
  feedItem?: FeedItem | null;
  isPreview?: boolean;
  className?: string;
}

export function SharedContentCard({
  content,
  feedItem,
  isPreview = false,
  className = "",
}: SharedContentCardProps) {
  // Function to determine icon based on content type
  const getContentTypeIcon = () => {
    switch (content.type) {
      case "blog":
        return <FileText className="h-4 w-4" />;
      case "course":
        return <GraduationCap className="h-4 w-4" />;
      case "product":
        return <CreditCard className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Function to get content title
  const getTitle = () => {
    if (feedItem) {
      // For feed items, either use the content's original title or a generic one
      return feedItem.title ?? "Shared Post";
    }

    return content.title ?? "Shared Content";
  };

  // Function to get the appropriate URL for the content
  const getContentUrl = () => {
    if (content.type === "feedItem") {
      return `/social/post/${content.id}`;
    }

    // For other content types
    switch (content.type) {
      case "blog":
        return `/blog/${content.id}`;
      case "course":
        return `/courses/${content.id}`;
      case "product":
        return `/store/products/${content.id}`;
      case "event":
        return `/events/${content.id}`;
      case "group":
        return `/groups/${content.id}`;
      default:
        return content.url ?? "#";
    }
  };

  return (
    <Card
      className={`overflow-hidden ${className} ${isPreview ? "border-dashed" : ""}`}
    >
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {getContentTypeIcon()}
          <span className="capitalize">{content.type}</span>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        <div className="flex flex-col gap-3 md:flex-row">
          {content.imageUrl && (
            <div className="relative h-40 w-full overflow-hidden rounded-md md:h-auto md:w-1/3">
              <Image
                src={content.imageUrl}
                alt={getTitle()}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className={content.imageUrl ? "md:w-2/3" : "w-full"}>
            <h3 className="mb-1 line-clamp-2 text-lg font-semibold">
              {getTitle()}
            </h3>

            {content.description && (
              <p className="mb-2 line-clamp-3 text-sm text-muted-foreground">
                {content.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              {content.price && (
                <div className="flex items-center gap-1 text-sm">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{content.price}</span>
                </div>
              )}

              {content.date && (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{content.date}</span>
                </div>
              )}

              {content.location && (
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{content.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end p-3 pt-0">
        {!isPreview && (
          <Link href={getContentUrl()}>
            <Button size="sm" variant="ghost" className="h-7 gap-1">
              <span>View Content</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
