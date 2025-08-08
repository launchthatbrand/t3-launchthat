"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowRight, ListTree, Package, ShoppingCart, Tag } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export default function ProductsAdminPage() {
  // Fetch product count
  const productCountQuery = useQuery(
    api.ecommerce.products.queries.getProductCount,
    {},
  );
  const productCount =
    typeof productCountQuery === "number" ? productCountQuery : 0;

  // Fetch category count
  const categoryCountQuery = useQuery(
    api.ecommerce.products.queries.getCategoryCount,
    {},
  );
  const categoryCount =
    typeof categoryCountQuery === "number" ? categoryCountQuery : 0;

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
      title: "Categories",
      description: "Organize products with hierarchical categories",
      icon: <ListTree className="h-8 w-8 text-green-500" />,
      count: categoryCount,
      label: "Categories",
      link: "/admin/products/categories",
    },
    {
      title: "Attributes",
      description: "Manage product attributes and variations",
      icon: <Tag className="h-8 w-8 text-purple-500" />,
      count: 0,
      label: "Attributes",
      link: "/admin/products/attributes",
    },
    {
      title: "Orders",
      description: "View and manage customer orders",
      icon: <ShoppingCart className="h-8 w-8 text-amber-500" />,
      count: 0,
      label: "Orders",
      link: "/admin/orders",
    },
  ];

  return (
    <div className="container p-6">
      <h1 className="mb-6 text-3xl font-bold">Products Management</h1>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
    </div>
  );
}
