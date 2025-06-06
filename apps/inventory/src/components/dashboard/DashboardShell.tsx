interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({
  children,
  className = "",
}: DashboardShellProps) {
  return (
    <div className={`container mx-auto grid gap-8 py-8 ${className}`}>
      {children}
    </div>
  );
}
