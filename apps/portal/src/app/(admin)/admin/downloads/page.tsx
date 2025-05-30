import { DownloadsAdminPage } from "./DownloadsAdminPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Downloads Management | Admin",
  description: "Manage downloadable resources for your users",
};

export default function DownloadsAdminPageWrapper() {
  return <DownloadsAdminPage />;
}
