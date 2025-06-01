import GmailIntegration from "../../_components/GmailIntegration";

export default function GmailTestPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">Gmail Integration Test</h1>

      <div className="space-y-8">
        <p className="text-gray-600">
          This page demonstrates the Gmail integration with Clerk
          authentication. Sign in with Google through Clerk to test the Gmail
          API functionality.
        </p>

        <GmailIntegration />
      </div>
    </div>
  );
}
