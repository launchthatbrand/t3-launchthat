import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export default function PublicOrgOrdersPage() {
  return (
    <div className="grid gap-4">
      <Card className="border-white/10 bg-white/3 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base">Orders</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-white/60">No public orders yet.</CardContent>
      </Card>

      <div className="h-24" />
    </div>
  );
}

