import type { ReactNode } from "react";

interface MetaBoxTableProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export const MetaBoxTable = ({
  children,
  fullWidth = true,
}: MetaBoxTableProps) => (
  <table
    className="meta-box-table"
    style={{
      borderCollapse: "collapse",
      width: fullWidth ? "100%" : "auto",
    }}
  >
    <tbody>{children}</tbody>
  </table>
);

interface MetaBoxTableRowProps {
  label: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  alignTop?: boolean;
}

export const MetaBoxTableRow = ({
  label,
  description,
  children,
  alignTop = true,
}: MetaBoxTableRowProps) => (
  <tr>
    <th
      style={{
        textAlign: "left",
        verticalAlign: alignTop ? "top" : "middle",
        padding: "12px 16px 12px 0",
        width: "220px",
        fontWeight: 600,
      }}
    >
      <div>{label}</div>
      {description ? (
        <p
          style={{
            color: "var(--muted-foreground, #6b7280)",
            fontSize: "0.85rem",
            marginTop: "4px",
          }}
        >
          {description}
        </p>
      ) : null}
    </th>
    <td style={{ padding: "12px 0" }}>{children}</td>
  </tr>
);

interface MetaBoxColumnsProps {
  children: ReactNode;
  gap?: number;
  alignItems?: "flex-start" | "center";
}

export const MetaBoxColumns = ({
  children,
  gap = 20,
  alignItems = "flex-start",
}: MetaBoxColumnsProps) => (
  <div style={{ display: "flex", gap, alignItems, flexWrap: "wrap" }}>
    {children}
  </div>
);

interface MetaBoxFieldsetProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export const MetaBoxFieldset = ({
  title,
  description,
  actions,
  children,
}: MetaBoxFieldsetProps) => (
  <section
    style={{
      border: "1px solid var(--border, #e4e4e7)",
      borderRadius: "8px",
      padding: "16px",
    }}
  >
    {(title || description || actions) && (
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div>
          {title ? <h4 style={{ margin: 0 }}>{title}</h4> : null}
          {description ? (
            <p
              style={{
                color: "var(--muted-foreground, #6b7280)",
                fontSize: "0.9rem",
                marginTop: "4px",
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </header>
    )}
    <div>{children}</div>
  </section>
);

