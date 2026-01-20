import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

export default function AdminSettingsAccountPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your photo and personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                Change Avatar
              </Button>
              <p className="text-muted-foreground text-xs">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Enter your name" defaultValue="Desmond T." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Enter your email"
                defaultValue="desmond@example.com"
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Trading Bio</Label>
            <Input
              id="bio"
              placeholder="Tell us about your trading style..."
              defaultValue="Discretionary scalper focusing on NAS100."
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t px-6 py-4">
          <div className="text-muted-foreground text-xs">Last saved: Today at 10:42 AM</div>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

