"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { usePaginatedQuery } from "convex/react";
import { api as apiConfig } from "@convex-config/_generated/api";
import { configureVimeoPlugin } from "launchthat-plugin-vimeo";

configureVimeoPlugin({
  useQuery,
  useAction,
  useMutation,
  usePaginatedQuery,
  listVideosQuery: apiConfig.vimeo.queries.listVideos,
});
