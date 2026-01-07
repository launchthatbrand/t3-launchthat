"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Plus } from "lucide-react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
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
import { EntityList } from "@acme/ui/entity-list";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { useTenant } from "~/context/TenantContext";
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
  const tenant = useTenant();
  const organizationId =
    tenant && typeof (tenant as { _id?: unknown })._id === "string"
      ? ((tenant as { _id: string })._id as Id<"organizations">)
      : null;
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuLocation, setNewMenuLocation] = useState("");
  const [editingMenuId, setEditingMenuId] = useState<Id<"menus"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingLocation, setEditingLocation] = useState<string>("primary");

  const { data: menus, isLoading: menusLoading } = useMenus();
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

  const menuColumns: ColumnDefinition<Doc<"menus">>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Menu Name",
      cell: (menu: Doc<"menus">) => (
        <span className="font-medium">{menu.name}</span>
      ),
    },
    {
      id: "location",
      accessorKey: "location",
      header: "Location",
      cell: (menu: Doc<"menus">) => getLocationLabel(menu.location),
    },
    {
      id: "itemCount",
      accessorKey: "itemCount",
      header: <div className="text-center">Items</div>,
      cell: (menu: Doc<"menus">) => (
        <div className="text-center">{menu.itemCount ?? 0}</div>
      ),
    },
    {
      id: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (menu: Doc<"menus">) => {
        return (
          <div className="flex justify-end">
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
          </div>
        );
      },
    },
  ];

  const renderCreateMenuDialog = () => (
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
          <DialogDescription>Create a new menu for your site</DialogDescription>
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
            <Select value={newMenuLocation} onValueChange={setNewMenuLocation}>
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
              if (!organizationId) return;
              await createMenu({
                organizationId,
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
  );

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Admin Menu</h2>
            <p className="text-muted-foreground text-sm">
              The admin sidebar menu is built-in and cannot be deleted, but you
              can reorder items, hide entries, or add custom links.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/settings/menus/admin">Configure Admin Menu</Link>
          </Button>
        </CardContent>
      </Card>
      <EntityList<Doc<"menus">>
        data={menus}
        columns={menuColumns}
        // title="All Menus"
        // description="Overview of your registered navigation menus"
        actions={renderCreateMenuDialog()}
        isLoading={menusLoading}
        enableSearch
        viewModes={["list"]}
        emptyState={
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <p className="text-muted-foreground">
              No menus yet. Use &ldquo;Create Menu&rdquo; to add your first
              navigation.
            </p>
          </div>
        }
      />

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
                if (!organizationId) return;
                await updateMenu({
                  organizationId,
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
