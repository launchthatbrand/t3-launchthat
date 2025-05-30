import { FC } from "react";

import { useEmailParserStore } from "../../store";
import { sampleEmails } from "../../utils/sampleEmails";

export const EmailContent: FC = () => {
  const selectedEmailId = useEmailParserStore((s) => s.selectedEmailId);
  const email = sampleEmails.find((e) => e.id === selectedEmailId);

  if (!email) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Select an email to view its content.
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-white p-8">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: email.html }}
      />
    </main>
  );
};
