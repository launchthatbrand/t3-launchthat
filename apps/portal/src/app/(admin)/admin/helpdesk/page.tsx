"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GlobalSearchCommand } from "@/components/shared/GlobalSearchCommand";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { BookOpen, ChevronRight, PlusCircle } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function HelpdeskPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<
    Array<{ name: string; count: number }>
  >([{ name: "All", count: 0 }]);

  // Fetch categories from Convex
  const categoryData = useQuery(api.helpdesk.getHelpdeskCategories);

  // Fetch articles from Convex with optional category filter
  const articles = useQuery(api.helpdesk.getHelpdeskArticles, {
    categoryFilter: activeCategory !== "all" ? activeCategory : undefined,
  });

  // Update categories when data loads
  useEffect(() => {
    if (categoryData) {
      // Calculate total count for the "All" category
      const totalCount = categoryData.reduce((acc, cat) => acc + cat.count, 0);

      // Add "All" category at the beginning
      setCategories([{ name: "All", count: totalCount }, ...categoryData]);
    }
  }, [categoryData]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category.toLowerCase());
  };

  // Loading skeleton UI
  if (!articles) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Helpdesk</h1>
            <p className="text-muted-foreground">
              Manage help articles and documentation for your users
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-full md:w-64">
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <Skeleton className="h-10 w-[400px]" />
          </TabsList>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-start gap-4">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="w-full space-y-1">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="ml-auto h-8 w-24" />
                  </CardFooter>
                </Card>
              ))}
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Helpdesk</h1>
          <p className="text-muted-foreground">
            Manage help articles and documentation for your users
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlobalSearchCommand
            typeFilters={["helpdesk"]}
            placeholder="Search help articles..."
            className="w-full md:w-64"
          />
          <Button asChild>
            <Link href="/admin/helpdesk/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Article
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeCategory}
        onValueChange={handleCategoryChange}
        className="space-y-4"
      >
        <TabsList className="flex flex-wrap">
          {categories.map((category) => (
            <TabsTrigger
              key={category.name.toLowerCase()}
              value={category.name.toLowerCase()}
            >
              {category.name} {category.count > 0 && `(${category.count})`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No articles found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeCategory === "all"
                  ? "Get started by creating your first help article."
                  : `No articles in the "${activeCategory}" category.`}
              </p>
              <Button asChild className="mt-4">
                <Link href="/admin/helpdesk/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Article
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Card key={article._id}>
                  <CardHeader className="flex flex-row items-start gap-4">
                    <BookOpen className="mt-1 h-5 w-5 text-primary" />
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">
                        {article.title}
                      </CardTitle>
                      <CardDescription>{article.category}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {article.summary}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="ml-auto"
                    >
                      <Link href={`/admin/helpdesk/article/${article.slug}`}>
                        <span>View Article</span>
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
