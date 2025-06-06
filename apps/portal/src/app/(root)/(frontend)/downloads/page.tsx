import { DownloadsPage } from "./DownloadsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Downloads | LaunchThat",
  description: "Access and manage downloadable resources",
};

export default function DownloadsPageWrapper() {
  return <DownloadsPage />;
}
