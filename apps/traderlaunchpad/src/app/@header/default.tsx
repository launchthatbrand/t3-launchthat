import { Header } from "~/app/@header/_components/Header";
import React from "react";

export default function HeaderDefault() {
  // The shared Header already provides sticky + theme-aware styling (and the theme toggle).
  return (
    <div className="sticky top-0 z-50">
      <Header />
    </div>
  );
}