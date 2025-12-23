export type CertificatePageSize = "letter" | "a4";
export type CertificateOrientation = "portrait" | "landscape";

export type CertificatePlaceholderKey =
  | "userName"
  | "completionDate"
  | "courseTitle"
  | "certificateId"
  | "organizationName";

export type CertificateTextAlign = "left" | "center" | "right";

export interface CertificateBackground {
  storageId: string;
  widthPx: number;
  heightPx: number;
}

export interface CertificateImageElement {
  id: string;
  kind: "image";
  storageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface CertificateElementStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  align: CertificateTextAlign;
  fontWeight: number;
}

export type CertificateElement =
  | CertificateImageElement
  | {
      id: string;
      kind: "placeholder";
      placeholderKey: CertificatePlaceholderKey;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      zIndex: number;
      style: CertificateElementStyle;
    };

export interface CertificateTemplateV1 {
  version: 1;
  page: {
    size: CertificatePageSize;
    orientation: CertificateOrientation;
  };
  // v1 legacy background support (kept for backward compatibility).
  // New templates should prefer `elements` with `kind: "image"` and `zIndex`.
  background?: CertificateBackground;
  elements: CertificateElement[];
}

export const PLACEHOLDER_LABELS: Record<CertificatePlaceholderKey, string> = {
  userName: "User Name",
  completionDate: "Completion Date",
  courseTitle: "Course Title",
  certificateId: "Certificate ID",
  organizationName: "Organization Name",
};

export const PLACEHOLDER_TOKENS: Record<CertificatePlaceholderKey, string> = {
  userName: "{{UserName}}",
  completionDate: "{{CompletionDate}}",
  courseTitle: "{{CourseTitle}}",
  certificateId: "{{CertificateId}}",
  organizationName: "{{OrganizationName}}",
};

export const DEFAULT_TEMPLATE: CertificateTemplateV1 = {
  version: 1,
  page: { size: "letter", orientation: "landscape" },
  background: undefined,
  elements: [],
};

export const resolveCanvasSizePx = (page: {
  size: CertificatePageSize;
  orientation: CertificateOrientation;
}) => {
  // Use 96dpi-ish pixel sizes to make placement intuitive.
  // Letter 8.5x11 -> 816x1056, A4 8.27x11.69 -> 794x1123
  const base =
    page.size === "a4"
      ? { w: 794, h: 1123 }
      : { w: 816, h: 1056 };
  return page.orientation === "landscape"
    ? { width: base.h, height: base.w }
    : { width: base.w, height: base.h };
};


