"use client";

import { useState } from "react";
import Link from "next/link";
import MondayIntegrationManager from "@/components/integrations/monday/MondayIntegrationManager";
import { WordPressIntegrationManager } from "@/components/integrations/wordpress/WordPressIntegrationManager";
import { Plus } from "lucide-react";

import { Card } from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<string>("monday");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services to enable automation and data
          synchronization.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Monday.com Integration Card */}
        <Card
          className={`cursor-pointer p-6 transition-all hover:border-primary ${
            activeTab === "monday" ? "border-primary" : ""
          }`}
          onClick={() => setActiveTab("monday")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-blue-100 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="h-8 w-8 text-blue-600"
              >
                <rect width="32" height="32" rx="4" fill="#0073EA" />
                <rect x="8" y="8" width="4" height="16" rx="2" fill="white" />
                <rect x="14" y="8" width="4" height="16" rx="2" fill="white" />
                <rect x="20" y="8" width="4" height="16" rx="2" fill="white" />
              </svg>
            </div>
            <h3 className="mb-1 text-xl font-medium">Monday.com</h3>
            <p className="text-sm text-muted-foreground">
              Connect to Monday.com for project and task management
            </p>
          </div>
        </Card>

        {/* WordPress Integration Card */}
        <Card
          className={`cursor-pointer p-6 transition-all hover:border-primary ${
            activeTab === "wordpress" ? "border-primary" : ""
          }`}
          onClick={() => setActiveTab("wordpress")}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-blue-100 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="h-8 w-8 text-blue-600"
              >
                <path
                  d="M16 4C9.373 4 4 9.373 4 16C4 22.627 9.373 28 16 28C22.627 28 28 22.627 28 16C28 9.373 22.627 4 16 4ZM5.388 16C5.388 14.018 5.965 12.14 6.976 10.551L12.934 25.177C8.406 23.734 5.388 20.182 5.388 16ZM16 26.612C14.695 26.612 13.439 26.379 12.272 25.954L15.858 15.923L19.548 25.571C19.566 25.612 19.585 25.65 19.606 25.687C18.5 26.283 17.279 26.612 16 26.612ZM17.291 11.328C17.929 11.295 18.51 11.23 18.51 11.23C19.085 11.163 19.018 10.323 18.443 10.356C18.443 10.356 16.736 10.49 15.576 10.49C14.484 10.49 12.743 10.356 12.743 10.356C12.169 10.323 12.102 11.196 12.676 11.23C12.676 11.23 13.224 11.295 13.795 11.328L15.866 17.28L13.106 25.663L8.353 11.328C8.991 11.295 9.573 11.23 9.573 11.23C10.147 11.163 10.08 10.323 9.505 10.356C9.505 10.356 7.798 10.49 6.639 10.49C6.44 10.49 6.215 10.485 5.978 10.476C7.83 7.423 11.657 5.388 16 5.388C19.337 5.388 22.35 6.713 24.441 8.844C24.389 8.842 24.339 8.837 24.282 8.837C23.19 8.837 22.401 9.763 22.401 10.757C22.401 11.23 22.653 11.772 22.938 12.431C23.156 12.949 23.375 13.603 23.375 14.459C23.375 15.034 23.212 15.709 22.893 16.578L21.866 19.75L17.291 11.328ZM24.238 15.08C24.238 18.774 21.829 21.936 18.443 23.126L22.027 13.343C22.906 13.842 23.377 14.476 23.778 15.2C23.963 15.534 24.238 16.204 24.238 15.08Z"
                  fill="#21759B"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-xl font-medium">WordPress</h3>
            <p className="text-sm text-muted-foreground">
              Connect to WordPress for content management and website
              integration
            </p>
          </div>
        </Card>

        {/* Add New Integration Card */}
        <Card className="cursor-pointer p-6 transition-all hover:border-primary">
          <Link
            href="#"
            className="flex h-full flex-col items-center justify-center text-center"
          >
            <div className="mb-4 rounded-full bg-gray-100 p-3">
              <Plus className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="mb-1 text-xl font-medium">Add New</h3>
            <p className="text-sm text-muted-foreground">
              Connect a new integration to extend functionality
            </p>
          </Link>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="monday">Monday.com</TabsTrigger>
          <TabsTrigger value="wordpress">WordPress</TabsTrigger>
        </TabsList>
        <TabsContent value="monday">
          <MondayIntegrationManager />
        </TabsContent>
        <TabsContent value="wordpress">
          <WordPressIntegrationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
