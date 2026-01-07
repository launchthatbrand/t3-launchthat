"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

export default function MermaidComponent({ code }: { code: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;  
    void (async () => {
      try {
        mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
        const res = await mermaid.render(`m-${id}`, code);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) setSvg(res.svg);
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled)
          setSvg(`<pre class='text-destructive'>${String(e)}</pre>`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  return (
    <div className="my-4 w-full overflow-x-auto">
      { }
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
