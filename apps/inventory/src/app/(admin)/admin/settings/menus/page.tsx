"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Edit, Plus, Trash } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

// Mock data for menus
const mockMenus = [
  {
    id: "1",
    name: "Main Navigation",
    location: "header",
    itemCount: 5,
  },
  {
    id: "2",
    name: "Footer Links",
    location: "footer",
    itemCount: 8,
  },
  {
    id: "3",
    name: "User Dashboard",
    location: "dashboard",
    itemCount: 4,
  },
];

// Mock data for menu items
const mockMenuItems = [
  {
    id: "1",
    label: "Home",
    url: "/",
    menuId: "1",
    parent: null,
    order: 1,
  },
  {
    id: "2",
    label: "Courses",
    url: "/courses",
    menuId: "1",
    parent: null,
    order: 2,
  },
  {
    id: "3",
    label: "Online Courses",
    url: "/courses/online",
    menuId: "1",
    parent: "2",
    order: 1,
  },
  {
    id: "4",
    label: "In-Person Workshops",
    url: "/courses/workshops",
    menuId: "1",
    parent: "2",
    order: 2,
  },
  {
    id: "5",
    label: "About",
    url: "/about",
    menuId: "1",
    parent: null,
    order: 3,
  },
];

export default function MenusSettingsPage() {
  const [activeTab, setActiveTab] = useState("menus");
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  // Filter menu items for the selected menu
  const filteredMenuItems = selectedMenu
    ? mockMenuItems.filter((item) => item.menuId === selectedMenu)
    : [];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Menu Items</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Manage navigation menus and their structure across the site
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="menus">Menus</TabsTrigger>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
        </TabsList>

        <TabsContent value="menus">
          <div className="mb-4 flex justify-between">
            <h2 className="text-xl font-semibold">Available Menus</h2>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Menu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Menu</DialogTitle>
                  <DialogDescription>
                    Add a new navigation menu to your site
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="menu-name">Menu Name</Label>
                    <Input id="menu-name" placeholder="e.g., Main Navigation" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="menu-location">Location</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">Header</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="mobile">
                          Mobile Navigation
                        </SelectItem>
                        <SelectItem value="dashboard">
                          User Dashboard
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Menu</Button>
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
                  {mockMenus.map((menu) => (
                    <TableRow key={menu.id}>
                      <TableCell className="font-medium">{menu.name}</TableCell>
                      <TableCell className="capitalize">
                        {menu.location}
                      </TableCell>
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
                                setSelectedMenu(menu.id);
                                setActiveTab("items");
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
        </TabsContent>

        <TabsContent value="items">
          <div className="mb-4 flex justify-between">
            <h2 className="text-xl font-semibold">Menu Items</h2>

            <div className="flex gap-2">
              <Select
                value={selectedMenu || ""}
                onValueChange={setSelectedMenu}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select menu" />
                </SelectTrigger>
                <SelectContent>
                  {mockMenus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedMenu && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Menu Item</DialogTitle>
                      <DialogDescription>
                        Add a new item to this menu
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="item-label">Label</Label>
                        <Input id="item-label" placeholder="e.g., About Us" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="item-url">URL</Label>
                        <Input id="item-url" placeholder="e.g., /about" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="item-parent">
                          Parent Item (Optional)
                        </Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="None (Top Level)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None (Top Level)</SelectItem>
                            {filteredMenuItems
                              .filter((item) => item.parent === null)
                              .map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Item</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {selectedMenu ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMenuItems.map((item) => {
                      const parentItem = item.parent
                        ? mockMenuItems.find((i) => i.id === item.parent)
                        : null;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.parent && <span className="ml-4">↳ </span>}
                            {item.label}
                          </TableCell>
                          <TableCell>{item.url}</TableCell>
                          <TableCell>
                            {parentItem ? parentItem.label : "-"}
                          </TableCell>
                          <TableCell>{item.order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-4 text-muted-foreground">
                  Select a menu to manage its items
                </p>
                <Select
                  value={selectedMenu || ""}
                  onValueChange={setSelectedMenu}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMenus.map((menu) => (
                      <SelectItem key={menu.id} value={menu.id}>
                        {menu.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
