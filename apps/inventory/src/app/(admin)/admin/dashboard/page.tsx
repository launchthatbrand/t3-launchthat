"use client";

import { AuthProtector } from "@/components/AuthProtector";
import { useMondayContext } from "@/hooks/useMondayContext";
import { useAuth } from "@clerk/nextjs";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export default function DashboardPage() {
  const { isInMonday, context } = useMondayContext();
  const { userId } = useAuth();

  return (
    <AuthProtector>
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Authentication Method:</span>{" "}
                  {isInMonday ? "Monday.com SSO" : "Clerk Auth"}
                </div>
                <div>
                  <span className="font-semibold">User ID:</span>{" "}
                  {userId ?? "Not available"}
                </div>
              </div>
            </CardContent>
          </Card>

          {isInMonday && (
            <Card>
              <CardHeader>
                <CardTitle>Monday.com Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Board ID:</span>{" "}
                    {context?.data.boardId ?? "Not available"}
                  </div>
                  <div>
                    <span className="font-semibold">Workspace ID:</span>{" "}
                    {context?.data.workspaceId ?? "Not available"}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-green-600">
                  ✓ Successfully authenticated and authorized
                </div>
                <div>
                  <span className="font-semibold">Access Level:</span> Admin
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthProtector>
  );
}
