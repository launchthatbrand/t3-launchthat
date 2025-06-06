"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  BarChart,
  Calendar,
  LogIn,
  LogOut,
  Package,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function StoreAdminPage() {
  const [timeframe, setTimeframe] = useState("30days");

  // Fetch product count
  const productCountQuery = useQuery(
    api.ecommerce.products.index.getProductCount,
    {},
  );
  const productCount =
    typeof productCountQuery === "number" ? productCountQuery : 0;

  // Fetch orders count for analytics
  const ordersCount =
    useQuery(api.ecommerce.orders.index.getOrdersCount, {}) ?? 0;

  // Fetch order count for dashboard item
  const orderCountQuery = useQuery(
    api.ecommerce.orders.index.getOrdersCount,
    {},
  );
  const orderCount = typeof orderCountQuery === "number" ? orderCountQuery : 0;

  // Sample data for the analytics
  const sampleData = {
    newCustomers: 18,
    returningCustomers: ordersCount > 0 ? ordersCount - 18 : 29,
    popularProducts: [
      { name: "Product A", sales: 24 },
      { name: "Product B", sales: 18 },
      { name: "Product C", sales: 12 },
    ],
    salesByDay: [
      { day: "Mon", sales: 12 },
      { day: "Tue", sales: 8 },
      { day: "Wed", sales: 15 },
      { day: "Thu", sales: 20 },
      { day: "Fri", sales: 25 },
      { day: "Sat", sales: 18 },
      { day: "Sun", sales: 10 },
    ],
    statusBreakdown: [
      { status: "Pending Fulfillment", count: 12 },
      { status: "Processing", count: 8 },
      { status: "Shipped", count: 15 },
      { status: "Delivered", count: 10 },
      { status: "Cancelled", count: 2 },
    ],
  };

  const dashboardItems = [
    {
      title: "Product Catalog",
      description: "Manage your products, pricing, and inventory",
      icon: <Package className="h-8 w-8 text-blue-500" />,
      count: productCount,
      label: "Products",
      link: "/admin/products/catalog",
    },
    {
      title: "Orders",
      description: "View and manage customer orders",
      icon: <ShoppingCart className="h-8 w-8 text-amber-500" />,
      count: orderCount,
      label: "Orders",
      link: "/admin/orders",
    },
  ];

  // Action button handlers
  const handleCheckInOrder = () => {
    // Navigate to check-in order page or open modal
    console.log("Check In Order clicked");
  };

  const handleCheckOutOrder = () => {
    // Navigate to check-out order page or open modal
    console.log("Check Out Order clicked");
  };

  const handleAddProduct = () => {
    // Navigate to add product page
    console.log("Add Product clicked");
  };

  return (
    <div className="container space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Store Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh data</span>
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={handleCheckInOrder}>
          <LogIn className="mr-2 h-4 w-4" />
          Check In Order
        </Button>
        <Button onClick={handleCheckOutOrder}>
          <LogOut className="mr-2 h-4 w-4" />
          Check Out Order
        </Button>
        <Button onClick={handleAddProduct}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersCount}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from previous period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleData.newCustomers + sampleData.returningCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              {sampleData.newCustomers} new, {sampleData.returningCustomers}{" "}
              returning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {dashboardItems.map((item) => (
          <Link key={item.title} href={item.link} className="block">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  {item.icon}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="mt-4">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">
                    {item.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.label}
                  </div>
                </div>
                <Button variant="ghost" className="mt-4 w-full justify-between">
                  Manage <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  Daily sales for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {/* Sales chart would go here */}
                  <div className="flex h-full w-full items-center justify-center">
                    <BarChart className="h-16 w-16 text-muted-foreground" />
                    <p className="ml-2 text-muted-foreground">
                      Sales chart visualization
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>
                  Breakdown of current order statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sampleData.statusBreakdown.map((status) => (
                    <div
                      key={status.status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{status.status}</span>
                      </div>
                      <span className="font-medium">{status.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest orders and customer actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="ml-2 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        New order #1234
                      </p>
                      <p className="text-sm text-muted-foreground">
                        John Doe purchased 3 items
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">
                      2 hours ago
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="ml-2 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Order #1230 shipped
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tracking number: TRK123456789
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">
                      5 hours ago
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="ml-2 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        New customer signed up
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Jane Smith created an account
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">
                      8 hours ago
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Popular Products</CardTitle>
                <CardDescription>
                  Best selling products in this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sampleData.popularProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {index + 1}
                        </div>
                        <span>{product.name}</span>
                      </div>
                      <span className="font-medium">{product.sales} sold</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Data</CardTitle>
              <CardDescription>
                This tab would contain more detailed sales reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">
                  Detailed sales data would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                This tab would show detailed product analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">
                  Product performance data would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
              <CardDescription>
                This tab would contain customer analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">
                  Customer insights would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
