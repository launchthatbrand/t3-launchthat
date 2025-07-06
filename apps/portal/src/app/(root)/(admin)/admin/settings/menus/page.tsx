"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { useCreateMenu, useMenus } from "./_api/menus";

export default function MenusSettingsPage() {
  const router = useRouter();
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuLocation, setNewMenuLocation] = useState("");

  const menus = useMenus() ?? [];
  const createMenu = useCreateMenu();

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">Menus</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Menu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Menu</DialogTitle>
              <DialogDescription>
                Create a new menu for your site
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="menu-name">Menu Name</Label>
                <Input
                  id="menu-name"
                  placeholder="e.g., Main Navigation"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="menu-location">Location</Label>
                <Select
                  value={newMenuLocation}
                  onValueChange={setNewMenuLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={async (e) => {
                  e.preventDefault();
                  if (!newMenuName || !newMenuLocation) return;
                  await createMenu({
                    name: newMenuName,
                    location: newMenuLocation,
                  });
                  setNewMenuName("");
                  setNewMenuLocation("");
                }}
              >
                Create Menu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu._id}>
                  <TableCell className="font-medium">{menu.name}</TableCell>
                  <TableCell className="capitalize">{menu.location}</TableCell>
                  <TableCell>{menu.itemCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(`/admin/settings/menus/${menu._id}`);
                          }}
                        >
                          Edit Menu Items
                        </DropdownMenuItem>
                        <DropdownMenuItem>Rename Menu</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete Menu
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
