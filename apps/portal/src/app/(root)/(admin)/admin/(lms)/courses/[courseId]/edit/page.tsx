"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { CourseForm, CourseFormValues } from "@/components/CourseForm";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { ChevronLeft } from "lucide-react";
import { ContentAccess } from "@/components/admin/ContentAccess";
import type { Id } from "@convex-config/_generated/dataModel";
import Link from "next/link";
import { LinkedProduct } from "@/components/admin/LinkedProduct";
import { Separator } from "@acme/ui/separator";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui/toast";
import { useParams } from "next/navigation";

export default function EditCoursePage() {
  const params = useParams();
  const courseIdTyped = params.courseId as unknown as Id<"courses">;
  const [activeTab, setActiveTab] = useState("details");

  // Fetch course details
  const course = useQuery(api.lms.courses.index.getCourse, {
    courseId: courseIdTyped,
  });

  const updateCourse = useMutation(api.lms.courses.index.updateCourse);

  if (course === undefined) {
    return <div>Loading course details...</div>;
  }

  if (course === null) {
    return <div>Course not found.</div>;
  }

  const lessonCount = course.courseStructure?.length ?? 0;

  const handleSaveCourse = async (values: CourseFormValues) => {
    await updateCourse({
      courseId: courseIdTyped,
      title: values.title,
      description: values.description,
      isPublished: values.isPublished ?? false,
    });
    toast.success("Course updated");
  };

  const handleAccessRulesChange = (accessRules: any) => {
    console.log("Access rules changed:", accessRules);
    // TODO: Save access rules to backend
  };

  const handleProductLinked = (productId: string | undefined) => {
    console.log("Product linked:", productId);
    // The LinkedProduct component handles the backend update
    // We could refetch course data here if needed
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/courses">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-2xl font-semibold">Edit Course</h2>
      </div>

      {/* Course Header Info */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{course.title}</CardTitle>
            <CardDescription>
              Course ID: {course._id} – Created:{" "}
              {new Date(course._creationTime).toLocaleDateString()}
              {lessonCount > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  Lessons: {lessonCount}
                </span>
              )}
            </CardDescription>
          </div>
          {course.isPublished !== undefined && (
            <Badge variant={course.isPublished ? "default" : "secondary"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Description:</p>
          <p>{course.description ?? "No description provided."}</p>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="access">Content Access</TabsTrigger>
          <TabsTrigger value="product">Linked Product</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <CourseForm
            initialData={{
              title: course.title,
              description: course.description ?? "",
              isPublished: course.isPublished ?? false,
            }}
            onSubmit={handleSaveCourse}
            isSubmitting={false}
            submitButtonText="Save Course"
          />
        </TabsContent>

        <TabsContent value="access">
          <ContentAccess
            contentType="course"
            contentId={courseIdTyped}
            onAccessRulesChange={handleAccessRulesChange}
          />
        </TabsContent>

        <TabsContent value="product">
          <LinkedProduct
            contentType="course"
            contentId={courseIdTyped}
            currentProductId={course.productId}
            onProductLinked={handleProductLinked}
          />
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <Card>
        <CardFooter className="pt-6">
          <Button asChild variant="secondary">
            <Link href="/admin/courses">Back to List</Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
