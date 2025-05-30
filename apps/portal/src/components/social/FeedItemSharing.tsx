"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  GraduationCap,
  ShoppingBag,
  Users,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { ContentToShare } from "./ShareDialog";
import { ShareButton } from "./ShareButton";

export function FeedItemSharing() {
  const [activeTab, setActiveTab] = useState("post");

  // Example content objects for different content types
  const postContent: ContentToShare = {
    id: "example-post-id",
    type: "feedItem",
    title: "Example Post",
    description: "This is an example post to demonstrate sharing.",
    imageUrl: "https://picsum.photos/800/600",
  };

  const blogContent: ContentToShare = {
    id: "example-blog-id",
    type: "blog",
    title: "10 Tips for Productivity",
    description: "Boost your productivity with these 10 simple tips.",
    imageUrl: "https://picsum.photos/800/600?random=1",
  };

  const courseContent: ContentToShare = {
    id: "example-course-id",
    type: "course",
    title: "Learn React in 30 Days",
    description: "A comprehensive course to master React.",
    imageUrl: "https://picsum.photos/800/600?random=2",
    price: "$49.99",
  };

  const productContent: ContentToShare = {
    id: "example-product-id",
    type: "product",
    title: "Premium Notebook",
    description: "High-quality notebook for all your creative ideas.",
    imageUrl: "https://picsum.photos/800/600?random=3",
    price: "$24.99",
  };

  const eventContent: ContentToShare = {
    id: "example-event-id",
    type: "event",
    title: "Annual Tech Conference",
    description: "Join us for our annual tech conference.",
    imageUrl: "https://picsum.photos/800/600?random=4",
    date: "May 15, 2023",
    location: "San Francisco, CA",
  };

  const groupContent: ContentToShare = {
    id: "example-group-id",
    type: "group",
    title: "Web Developers Community",
    description: "A community for web developers to share and learn.",
    imageUrl: "https://picsum.photos/800/600?random=5",
  };

  // Get content based on active tab
  const getContentForTab = (): ContentToShare => {
    switch (activeTab) {
      case "post":
        return postContent;
      case "blog":
        return blogContent;
      case "course":
        return courseContent;
      case "product":
        return productContent;
      case "event":
        return eventContent;
      case "group":
        return groupContent;
      default:
        return postContent;
    }
  };

  // Get icon based on content type
  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case "post":
        return <FileText className="h-4 w-4" />;
      case "blog":
        return <BookOpen className="h-4 w-4" />;
      case "course":
        return <GraduationCap className="h-4 w-4" />;
      case "product":
        return <ShoppingBag className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Content Sharing Demo</CardTitle>
        <CardDescription>
          Demonstrate sharing different types of content from your platform
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs
          defaultValue="post"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="post" className="flex items-center gap-1">
              {getTabIcon("post")} Post
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-1">
              {getTabIcon("blog")} Blog
            </TabsTrigger>
            <TabsTrigger value="course" className="flex items-center gap-1">
              {getTabIcon("course")} Course
            </TabsTrigger>
            <TabsTrigger value="product" className="flex items-center gap-1">
              {getTabIcon("product")} Product
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-1">
              {getTabIcon("event")} Event
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-1">
              {getTabIcon("group")} Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="post" className="mt-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                {getTabIcon("post")}
                <h3 className="text-lg font-semibold">{postContent.title}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {postContent.description}
              </p>
              {postContent.imageUrl && (
                <div className="relative mb-4 h-40 overflow-hidden rounded-md">
                  <img
                    src={postContent.imageUrl}
                    alt={postContent.title ?? "Content image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="blog" className="mt-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                {getTabIcon("blog")}
                <h3 className="text-lg font-semibold">{blogContent.title}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {blogContent.description}
              </p>
              {blogContent.imageUrl && (
                <div className="relative mb-4 h-40 overflow-hidden rounded-md">
                  <img
                    src={blogContent.imageUrl}
                    alt={blogContent.title ?? "Content image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="course" className="mt-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                {getTabIcon("course")}
                <h3 className="text-lg font-semibold">{courseContent.title}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {courseContent.description}
              </p>
              {courseContent.imageUrl && (
                <div className="relative mb-4 h-40 overflow-hidden rounded-md">
                  <img
                    src={courseContent.imageUrl}
                    alt={courseContent.title ?? "Content image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {courseContent.price && (
                <div className="flex items-center gap-1 text-sm">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{courseContent.price}</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="product" className="mt-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                {getTabIcon("product")}
                <h3 className="text-lg font-semibold">
                  {productContent.title}
                </h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {productContent.description}
              </p>
              {productContent.imageUrl && (
                <div className="relative mb-4 h-40 overflow-hidden rounded-md">
                  <img
                    src={productContent.imageUrl}
                    alt={productContent.title ?? "Content image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {productContent.price && (
                <div className="flex items-center gap-1 text-sm">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{productContent.price}</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="event" className="mt-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                {getTabIcon("event")}
                <h3 className="text-lg font-semibold">{eventContent.title}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {eventContent.description}
              </p>
              {eventContent.imageUrl && (
                <div className="relative mb-4 h-40 overflow-hidden rounded-md">
                  <img
                    src={eventContent.imageUrl}
                    alt={eventContent.title ?? "Content image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {eventContent.date && (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{eventContent.date}</span>
                  </div>
                )}
                {eventContent.location && (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{eventContent.location}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="group" className="mt-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                {getTabIcon("group")}
                <h3 className="text-lg font-semibold">{groupContent.title}</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                {groupContent.description}
              </p>
              {groupContent.imageUrl && (
                <div className="relative mb-4 h-40 overflow-hidden rounded-md">
                  <img
                    src={groupContent.imageUrl}
                    alt={groupContent.title ?? "Content image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-end">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="#" className="flex items-center gap-1">
              View <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Button>
          <ShareButton
            content={getContentForTab()}
            variant="primary"
            size="sm"
            onShareComplete={() => {
              console.log("Content shared successfully");
            }}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
