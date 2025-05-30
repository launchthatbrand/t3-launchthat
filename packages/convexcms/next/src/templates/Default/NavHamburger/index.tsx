"use client";

import React from "react";
import { Hamburger, useNav } from "@convexcms/ui";

export const NavHamburger: React.FC = () => {
  const { navOpen } = useNav();
  return <Hamburger closeIcon="collapse" isActive={navOpen} />;
};
