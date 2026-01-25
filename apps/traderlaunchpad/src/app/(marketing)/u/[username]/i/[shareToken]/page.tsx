"use client";

import SharedTradeIdeaPage from "../../../../../i/[shareToken]/page";

export default function PublicUserSharedTradeIdeaPage() {
  // NOTE: Username is intentionally not validated here.
  // The trade idea is token-gated (shareToken) and the /u/:username prefix is branding/UX only.
  // SharedTradeIdeaPage reads shareToken from useParams().
  return <SharedTradeIdeaPage />;
}

