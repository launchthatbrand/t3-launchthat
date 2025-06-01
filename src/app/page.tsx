"use client";

import { ConfirmDialog } from "./_components/ConfirmDialog";
import { EmailContent } from "./_components/EmailContent";
import { EmailSidebar } from "./_components/EmailSidebar";
import { FieldsSidebar } from "./_components/FieldsSidebar";
import { HydrateClient } from "./_components/HydrateClient";
import { JsonPreview } from "./_components/JsonPreview";
import { KeyboardShortcuts } from "./_components/KeyboardShortcuts";
import { LoadingIndicator } from "./_components/LoadingIndicator";
import { MobileNavigation } from "./_components/MobileNavigation";
import { Toast } from "./_components/Toast";

export default function Home() {
  return (
    <HydrateClient>
      <main className="flex h-screen flex-col overflow-hidden bg-gray-100">
        {/* Mobile navigation */}
        <MobileNavigation />

        {/* Desktop layout */}
        <div className="hidden h-full flex-1 grid-cols-12 overflow-hidden md:grid">
          <div className="col-span-3 overflow-y-auto border-r border-gray-200 bg-white">
            <EmailSidebar />
          </div>
          <div className="col-span-6 overflow-y-auto border-r border-gray-200 bg-white">
            <EmailContent />
          </div>
          <div className="col-span-3 flex flex-col overflow-y-auto bg-white">
            <div className="flex-1 overflow-y-auto border-b border-gray-200">
              <FieldsSidebar />
            </div>
            <div className="h-1/3 overflow-y-auto">
              <JsonPreview />
            </div>
          </div>
        </div>

        {/* Mobile tab content container - content shown based on selected tab */}
        <div className="flex h-full flex-1 overflow-hidden md:hidden"></div>

        {/* Global UI components */}
        <Toast />
        <ConfirmDialog />
        <LoadingIndicator />
        <KeyboardShortcuts />
      </main>
    </HydrateClient>
  );
}
