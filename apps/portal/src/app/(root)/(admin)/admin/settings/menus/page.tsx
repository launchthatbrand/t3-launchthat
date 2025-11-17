"use client";

import type { Doc } from "@/convex/_generated/dataModel";
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

import { useCreateMenu, useMenus, useUpdateMenu } from "./_api/menus";

const MENU_LOCATIONS = [
  { value: "primary", label: "Primary Navigation" },
  { value: "footer", label: "Footer Navigation" },
  { value: "sidebar", label: "Sidebar Navigation" },
] as const;

const getLocationLabel = (location: string) =>
  MENU_LOCATIONS.find((loc) => loc.value === location)?.label ?? location;

export default function MenusSettingsPage() {
  const router = useRouter();
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuLocation, setNewMenuLocation] = useState("");
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingLocation, setEditingLocation] = useState<string>("primary");

  const { data: menus } = useMenus();
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();

  const openEditDialog = (menu: Doc<"menus">) => {
    setEditingMenuId(menu._id);
    setEditingName(menu.name);
    setEditingLocation(menu.location);
  };

  const closeEditDialog = () => {
    setEditingMenuId(null);
    setEditingName("");
    setEditingLocation("primary");
  };

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
                    {MENU_LOCATIONS.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
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
                  <TableCell>{getLocationLabel(menu.location)}</TableCell>
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
                        <DropdownMenuItem onClick={() => openEditDialog(menu)}>
                          Edit Details
                        </DropdownMenuItem>
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

      <Dialog open={!!editingMenuId} onOpenChange={closeEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
            <DialogDescription>
              Update the menu name and location assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-menu-name">Menu Name</Label>
              <Input
                id="edit-menu-name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Menu name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-menu-location">Location</Label>
              <Select
                value={editingLocation}
                onValueChange={setEditingLocation}
              >
                <SelectTrigger id="edit-menu-location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MENU_LOCATIONS.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editingMenuId || !editingName) return;
                await updateMenu({
                  menuId: editingMenuId,
                  data: {
                    name: editingName,
                    location: editingLocation,
                  },
                });
                closeEditDialog();
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
