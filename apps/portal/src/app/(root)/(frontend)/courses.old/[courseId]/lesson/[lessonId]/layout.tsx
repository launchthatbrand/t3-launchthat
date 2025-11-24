import React from "react";

import { Card, CardHeader, CardTitle } from "@acme/ui/card";

import LessonHeader from "./_components/LessonHeader";
import LessonSidebar from "./_components/LessonSidebar";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1">{children}</div>
        {/* <div className="order-first w-full p-3 md:order-last md:-mt-20 md:w-1/3">
          <LessonSidebar />
        </div> */}
      </div>
    </div>
  );
};

export default layout;
