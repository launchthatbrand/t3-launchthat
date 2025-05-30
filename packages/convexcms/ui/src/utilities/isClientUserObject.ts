import type { ClientUser } from "@convexcms/core";

export const isClientUserObject = (user): user is ClientUser => {
  return user && typeof user === "object";
};
