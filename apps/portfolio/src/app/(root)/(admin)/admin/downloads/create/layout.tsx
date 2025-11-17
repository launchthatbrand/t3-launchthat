import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload New Download | Admin",
  description: "Add a new downloadable file to your library",
};

export default function CreateDownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
