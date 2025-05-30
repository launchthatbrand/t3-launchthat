import { FC } from "react";

import { useEmailParserStore } from "../../store";

export const FieldsSidebar: FC = () => {
  const fields = useEmailParserStore((s) => s.fields);

  return (
    <aside className="flex h-full w-80 flex-col border-l bg-gray-50">
      <div className="border-b p-4 text-lg font-bold">Fields</div>
      <ul className="flex-1 space-y-2 overflow-y-auto p-4">
        {fields.length === 0 && (
          <li className="text-gray-400">No fields yet.</li>
        )}
        {fields.map((field) => (
          <li
            key={field.id}
            className="rounded border bg-white px-3 py-2 shadow-sm"
          >
            <div className="font-semibold">{field.name}</div>
            <div className="text-xs text-gray-500">
              Highlight ID: {field.highlightId}
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t p-4">
        <button className="w-full rounded bg-orange-500 py-2 text-white transition hover:bg-orange-600">
          Generate Template
        </button>
      </div>
    </aside>
  );
};
