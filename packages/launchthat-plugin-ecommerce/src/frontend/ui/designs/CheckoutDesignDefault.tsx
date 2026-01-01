import type { ReactNode } from "react";

export function CheckoutDesignDefault(props: {
  mobileSummary: ReactNode;
  left: ReactNode;
  rightSummary: ReactNode;
}): ReactNode {
  return (
    <div className="space-y-6">
      {/* Mobile: collapsible order summary */}
      {props.mobileSummary}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">{props.left}</div>

        <div className="hidden lg:block">
          <div className="sticky top-8">{props.rightSummary}</div>
        </div>
      </div>
    </div>
  );
}


