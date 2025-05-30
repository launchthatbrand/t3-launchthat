import type { PayloadRequest } from "@convexcms/core";

export type Context = {
  headers: {
    [key: string]: string;
  };
  req: PayloadRequest;
};
