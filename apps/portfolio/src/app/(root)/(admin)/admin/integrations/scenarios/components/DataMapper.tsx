import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui";

export interface SourceFieldOption {
  nodeId: string;
  field: string;
}

interface DataMapperProps {
  fields: string[]; // target fields
  sources: SourceFieldOption[]; // flatten previous node fields
  value: Record<string, string>; // current mapping
  onChange: (val: Record<string, string>) => void;
}

export const DataMapper = ({
  fields,
  sources,
  value,
  onChange,
}: DataMapperProps) => {
  const [local, setLocal] = useState<Record<string, string>>(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const grouped = sources.reduce<Record<string, string[]>>((acc, cur) => {
    const existing = acc[cur.nodeId] ?? [];
    acc[cur.nodeId] = [...existing, cur.field];
    return acc;
  }, {});

  const handleSelect = (targetField: string, template: string) => {
    const updated = { ...local, [targetField]: template };
    setLocal(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {fields.map((target) => (
        <div key={target} className="flex items-center space-x-2">
          <span className="w-32 text-sm font-medium">{target}</span>
          <Select
            value={local[target] ?? ""}
            onValueChange={(val) => handleSelect(target, val)}
          >
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Select source field" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(grouped).flatMap(([nodeId, fieldList]) => {
                return [
                  <div
                    key={`hdr-${nodeId}`}
                    className="px-2 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {nodeId}
                  </div>,
                  ...fieldList.map((f) => (
                    <SelectItem
                      key={`${nodeId}.${f}`}
                      value={`{{${nodeId}.${f}}}`}
                    >{`${nodeId}.${f}`}</SelectItem>
                  )),
                ];
              })}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
};
