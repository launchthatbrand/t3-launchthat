"use client";

import { useAction, useQuery } from "convex/react";

import { configureVimeoPlugin } from "launchthat-plugin-vimeo";

configureVimeoPlugin({
  useQuery,
  useAction,
});
