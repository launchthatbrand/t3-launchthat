"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { configureVimeoPlugin } from "launchthat-plugin-vimeo";

configureVimeoPlugin({
  useQuery,
  useAction,
  useMutation,
});
