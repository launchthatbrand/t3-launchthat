"use client";

import React from "react";

import { MultiSelect } from "@acme/ui/components/multi-select";

function page() {
  return (
    <div>
      <MultiSelect
        options={[{ label: "Option 1", value: "option1" }]}
        onValueChange={() => {
          console.log("value changed");
        }}
      />
    </div>
  );
}

export default page;
