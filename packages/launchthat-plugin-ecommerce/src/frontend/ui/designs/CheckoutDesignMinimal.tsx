import type { ReactNode } from "react";

export function CheckoutDesignMinimal(props: {
  mobileSummary: ReactNode;
  left: ReactNode;
  rightSummary: ReactNode;
}): ReactNode {
  return (
    <div className="space-y-6">
      {/* Mobile: still show the collapsible summary */}
      {props.mobileSummary}

      {/* Single-column layout; show summary at the bottom for all breakpoints */}
      <div className="space-y-8">
        <div className="space-y-6">{props.left}</div>
        <div>{props.rightSummary}</div>
      </div>
    </div>
  );
}


