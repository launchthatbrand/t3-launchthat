import type { Id } from "@/convex/_generated/dataModel";

import type {
  CarouselItemTemplate,
  TextAlignmentOption,
} from "~/components/groups.old/GroupHeaderCarousel";

export interface GroupWithDetails {
  _id: Id<"groups">;
  _creationTime: number;
  name: string;
  description: string;
  privacy: "public" | "private" | "restricted";
  avatar?: string;
  coverImage?: string;
  headerItems?: {
    id: string;
    title?: string;
    excerpt?: string;
    imageUrl: string;
    template: CarouselItemTemplate;
    textAlign?: TextAlignmentOption;
    blogPostId?: string;
  }[];
  memberCount: number;
  userMembership?: {
    role: "admin" | "moderator" | "member";
    status: string;
  } | null;
  categoryTags?: string[];
  creator?: {
    id: string;
    name: string;
    image?: string;
  } | null;
}
