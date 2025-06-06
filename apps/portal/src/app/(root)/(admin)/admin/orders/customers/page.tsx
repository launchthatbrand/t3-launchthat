"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/utils";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Eye, Search, UserCog } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  // This is a placeholder - in a real implementation, you would create a dedicated
  // Convex function to fetch customers who have placed orders
  const customers =
    useQuery(api.ecommerce.orders.getRecentCustomers, {
      limit: pageSize,
      skip: pageIndex * pageSize,
      searchQuery,
    }) || [];

  // Placeholder for total customers count
  const totalCustomers = 23; // This would be fetched from a Convex function

  const totalPages = Math.ceil(totalCustomers / pageSize);

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Customers</h2>
      <p className="text-muted-foreground">
        View and manage customers who have placed orders.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>
            Search, view, and manage your customer information.
          </CardDescription>
          <div className="mt-4 flex justify-between">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.orderCount}</TableCell>
                    <TableCell>
                      {customer.lastOrderDate
                        ? formatDate(customer.lastOrderDate)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(customer.totalSpent / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <UserCog className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Orders
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">
                    {searchQuery ? (
                      <p>No customers found matching your search.</p>
                    ) : (
                      <p>Loading customers...</p>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <strong>
                  {pageIndex * pageSize + 1}-
                  {Math.min((pageIndex + 1) * pageSize, totalCustomers)}
                </strong>{" "}
                of <strong>{totalCustomers}</strong> customers
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                  disabled={pageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <div className="text-sm">
                  Page {pageIndex + 1} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPageIndex(Math.min(totalPages - 1, pageIndex + 1))
                  }
                  disabled={pageIndex >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
