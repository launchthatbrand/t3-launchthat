"use client";

import { FC } from "react";

import { useEmailParserStore } from "../../store";
import { sampleEmails } from "../../utils/sampleEmails";

export const EmailSidebar: FC = () => {
  const selectedEmailId = useEmailParserStore((s) => s.selectedEmailId);
  const setSelectedEmailId = useEmailParserStore((s) => s.setSelectedEmailId);

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="border-b p-4 text-lg font-bold">Emails</div>
      <ul className="flex-1 overflow-y-auto">
        {sampleEmails.map((email) => (
          <li
            key={email.id}
            className={
              "cursor-pointer border-b px-4 py-3 hover:bg-gray-100 " +
              (selectedEmailId === email.id
                ? "bg-orange-100 font-semibold"
                : "")
            }
            onClick={() => setSelectedEmailId(email.id)}
            aria-selected={selectedEmailId === email.id}
            tabIndex={0}
          >
            <div className="truncate">{email.subject}</div>
            <div className="truncate text-xs text-gray-500">{email.sender}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
};
