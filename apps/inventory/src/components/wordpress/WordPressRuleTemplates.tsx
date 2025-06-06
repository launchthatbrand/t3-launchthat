import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Rule } from "../rules/types";

export interface WordPressRuleTemplate {
  id: string;
  name: string;
  description: string;
  template: Partial<Rule>;
}

export interface WordPressRuleTemplatesProps {
  onSelectTemplate: (template: Partial<Rule>) => void;
}

export function WordPressRuleTemplates({
  onSelectTemplate,
}: WordPressRuleTemplatesProps) {
  // Define common rule templates for WordPress integration
  const templates: WordPressRuleTemplate[] = [
    {
      id: "post-publish-notification",
      name: "Post Publication Notification",
      description: "Send a notification when a new post is published",
      template: {
        name: "Post Publication Notification",
        description: "Send a notification when a new post is published",
        triggerType: "wordpress.post_published",
        triggerConfig: {
          postType: "post",
        },
        conditions: [],
        actions: [
          {
            type: "wordpress.send_email",
            config: {
              to: "",
              subject: "New post published on your WordPress site",
              body: "A new post has been published on your WordPress site.",
            },
          },
        ],
        enabled: true,
      },
    },
    {
      id: "new-user-notification",
      name: "New User Notification",
      description: "Send a notification when a new user registers",
      template: {
        name: "New User Notification",
        description: "Send a notification when a new user registers",
        triggerType: "wordpress.user_registered",
        triggerConfig: {
          role: "any",
        },
        conditions: [],
        actions: [
          {
            type: "wordpress.send_email",
            config: {
              to: "",
              subject: "New user registered on your WordPress site",
              body: "A new user has registered on your WordPress site.",
            },
          },
        ],
        enabled: true,
      },
    },
    {
      id: "category-cross-post",
      name: "Category Cross-Posting",
      description:
        "Create a new post when a post is published in a specific category",
      template: {
        name: "Category Cross-Posting",
        description:
          "Create a new post when a post is published in a specific category",
        triggerType: "wordpress.post_published",
        triggerConfig: {
          postType: "post",
        },
        conditions: [
          {
            type: "wordpress.post_category",
            config: {
              categoryId: "", // User will need to fill this in
            },
          },
        ],
        actions: [
          {
            type: "wordpress.create_post",
            config: {
              title: "Cross-post: {{post_title}}",
              content:
                "This is a cross-post from another category.\n\n{{post_content}}",
              postType: "post",
              status: "draft",
            },
          },
        ],
        enabled: true,
      },
    },
    {
      id: "comment-notification",
      name: "Comment Notification",
      description: "Send a notification when a new comment is posted",
      template: {
        name: "Comment Notification",
        description: "Send a notification when a new comment is posted",
        triggerType: "wordpress.comment_posted",
        triggerConfig: {
          status: "any",
        },
        conditions: [],
        actions: [
          {
            type: "wordpress.send_email",
            config: {
              to: "",
              subject: "New comment posted on your WordPress site",
              body: "A new comment has been posted on your WordPress site.",
            },
          },
        ],
        enabled: true,
      },
    },
    {
      id: "author-notification",
      name: "Author Notification",
      description:
        "Send a notification to the author when their post receives a comment",
      template: {
        name: "Author Notification",
        description:
          "Send a notification to the author when their post receives a comment",
        triggerType: "wordpress.comment_posted",
        triggerConfig: {
          status: "approved",
        },
        conditions: [],
        actions: [
          {
            type: "wordpress.send_email",
            config: {
              to: "{{post_author_email}}",
              subject: "New comment on your post",
              body: "Your post has received a new comment.",
            },
          },
        ],
        enabled: true,
      },
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-2 text-sm">
              <div className="font-medium">Includes:</div>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  WordPress{" "}
                  {template.template.triggerType
                    ?.replace("wordpress.", "")
                    .replace("_", " ")}{" "}
                  trigger
                </li>
                {template.template.conditions?.length ? (
                  <li>
                    {template.template.conditions.length} condition
                    {template.template.conditions.length > 1 ? "s" : ""}
                  </li>
                ) : null}
                <li>
                  {template.template.actions?.length} action
                  {template.template.actions?.length !== 1 ? "s" : ""}
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => onSelectTemplate(template.template)}
            >
              Use Template
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
