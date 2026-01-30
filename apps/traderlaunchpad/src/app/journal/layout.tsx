import React from "react";

export default async function JournalLayout(props: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">{props.children}</div>
  );
}


