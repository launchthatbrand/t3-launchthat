import React from "react";

import { Header } from "~/app/@header/_components/Header";

export default function HeaderDefault() {
  // The shared Header already provides sticky + theme-aware styling (and the theme toggle).
  return <Header />;
}