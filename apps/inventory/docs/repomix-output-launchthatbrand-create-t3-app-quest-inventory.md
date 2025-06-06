This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
drizzle/
  meta/
    _journal.json
    0000_snapshot.json
  0000_pretty_raza.sql
src/
  app/
    _components/
      ui/
        accordion.tsx
        alert-dialog.tsx
        button.tsx
        card.tsx
        command.tsx
        dialog.tsx
        dropdown-menu.tsx
        form.tsx
        input.tsx
        label.tsx
        navigation-menu.tsx
        popover.tsx
        scroll-area.tsx
        select.tsx
        sheet.tsx
        table.tsx
        textarea.tsx
        toast.tsx
        toaster.tsx
        use-toast.ts
      AuthButton.tsx
      CheckinForm.tsx
      ComboBox.tsx
      Confetti.tsx
      create-post.tsx
      DefaultForm.tsx
      DemoComponent.tsx
      Header.tsx
      LoginForm.tsx
      Logo.tsx
      Post.tsx
      RegisterForm.tsx
      Table.tsx
      TopNavbar.tsx
    (auth)/
      login/
        page.tsx
      register/
        page.tsx
      resetpass/
        page.tsx
      actions.ts
    api/
      auth/
        [...nextauth]/
          route.ts
      trpc/
        [trpc]/
          route.ts
    demo/
      supabaseclient/
        page.tsx
      page.tsx
    monday/
      categories/
        page.tsx
      form/
        page.tsx
      workspaces/
        actions.ts
        page.tsx
      actions.ts
    order/
      [slug]/
        actions.ts
        page.tsx
      checkin/
        page.tsx
      checkout/
        actions.ts
        page.tsx
      actions.ts
      page.tsx
    supabase/
      posts/
        page.tsx
    layout.tsx
    page.tsx
  lib/
    supabase/
      browser.ts
      server.ts
    apollo-client.ts
    fetchCategories.graphql
    utils.ts
  server/
    api/
      routers/
        formResponse.ts
        post.ts
        user.ts
      root.ts
      trpc.ts
    db/
      index.ts
      schema.ts
    auth.ts
  styles/
    globals.css
  trpc/
    react.tsx
    server.ts
    shared.ts
  env.js
  middleware.tsx
.eslintrc.cjs
.gitignore
codegen.ts
components.json
drizzle.config.ts
next.config.js
package.json
postcss.config.cjs
prettier.config.js
README.md
tailwind.config.ts
tsconfig.json
```

# Files

## File: drizzle/meta/_journal.json
```json
{
  "version": "5",
  "dialect": "pg",
  "entries": [
    {
      "idx": 0,
      "version": "5",
      "when": 1716565274946,
      "tag": "0000_pretty_raza",
      "breakpoints": true
    }
  ]
}
```

## File: drizzle/meta/0000_snapshot.json
```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "prevId": "",
  "version": "5",
  "dialect": "pg",
  "tables": {
    "create-t3-app_post": {
      "name": "create-t3-app_post",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "varchar(256)",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true,
          "default": "CURRENT_TIMESTAMP"
        },
        "updatedAt": {
          "name": "updatedAt",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {
        "name_idx": {
          "name": "name_idx",
          "columns": [
            "name"
          ],
          "isUnique": false
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {}
    },
    "create-t3-app_user": {
      "name": "create-t3-app_user",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true
        },
        "email": {
          "name": "email",
          "type": "varchar(256)",
          "primaryKey": false,
          "notNull": false
        },
        "tel": {
          "name": "tel",
          "type": "varchar(256)",
          "primaryKey": false,
          "notNull": false
        },
        "firstName": {
          "name": "firstName",
          "type": "varchar(256)",
          "primaryKey": false,
          "notNull": false
        },
        "lastName": {
          "name": "lastName",
          "type": "varchar(256)",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {},
      "foreignKeys": {
        "create-t3-app_user_id_users_id_fk": {
          "name": "create-t3-app_user_id_users_id_fk",
          "tableFrom": "create-t3-app_user",
          "tableTo": "users",
          "schemaTo": "auth",
          "columnsFrom": [
            "id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {}
    },
    "create-t3-app_formResponses": {
      "name": "create-t3-app_formResponses",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "serial",
          "primaryKey": true,
          "notNull": true
        },
        "data": {
          "name": "data",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true,
          "default": "CURRENT_TIMESTAMP"
        },
        "updatedAt": {
          "name": "updatedAt",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "mondayItemId": {
          "name": "mondayItemId",
          "type": "varchar(256)",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "varchar(256)",
          "primaryKey": false,
          "notNull": false
        },
        "createdById": {
          "name": "createdById",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {},
      "foreignKeys": {
        "create-t3-app_formResponses_createdById_fkey": {
          "name": "create-t3-app_formResponses_createdById_fkey",
          "tableFrom": "create-t3-app_formResponses",
          "tableTo": "create-t3-app_user",
          "schemaTo": "public",
          "columnsFrom": [
            "createdById"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {}
    }
  },
  "enums": {
    "key_status": {
      "name": "key_status",
      "values": {
        "default": "default",
        "valid": "valid",
        "invalid": "invalid",
        "expired": "expired"
      }
    },
    "key_type": {
      "name": "key_type",
      "values": {
        "aead-ietf": "aead-ietf",
        "aead-det": "aead-det",
        "hmacsha512": "hmacsha512",
        "hmacsha256": "hmacsha256",
        "auth": "auth",
        "shorthash": "shorthash",
        "generichash": "generichash",
        "kdf": "kdf",
        "secretbox": "secretbox",
        "secretstream": "secretstream",
        "stream_xchacha20": "stream_xchacha20"
      }
    },
    "aal_level": {
      "name": "aal_level",
      "values": {
        "aal1": "aal1",
        "aal2": "aal2",
        "aal3": "aal3"
      }
    },
    "code_challenge_method": {
      "name": "code_challenge_method",
      "values": {
        "s256": "s256",
        "plain": "plain"
      }
    },
    "factor_status": {
      "name": "factor_status",
      "values": {
        "unverified": "unverified",
        "verified": "verified"
      }
    },
    "factor_type": {
      "name": "factor_type",
      "values": {
        "totp": "totp",
        "webauthn": "webauthn"
      }
    },
    "equality_op": {
      "name": "equality_op",
      "values": {
        "eq": "eq",
        "neq": "neq",
        "lt": "lt",
        "lte": "lte",
        "gt": "gt",
        "gte": "gte",
        "in": "in"
      }
    },
    "action": {
      "name": "action",
      "values": {
        "INSERT": "INSERT",
        "UPDATE": "UPDATE",
        "DELETE": "DELETE",
        "TRUNCATE": "TRUNCATE",
        "ERROR": "ERROR"
      }
    },
    "one_time_token_type": {
      "name": "one_time_token_type",
      "values": {
        "confirmation_token": "confirmation_token",
        "reauthentication_token": "reauthentication_token",
        "recovery_token": "recovery_token",
        "email_change_token_new": "email_change_token_new",
        "email_change_token_current": "email_change_token_current",
        "phone_change_token": "phone_change_token"
      }
    }
  },
  "schemas": {},
  "_meta": {
    "schemas": {},
    "tables": {},
    "columns": {}
  }
}
```

## File: drizzle/0000_pretty_raza.sql
```sql
-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "key_status" AS ENUM('default', 'valid', 'invalid', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "key_type" AS ENUM('aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "aal_level" AS ENUM('aal1', 'aal2', 'aal3');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "code_challenge_method" AS ENUM('s256', 'plain');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "factor_status" AS ENUM('unverified', 'verified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "factor_type" AS ENUM('totp', 'webauthn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "equality_op" AS ENUM('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "action" AS ENUM('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "one_time_token_type" AS ENUM('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "create-t3-app_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "create-t3-app_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(256),
	"tel" varchar(256),
	"firstName" varchar(256),
	"lastName" varchar(256)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "create-t3-app_formResponses" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp,
	"mondayItemId" varchar(256),
	"status" varchar(256),
	"createdById" uuid
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "create-t3-app_post" ("name");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "create-t3-app_user" ADD CONSTRAINT "create-t3-app_user_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "create-t3-app_formResponses" ADD CONSTRAINT "create-t3-app_formResponses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."create-t3-app_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/
```

## File: src/app/_components/ui/accordion.tsx
```typescript
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "src/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

## File: src/app/_components/ui/alert-dialog.tsx
```typescript
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "src/lib/utils"
import { buttonVariants } from "src/app/_components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

## File: src/app/_components/ui/button.tsx
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "src/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## File: src/app/_components/ui/card.tsx
```typescript
import * as React from "react"

import { cn } from "src/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

## File: src/app/_components/ui/command.tsx
```typescript
"use client";

import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "src/lib/utils";
import { Dialog, DialogContent } from "src/app/_components/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50",
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
```

## File: src/app/_components/ui/dialog.tsx
```typescript
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "src/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

## File: src/app/_components/ui/dropdown-menu.tsx
```typescript
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "src/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
```

## File: src/app/_components/ui/form.tsx
```typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "src/lib/utils"
import { Label } from "src/app/_components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
```

## File: src/app/_components/ui/input.tsx
```typescript
/* eslint-disable @typescript-eslint/no-empty-interface */

import * as React from "react";

import { cn } from "src/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

## File: src/app/_components/ui/label.tsx
```typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "src/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

## File: src/app/_components/ui/navigation-menu.tsx
```typescript
import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "src/lib/utils"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
```

## File: src/app/_components/ui/popover.tsx
```typescript
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "src/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
```

## File: src/app/_components/ui/scroll-area.tsx
```typescript
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "src/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

## File: src/app/_components/ui/select.tsx
```typescript
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "src/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

## File: src/app/_components/ui/sheet.tsx
```typescript
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "src/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```

## File: src/app/_components/ui/table.tsx
```typescript
import * as React from "react"

import { cn } from "src/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

## File: src/app/_components/ui/textarea.tsx
```typescript
/* eslint-disable @typescript-eslint/no-empty-interface */
import * as React from "react";

import { cn } from "src/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
```

## File: src/app/_components/ui/toast.tsx
```typescript
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "src/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

## File: src/app/_components/ui/toaster.tsx
```typescript
"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "src/app/_components/ui/toast"
import { useToast } from "src/app/_components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

## File: src/app/_components/ui/use-toast.ts
```typescript
// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "src/app/_components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

## File: src/app/_components/AuthButton.tsx
```typescript
import { readUserSession, signOut } from "../(auth)/actions";

import { Button } from "./ui/button";
import React from "react";
import { redirect } from "next/navigation";
import { toast } from "./ui/use-toast";

async function handleSignout() {
  "use server";
  const { error } = await signOut();

  if (error?.message) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{error.message}</code>
        </pre>
      ),
    });
  } else {
    toast({
      title: "Sucessfully Logged Out:",
    });
    redirect("/login");
  }
}

async function AuthButton() {
  const {
    data: { session },
  } = await readUserSession();
  if (!session)
    return (
      <form>
        <Button variant={"outline"}>Sign In</Button>
      </form>
    );
  return (
    <form action={handleSignout}>
      <Button variant={"outline"}>Sign Out</Button>
    </form>
  );
}

export default AuthButton;
```

## File: src/app/_components/CheckinForm.tsx
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckIcon, TrashIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useEffect, useState } from "react";
import { TbCaretUpDownFilled, TbTrashX } from "react-icons/tb";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import ConfettiComponent from "./Confetti";
import { GroupedEvents } from "../order/actions";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { saveFormResponse } from "../monday/actions";
import { toast } from "./ui/use-toast";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export interface FormProps {
  data?: string | null;
  type: "in" | "out";
  categories?: Category[];
  events?: GroupedEvents | undefined;
  locations?: unknown;
  items?: unknown;
}

export interface Category {
  id: string;
  title: string;
}

export interface Event {
  id: string;
  title: string;
}

const formSchema = z.object({
  event: z.object({
    id: z.string({
      required_error: "Please select an Event.",
    }),
    name: z.string({
      required_error: "Please select an Event.",
    }),
  }),
  location: z.object({
    id: z.string({
      required_error: "Please select an Event.",
    }),
    name: z.string({
      required_error: "Please select an Event.",
    }),
  }),
  items: z.array(
    z.object({
      categories: z.object({
        id: z.string({
          required_error: "Please select an Event.",
        }),
        title: z.string({
          required_error: "Please select an Event.",
        }),
      }),
      id: z.string({
        required_error: "Please select an Event.",
      }),
      name: z.string({
        required_error: "Please select an Event.",
      }),
      desc: z.string().optional(),
      quantity: z.object({
        checkout: z.coerce.number({
          required_error: "Please select an Event.",
        }),
        checkin: z.coerce.number({
          required_error: "Please select an Event.",
        }),
      }),
    }),
  ),
});
export type InventoryFormData = z.infer<typeof formSchema>;

function enforceMinMax(el) {
  if (el.value != "") {
    if (parseInt(el.value) < parseInt(el.min)) {
      el.value = el.min;
    }
    if (parseInt(el.value) > parseInt(el.max)) {
      el.value = el.max;
    }
  }
}

export function CheckinForm({
  data,
  type,
  categories,
  events,
  locations,
  items,
}: FormProps) {
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isConfettiVisible, setIsConfettiVisible] = useState(false);
  // console.log("categories", categories);

  const router = useRouter();
  const checkin = type === "in";
  const eventsArray = events ? Object.values(events) : undefined;

  // Handler to open or close popovers
  const handleOpenChange = (popoverId: string) => {
    setOpenPopover((current) => (current === popoverId ? null : popoverId));
  };

  //  Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      event: {},
      items: [],
    },
  });

  const {
    fields: itemFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "items", // The key of the field array
  });

  const showConfirmationModal = (data: object) => {
    // Store the validated form data for later submission or use it directly in the submit function
    setFormData(data); // Assuming you have a state to temporarily hold the validated data
    console.log("showConfirmationModal", data);
    setIsModalOpen(true); // Show the modal for confirmation
  };

  // Define a submit handler.
  async function confirmAndSubmit() {
    console.log("Form data:", formData);
    const jsonValues = JSON.stringify(formData);
    if (!checkin) {
      const result = await saveFormResponse(jsonValues);
    } else {
    }

    form.reset();
    setIsModalOpen(false);

    // Show confetti
    setIsConfettiVisible(true);
    // Hide confetti after 5 seconds
    setTimeout(() => setIsConfettiVisible(false), 5000);

    //Show Toast
    toast({
      title: "Sucessfully Submitted",
      description: (
        // <div className="min-h-[150px]">{/* <ConfettiComponent /> */}</div>

        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          Sucessfully Submitted:
          <code className="text-white">
            {JSON.stringify(formData, null, 2)}
          </code>
          w
        </pre>
      ),
    });
  }
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log("form submitted", values);
    const jsonValues = JSON.stringify(values);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await saveFormResponse(jsonValues);

    toast({
      title: "Sucessfully Submitted:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          Sucessfully Submitted:
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
  }

  function onDelete(index: number) {
    console.log("onDeleteIndex", index);
    // Save it!
    console.log("form submitted", index);
    remove(index);
    toast({
      title: "Sucessfully Deleted Item:",
    });
  }

  useEffect(() => {
    if (data) {
      const parsedData = JSON.parse(data);
      console.log("parsedData", parsedData);

      form.reset(parsedData); // Prepopulate form if data is provided
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, form.reset]);

  useEffect(() => {
    const loadFilteredItems = () => {
      if (selectedCategory) {
        try {
          console.log("selectedCategory", selectedCategory);
          const newFilteredItems = items.filter(
            (item) => item.group.id === selectedCategory,
          );
          setFilteredItems(newFilteredItems);
          console.log("filteredItems", filteredItems);
        } catch (error) {
          console.error("Failed to fetch filtered data:", error);
          // Handle error or set data to null/empty state
        }
      } else {
        setFilteredItems([]);
      }
    };
    void loadFilteredItems();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  return (
    <div className="flex w-full flex-1 flex-col rounded-md bg-white p-3 text-black shadow-md md:w-2/5">
      {isConfettiVisible && <ConfettiComponent />}
      <div className="mb-10 flex w-full items-start justify-between">
        <span className="text-xl font-bold">
          {type === "in" ? "Check-In Form" : "Check-Out Form"}
        </span>

        <Button className="self-end" onClick={() => router.push("/order")}>
          Previous Orders
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 text-black"
        >
          <FormField
            control={form.control}
            name={`event`}
            render={({ field }) => (
              <FormItem className="flex w-full flex-col">
                <FormLabel className="flex items-start justify-between">
                  Event
                </FormLabel>

                <Popover
                  open={openPopover === `${field.name}`}
                  onOpenChange={() => handleOpenChange(`${field.name}`)}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value?.name && "text-muted-foreground",
                        )}
                        aria-required
                        disabled={checkin}
                      >
                        {field.value?.name ?? "Select event"}
                        <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search events..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No events found.</CommandEmpty>
                        {eventsArray?.map((group) => (
                          <div key={group.groupId}>
                            <CommandGroup heading={group.title}>
                              {group.items.map((event) => {
                                const formattedDate = event.column_values[0]
                                  .date
                                  ? event.column_values[0].date
                                      .split("-")
                                      .slice(1)
                                      .join("/")
                                  : "N/A";
                                return (
                                  <CommandItem
                                    value={event.name}
                                    key={event.id}
                                    onSelect={() => {
                                      form.setValue(`event`, {
                                        name: event.name,
                                        id: event.id,
                                      });
                                      setOpenPopover("");
                                    }}
                                  >
                                    {formattedDate && ` ${formattedDate} - `}
                                    {event.name}
                                    <CheckIcon
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        event.id === field.value?.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </div>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`location`}
            render={({ field }) => (
              <FormItem className="flex w-full flex-col">
                <FormLabel className="flex items-start justify-between">
                  Pickup/Dropoff Location
                </FormLabel>

                <Popover
                  open={openPopover === `${field.name}`}
                  onOpenChange={() => handleOpenChange(`${field.name}`)}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={checkin}
                      >
                        {field.value?.name ?? "Select pickup/dropoff location"}
                        <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandList>
                        <CommandInput
                          placeholder="Search locations..."
                          className="h-9"
                        />
                        <CommandEmpty>No location found.</CommandEmpty>
                        <ScrollArea className="h-[200px]">
                          <CommandGroup>
                            {locations?.map((location) => (
                              <CommandItem
                                value={location.name}
                                key={location.id}
                                onSelect={() => {
                                  form.setValue(`location`, {
                                    name: location.name,
                                    id: location.id,
                                  });
                                  setOpenPopover(false);
                                }}
                              >
                                {location.name}
                                <CheckIcon
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    location.id === field.value?.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </ScrollArea>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <Accordion type="multiple" collapsible className="w-full">
            <div className="space-y-3">
              {itemFields.map((field, index) => (
                <div
                  key={field.id}
                  className="z-50 flex w-full flex-col flex-wrap gap-y-3 space-y-3 rounded-md bg-slate-200 shadow-sm"
                >
                  <AccordionItem value={field.id} className="space-y-3 p-3">
                    <AccordionTrigger className="p-0">
                      {form.watch(`items.${index}.name`) ?? `Item ${index + 1}`}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.categories`}
                        render={({ field }) => (
                          <FormItem className="flex w-full flex-col">
                            <FormLabel className="flex items-start justify-between">
                              Category
                            </FormLabel>

                            <Popover
                              open={openPopover === `${field.name}`}
                              onOpenChange={() =>
                                handleOpenChange(`${field.name}`)
                              }
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground",
                                    )}
                                    disabled={checkin}
                                  >
                                    {field.value?.title ?? "Select Category"}
                                    <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Search categories..."
                                    className="h-9"
                                  />
                                  <CommandEmpty>
                                    No framework found.
                                  </CommandEmpty>
                                  <ScrollArea className="h-[200px]">
                                    <CommandList>
                                      <CommandGroup>
                                        {categories?.map((category) => (
                                          <CommandItem
                                            value={category.title}
                                            key={category.id}
                                            onSelect={() => {
                                              form.setValue(
                                                `items.${index}.categories`,
                                                {
                                                  title: category.title,
                                                  id: category.id,
                                                },
                                              );
                                              // form.setValue(
                                              //   `items.${index}.name`,
                                              //   undefined,
                                              // );
                                              setSelectedCategory(category.id);
                                              setOpenPopover("");
                                            }}
                                          >
                                            {category.title}
                                            <CheckIcon
                                              className={cn(
                                                "ml-auto h-4 w-4",
                                                category.id === field.value?.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </ScrollArea>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex w-[100%] flex-col">
                            <FormLabel>Product</FormLabel>

                            <Popover
                              open={openPopover === `${field.name}`}
                              onOpenChange={() =>
                                handleOpenChange(`${field.name}`)
                              }
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground",
                                    )}
                                    disabled={
                                      !form.watch(
                                        `items.${index}.categories`,
                                      ) || checkin
                                    }
                                  >
                                    {field.value.name
                                      ? field.value.name
                                      : !form.watch(`items.${index}.categories`)
                                        ? "Select a category first"
                                        : "Select Product"}

                                    <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command
                                  filter={(value, search) => {
                                    if (value.includes(search)) return 1;
                                    return 0;
                                  }}
                                >
                                  <CommandInput
                                    placeholder="Search products..."
                                    className="h-9"
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      No products found.
                                    </CommandEmpty>
                                    <ScrollArea className="h-[300px]">
                                      <CommandGroup>
                                        {filteredItems.map((item) => (
                                          <CommandItem
                                            value={item.name.replace(
                                              /"/g,
                                              '\\"',
                                            )}
                                            key={item.id}
                                            className="text-base font-medium"
                                            onSelect={() => {
                                              form.setValue(
                                                `items.${index}.name`,
                                                item.name,
                                              );
                                              form.setValue(
                                                `items.${index}.id`,
                                                item.id,
                                              );
                                              setOpenPopover(false);
                                            }}
                                          >
                                            <div className="flex items-center gap-x-5">
                                              <Image
                                                className="min-w-[120px]"
                                                src={
                                                  item.assets[0]?.public_url ??
                                                  "https://static.thenounproject.com/png/261694-200.png"
                                                }
                                                alt="product image"
                                                width={100}
                                                height={100}
                                              />
                                              {item.name}
                                            </div>

                                            <CheckIcon
                                              className={cn(
                                                "ml-auto h-4 w-4",
                                                item.id === field.value?.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </ScrollArea>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.desc`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                disabled={
                                  !form.watch(`items.${index}.categories`) ||
                                  checkin
                                }
                                placeholder="Additional notes here..."
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end justify-between space-x-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity.checkout`}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel>Checkout Quantity</FormLabel>
                              <FormDescription>
                                Total items checked out.
                              </FormDescription>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder={1}
                                  min={1}
                                  disabled={
                                    !form.watch(`items.${index}.categories`) ||
                                    checkin
                                  }
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {checkin && (
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity.checkin`}
                            render={({ field }) => {
                              const checkoutQuantity = form.watch(
                                `items.${index}.quantity.checkout`,
                              );
                              return (
                                <FormItem className="space-y-1">
                                  <FormLabel>Checkin Quantity</FormLabel>
                                  <FormDescription>
                                    Total items checked in.
                                  </FormDescription>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      min={0}
                                      max={checkoutQuantity}
                                      placeholder={1}
                                      disabled={
                                        !form.watch(`items.${index}.categories`)
                                      }
                                    />
                                  </FormControl>

                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger
                            disabled={checkin}
                            className="rounded-md bg-red-700 p-2 text-white shadow-md disabled:bg-slate-400"
                          >
                            <TrashIcon className="h-6 w-6" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your account and remove your
                                data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant={"destructive"}
                                  className="w-full"
                                  type="submit"
                                  onClick={() => onDelete(index)}
                                >
                                  Delete
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              ))}
            </div>
          </Accordion>

          {!checkin && (
            <Button
              className="self-end"
              type="button"
              onClick={() =>
                append({
                  quantity: {
                    checkout: 1,
                    checkin: 1,
                  },
                })
              }
            >
              Add Item
            </Button>
          )}

          <Button
            type="submit"
            onClick={form.handleSubmit(showConfirmationModal)}
          >
            {type === "in" ? "Check-In" : "Check-Out"}
          </Button>
          <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  order.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAndSubmit}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </Form>
    </div>
  );
}
```

## File: src/app/_components/ComboBox.tsx
```typescript
"use client";

import * as React from "react";

import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
];

export function ComboboxDemo() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select framework..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandEmpty>No framework found.</CommandEmpty>

          <CommandGroup>
            <CommandList>
              {frameworks?.map((framework) => (
                <CommandItem
                  className="data-[disabled='true']"
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === framework.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {framework.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

## File: src/app/_components/Confetti.tsx
```typescript
import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";

function ConfettiComponent() {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isClient, setClient] = useState(false);
  useEffect(() => {
    const { innerWidth: width, innerHeight: height } = window;
    setDimensions({
      width,
      height,
    });
    setClient(true);
  }, []);
  return (
    <div>
      {isClient && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
        />
      )}
    </div>
  );
}

export default ConfettiComponent;
```

## File: src/app/_components/create-post.tsx
```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

export function CreatePost() {
  const router = useRouter();
  const [name, setName] = useState("");

  const createPost = api.post.create.useMutation({
    onSuccess: () => {
      router.refresh();
      setName("");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createPost.mutate({ name });
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="text"
        placeholder="Title"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-full px-4 py-2 text-black"
      />
      <button
        type="submit"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
        disabled={createPost.isLoading}
      >
        {createPost.isLoading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

## File: src/app/_components/DefaultForm.tsx
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckIcon, TrashIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GroupedEvents, fetchSubEvents } from "../order/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useEffect, useState } from "react";
import { TbCaretUpDownFilled, TbTrashX } from "react-icons/tb";
import { saveFormResponse, updateFormResponse } from "../monday/actions";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import ConfettiComponent from "./Confetti";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "./ui/use-toast";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export interface FormProps {
  data?: string | null;
  type: "in" | "out";
  orderId?: number;
  categories?: Category[];
  events?: GroupedEvents | undefined;
  locations?: unknown;
  items?: unknown;
}

export interface Category {
  id: string;
  title: string;
}

export interface Event {
  id: string;
  title: string;
}

export type InventoryFormData = z.infer<typeof formSchema>;

function enforceMinMax(el) {
  if (el.value != "") {
    if (parseInt(el.value) < parseInt(el.min)) {
      el.value = el.min;
    }
    if (parseInt(el.value) > parseInt(el.max)) {
      el.value = el.max;
    }
  }
}

export function DefaultForm({
  data,
  type,
  orderId,
  categories,
  events,
  locations,
  items,
}: FormProps) {
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isConfettiVisible, setIsConfettiVisible] = useState(false);
  // console.log("categories", categories);

  const router = useRouter();
  const checkin = type === "in";
  const eventsArray = events ? Object.values(events) : undefined;

  // Define Form Schemas
  const baseItemSchema = z.object({
    categories: z.object({
      id: z.string({ required_error: "Please select an Event." }),
      title: z.string({ required_error: "Please select an Event." }),
    }),
    id: z.string({ required_error: "Please select an Event." }),
    name: z
      .string({
        required_error: "Please select an Event.",
        invalid_type_error: "Name must be a string",
      })
      .min(1, { message: "Checkin quantity should be at least 1" }),
    desc: z.string().optional(),
    // Define quantity with only checkout as required
    quantity: z.object({
      checkout: z.coerce.number({
        required_error: "Please specify a quantity.",
      }),
      // Initially, do not make checkin required
      checkin: z.coerce.number().optional(),
    }),
  });

  const checkinItemSchema = baseItemSchema.extend({
    itemId: z.string({ required_error: "Monday Item ID is required." }),
    quantity: baseItemSchema.shape.quantity
      .extend({
        checkin: z.coerce
          .number({
            required_error: "Checkin quantity is required",
            invalid_type_error: "Checkin quantity must be a number",
          })
          .int()
          .min(0, { message: "Checkin quantity should be at least 1" }),
      })
      .refine((data) => data.checkin <= data.checkout, {
        message:
          "Checkin amount must be less than or equal to the checkout amount",
        path: ["checkin"],
      }),
  });

  const baseFormSchema = z.object({
    event: z.object({
      id: z.string({
        required_error: "Please select an Event.",
      }),
      name: z.string({
        required_error: "Please select an Event.",
      }),
    }),
    subevent: z
      .object({
        id: z
          .string({
            required_error: "Please select an subEvent.",
          })
          .optional(),
        name: z
          .string({
            required_error: "Please select an subEvent.",
          })
          .optional(),
      })
      .optional(),
    location: z.object({
      id: z.string({
        required_error: "Please select an Event.",
      }),
      name: z.string({
        required_error: "Please select an Event.",
      }),
    }),
    items: baseItemSchema,
    MondayItemId: z.string().optional(),
  });

  const fullFormSchema = getFullFormSchema(checkin);

  function getFullFormSchema(checkin: boolean) {
    const itemSchema = checkin ? checkinItemSchema : baseItemSchema;
    // Use `.extend()` to add the `items` part dynamically
    return baseFormSchema.extend({
      items: z.array(itemSchema),
    });
  }

  // Handler to open or close popovers
  const handleOpenChange = (popoverId: string) => {
    setOpenPopover((current) => (current === popoverId ? null : popoverId));
  };

  //  Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(fullFormSchema),
    defaultValues: {
      event: {},
      subevent: {},
      items: [],
      quantity: {},
    },
  });

  const {
    fields: itemFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "items", // The key of the field array
  });

  const showConfirmationModal = (data: object) => {
    // Store the validated form data for later submission or use it directly in the submit function
    setFormData(data); // Assuming you have a state to temporarily hold the validated data
    console.log("showConfirmationModal", data);
    setIsModalOpen(true); // Show the modal for confirmation
  };

  // Define a submit handler.
  async function confirmAndSubmit() {
    console.log("Form data:", formData);
    const jsonValues = JSON.stringify(formData);
    if (!checkin) {
      const result = await saveFormResponse(jsonValues);
    } else {
      const result = await updateFormResponse(orderId, jsonValues);
      router.push("/");
    }

    form.reset();
    setIsModalOpen(false);

    // Show confetti
    setIsConfettiVisible(true);
    // Hide confetti after 5 seconds
    setTimeout(() => setIsConfettiVisible(false), 5000);

    //Show Toast
    toast({
      title: checkin
        ? "Sucessfully Checked In Order"
        : "Sucessfully Checked Out Order",
      // description: (
      //   // <div className="min-h-[150px]">{/* <ConfettiComponent /> */}</div>

      //   <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
      //     Sucessfully Submitted:
      //     <code className="text-white">
      //       {JSON.stringify(formData, null, 2)}
      //     </code>
      //   </pre>
      // ),
    });
  }
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log("form submitted", values);
    const jsonValues = JSON.stringify(values);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await saveFormResponse(jsonValues);

    toast({
      title: "Sucessfully Submitted:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          Sucessfully Submitted:
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
  }

  function onDelete(index: number) {
    // console.log("onDeleteIndex", index);
    // Save it!
    remove(index);
    toast({
      title: `Sucessfully Removed Item: ${index}`,
    });
  }

  useEffect(() => {
    if (data) {
      const parsedData = JSON.parse(data);
      console.log("parsedData", parsedData);

      form.reset(parsedData); // Prepopulate form if data is provided
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, form.reset]);

  useEffect(() => {
    const loadFilteredEvents = async () => {
      if (selectedEvent) {
        try {
          const result = await fetchSubEvents(selectedEvent);
          console.log("result", result);
          // const newFilteredEvents = events.filter(
          //   (event) => event.group.id === selectedEvent,
          // );
          setFilteredEvents(result);
          console.log("filteredEvents", result);
        } catch (error) {
          console.error("Failed to fetch filtered events:", error);
          // Handle error or set data to null/empty state
        }
      } else {
        setFilteredEvents([]);
      }
    };
    void loadFilteredEvents();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  useEffect(() => {
    const loadFilteredItems = () => {
      if (selectedCategory) {
        try {
          console.log("selectedCategory", selectedCategory);
          const newFilteredItems = items.filter(
            (item) => item.group.id === selectedCategory,
          );
          setFilteredItems(newFilteredItems);
          console.log("filteredItems", filteredItems);
        } catch (error) {
          console.error("Failed to fetch filtered data:", error);
          // Handle error or set data to null/empty state
        }
      } else {
        setFilteredItems([]);
      }
    };
    void loadFilteredItems();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  return (
    <div className="flex w-full flex-1 flex-col rounded-md bg-white p-3 text-black shadow-md md:w-2/5">
      {isConfettiVisible && <ConfettiComponent />}
      <div className="mb-10 flex w-full items-start justify-between">
        <span className="text-xl font-bold">
          {type === "in" ? "Check-In Form" : "Check-Out Form"}
        </span>

        <Button className="self-end" onClick={() => router.push("/order")}>
          Previous Orders
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 text-black"
        >
          <div className="space-y-2">
            <FormField
              control={form.control}
              name={`event`}
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel className="flex items-start justify-between">
                    Event
                  </FormLabel>

                  <Popover
                    open={openPopover === `${field.name}`}
                    onOpenChange={() => handleOpenChange(`${field.name}`)}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value?.name && "text-muted-foreground",
                          )}
                          aria-required
                          disabled={checkin}
                        >
                          {field.value?.name ?? "Select event"}
                          <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search events..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No events found.</CommandEmpty>
                          {eventsArray?.map((group) => (
                            <div key={group.groupId}>
                              <CommandGroup heading={group.title}>
                                {group.items.map((event) => {
                                  const formattedDate = event.column_values[0]
                                    .date
                                    ? event.column_values[0].date
                                        .split("-")
                                        .slice(1)
                                        .join("/")
                                    : "N/A";
                                  return (
                                    <CommandItem
                                      value={event.name}
                                      key={event.id}
                                      onSelect={() => {
                                        form.setValue(`event`, {
                                          name: event.name,
                                          id: event.id,
                                        });
                                        setSelectedEvent(event.id);
                                        setOpenPopover("");
                                      }}
                                    >
                                      {formattedDate && ` ${formattedDate} - `}
                                      {event.name}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          event.id === field.value?.id
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </div>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`subevent`}
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel className="flex items-start justify-between">
                    Sub-Event
                  </FormLabel>

                  <Popover
                    open={openPopover === `${field.name}`}
                    onOpenChange={() => handleOpenChange(`${field.name}`)}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value?.name && "text-muted-foreground",
                          )}
                          aria-required
                          disabled={checkin}
                        >
                          {field.value?.name ?? "Select sub-event"}
                          <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search events..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No sub-events found.</CommandEmpty>
                          <CommandGroup>
                            {filteredEvents.map((event) => {
                              return (
                                <CommandItem
                                  value={event.name}
                                  key={event.id}
                                  onSelect={() => {
                                    form.setValue(`subevent`, {
                                      name: event.name,
                                      id: event.id,
                                    });
                                    setOpenPopover("");
                                  }}
                                >
                                  {event.name}
                                  <CheckIcon
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      event.id === field.value?.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name={`location`}
            render={({ field }) => (
              <FormItem className="flex w-full flex-col">
                <FormLabel className="flex items-start justify-between">
                  Pickup/Dropoff Location
                </FormLabel>

                <Popover
                  open={openPopover === `${field.name}`}
                  onOpenChange={() => handleOpenChange(`${field.name}`)}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={checkin}
                      >
                        {field.value?.name ?? "Select pickup/dropoff location"}
                        <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandList>
                        <CommandInput
                          placeholder="Search locations..."
                          className="h-9"
                        />
                        <CommandEmpty>No location found.</CommandEmpty>
                        <ScrollArea className="h-[200px]">
                          <CommandGroup>
                            {locations?.map((location) => (
                              <CommandItem
                                value={location.name}
                                key={location.id}
                                onSelect={() => {
                                  form.setValue(`location`, {
                                    name: location.name,
                                    id: location.id,
                                  });
                                  setOpenPopover(false);
                                }}
                              >
                                {location.name}
                                <CheckIcon
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    location.id === field.value?.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </ScrollArea>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <Accordion type="multiple" className="w-full">
            <div className="space-y-3">
              {itemFields.map((field, index) => (
                <div
                  key={field.id}
                  className="z-50 flex w-full flex-col flex-wrap gap-y-3 space-y-3 rounded-md bg-slate-200 shadow-sm"
                >
                  <AccordionItem value={field.id} className="space-y-3 p-3">
                    <AccordionTrigger className="p-0">
                      {form.watch(`items.${index}.name`) ?? `Item ${index + 1}`}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.categories`}
                        render={({ field }) => (
                          <FormItem className="flex w-full flex-col">
                            <FormLabel className="flex items-start justify-between">
                              Category
                            </FormLabel>

                            <Popover
                              open={openPopover === `${field.name}`}
                              onOpenChange={() =>
                                handleOpenChange(`${field.name}`)
                              }
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground",
                                    )}
                                    disabled={checkin}
                                  >
                                    {field.value?.title ?? "Select Category"}
                                    <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Search categories..."
                                    className="h-9"
                                  />
                                  <CommandEmpty>
                                    No categories found.
                                  </CommandEmpty>
                                  <ScrollArea className="h-[200px]">
                                    <CommandList>
                                      <CommandGroup>
                                        {categories?.map((category) => (
                                          <CommandItem
                                            value={category.title}
                                            key={category.id}
                                            onSelect={() => {
                                              form.setValue(
                                                `items.${index}.categories`,
                                                {
                                                  title: category.title,
                                                  id: category.id,
                                                },
                                              );
                                              // form.setValue(
                                              //   `items.${index}.name`,
                                              //   undefined,
                                              // );
                                              setSelectedCategory(category.id);
                                              setOpenPopover("");
                                            }}
                                          >
                                            {category.title}
                                            <CheckIcon
                                              className={cn(
                                                "ml-auto h-4 w-4",
                                                category.id === field.value?.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </ScrollArea>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}`}
                        render={({ field }) => {
                          console.log("item_value", field.value);
                          return (
                            <FormItem className="flex w-[100%] flex-col">
                              <FormLabel>Product</FormLabel>

                              <Popover
                                open={openPopover === `${field.name}`}
                                onOpenChange={() =>
                                  handleOpenChange(`${field.name}`)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground",
                                      )}
                                      disabled={
                                        !form.watch(
                                          `items.${index}.categories`,
                                        ) || checkin
                                      }
                                    >
                                      {field.value.name
                                        ? field.value.name
                                        : !form.watch(
                                              `items.${index}.categories`,
                                            )
                                          ? "Select a category first"
                                          : "Select Product"}

                                      <TbCaretUpDownFilled className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                  <Command
                                  // filter={(value, search) => {
                                  //   if (value.includes(search)) return 1;
                                  //   return 0;
                                  // }}
                                  >
                                    <CommandInput
                                      placeholder="Search products..."
                                      className="h-9"
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        No products found.
                                      </CommandEmpty>
                                      <ScrollArea className="h-[300px]">
                                        <CommandGroup>
                                          {filteredItems.map((item) => (
                                            <CommandItem
                                              value={item.name}
                                              // value={item.name.replace(
                                              //   /"/g,
                                              //   '\\"',
                                              // )}
                                              key={item.id}
                                              className="text-base font-medium"
                                              onSelect={() => {
                                                form.setValue(
                                                  `items.${index}.name`,
                                                  item.name,
                                                );
                                                form.setValue(
                                                  `items.${index}.id`,
                                                  item.id,
                                                );
                                                setOpenPopover(false);
                                              }}
                                            >
                                              <div className="flex items-center gap-x-5">
                                                <Image
                                                  className="min-w-[120px]"
                                                  src={
                                                    item.assets[0]
                                                      ?.public_url ??
                                                    "https://static.thenounproject.com/png/261694-200.png"
                                                  }
                                                  alt="product image"
                                                  width={100}
                                                  height={100}
                                                />
                                                {item.name}
                                              </div>

                                              <CheckIcon
                                                className={cn(
                                                  "ml-auto h-4 w-4",
                                                  item.id === field.value?.id
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                                )}
                                              />
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </ScrollArea>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.desc`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                disabled={
                                  !form.watch(`items.${index}.categories`) ||
                                  checkin
                                }
                                placeholder="Additional notes here..."
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-start justify-between space-x-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity.checkout`}
                          defaultValue={0}
                          render={({ field }) => (
                            <FormItem className="w-1/2 space-y-1">
                              <FormLabel>Checkout Quantity</FormLabel>
                              <FormDescription>
                                Total items checked out.
                              </FormDescription>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder={1}
                                  min={1}
                                  disabled={
                                    !form.watch(`items.${index}.categories`) ||
                                    checkin
                                  }
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {checkin && (
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity.checkin`}
                            defaultValue={0}
                            render={({ field }) => {
                              const checkoutQuantity = form.watch(
                                `items.${index}.quantity.checkout`,
                              );
                              return (
                                <FormItem className="w-1/2 space-y-1">
                                  <FormLabel>Checkin Quantity</FormLabel>
                                  <FormDescription>
                                    Total items checked in.
                                  </FormDescription>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder={0}
                                      min={0}
                                      max={checkoutQuantity}
                                      disabled={
                                        !form.watch(`items.${index}.categories`)
                                      }
                                    />
                                  </FormControl>

                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger
                            disabled={checkin}
                            className="self-end rounded-md bg-red-700 p-2 text-white shadow-md disabled:bg-slate-400"
                          >
                            <TrashIcon className="h-6 w-6" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the item from the order.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant={"destructive"}
                                  className="w-full"
                                  type="submit"
                                  onClick={() => onDelete(index)}
                                >
                                  Delete
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              ))}
            </div>
          </Accordion>

          {!checkin && (
            <Button
              className="w-full self-end"
              type="button"
              onClick={() =>
                append({
                  quantity: {
                    checkout: 1,
                  },
                })
              }
            >
              Add Item
            </Button>
          )}

          <Button
            type="submit"
            onClick={form.handleSubmit(showConfirmationModal)}
          >
            {type === "in" ? "Check-In" : "Check-Out"}
          </Button>
          <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will submit the order. Please double check the order is
                  correct before continuing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAndSubmit}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </Form>
    </div>
  );
}
```

## File: src/app/_components/DemoComponent.tsx
```typescript
import React from "react";

type Props = {
  demoProp: string;
};

export default function DemoComponent({ demoProp }: Props) {
  return (
    <div>
      <p>DemoComponent</p>
      <p>DemoProp: {demoProp}</p>
    </div>
  );
}
```

## File: src/app/_components/Header.tsx
```typescript
import AuthButton from "./AuthButton";
import Logo from "./Logo";
import React from "react";
import TopNavbar from "./TopNavbar";

function Header() {
  return (
    <header className="fixed z-10 flex h-20 w-full items-center justify-center bg-white py-3 shadow-md">
      <div className="container flex w-full items-center justify-between">
        <div>
          <Logo />
        </div>
        <div className="flex items-center space-x-10">
          <TopNavbar />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

export default Header;
```

## File: src/app/_components/LoginForm.tsx
```typescript
"use client";

import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  sendResetPassword,
  signInWithEmailAndPassword,
} from "../(auth)/actions";
import { useRouter, useSearchParams } from "next/navigation";

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the ResetPassFormSchema
const ResetPassFormSchema = z.object({
  email: z.string().email(),
});

// Extend ResetPassFormSchema to create LoginFormSchema
const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, {
    message: "Password is required.",
  }),
});

export default function LoginForm() {
  const router = useRouter();
  const [isResetPass, setIsResetPass] = useState(false);
  const loginForm = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const resetPassForm = useForm<z.infer<typeof ResetPassFormSchema>>({
    resolver: zodResolver(ResetPassFormSchema),
    defaultValues: { email: "" },
  });

  async function onSubmitLogin(data: z.infer<typeof LoginFormSchema>) {
    console.log("form submitted");
    const result = await signInWithEmailAndPassword(data);
    console.log("result", result);
    const { error } = result;

    if (error?.message) {
      toast({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{error.message}</code>
          </pre>
        ),
      });
    } else {
      toast({
        title: "Sucessfully Logged In!",
        // description: (
        //   <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
        //     Sucessfully Registered:
        //     <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        //   </pre>
        // ),
      });
      router.push("/");
    }
  }

  async function onSubmitResetPass(data: z.infer<typeof ResetPassFormSchema>) {
    console.log("form submitted");
    const result = await sendResetPassword(data.email);
    console.log("result", result);
    const { error } = result;

    if (error?.message) {
      toast({
        title: "There was an error sending the reset email!",
        description: "Please try again.",
      });
    } else {
      toast({
        title: "Sucessfully reset password!",
        description: "Please check your email for further instructions.",
      });
    }
  }

  return (
    <div className="flex flex-col items-center">
      {!isResetPass ? (
        <Form {...loginForm}>
          <form
            key={"login"}
            onSubmit={loginForm.handleSubmit(onSubmitLogin)}
            className="w-96 space-y-6"
          >
            <Card className="mx-auto  max-w-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                  Enter your email below to login to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              className="text-black"
                              placeholder="example@gmail.com"
                              {...field}
                              type="email"
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel>Password</FormLabel>

                            <Button
                              variant={"link"}
                              onClick={() => setIsResetPass(true)}
                              className="ml-auto inline-block p-0 text-sm underline"
                            >
                              Forgot your password?
                            </Button>
                          </div>
                          <FormControl>
                            <Input
                              className="text-black"
                              placeholder="password"
                              {...field}
                              type="password"
                              onChange={field.onChange}
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="underline">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      ) : (
        <Form {...resetPassForm}>
          <form
            key={"resetpass"}
            onSubmit={resetPassForm.handleSubmit(onSubmitResetPass)}
            className="w-80 space-y-6"
          >
            <Card className="mx-auto max-w-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                  Enter your email below to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <FormField
                      control={resetPassForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              className="text-black"
                              placeholder="example@gmail.com"
                              {...field}
                              type="email"
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Reset Password
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="underline">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
}
```

## File: src/app/_components/Logo.tsx
```typescript
"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

function Logo() {
  return (
    <Link href="/">
      <Image
        src="https://fdotwww.blob.core.windows.net/sitefinity/images/default-source/content1/info/logo/png/fdot_logo_color.png?sfvrsn=293c15a8_2"
        alt="logo"
        width={0}
        height={0}
        sizes="100vw"
        className=" w-[100px]"
      />
    </Link>
  );
}

export default Logo;
```

## File: src/app/_components/Post.tsx
```typescript
import React from "react";

interface BaseProps {
  id?: number;
  name?: string | null;
}

function SinglePostComponent<T extends BaseProps>(props?: T) {
  return (
    <div className="rounded-md bg-white bg-opacity-10 p-3 shadow-md">
      <p>{props?.name}</p>
      <p>{props?.id}</p>
    </div>
  );
}

export default SinglePostComponent;
```

## File: src/app/_components/RegisterForm.tsx
```typescript
"use client";

import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { api } from "~/trpc/react";
import { cn } from "@/lib/utils";
import { signUpWithEmailAndPassword } from "../(auth)/actions";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, {
    message: "Password is required.",
  }),
  firstName: z.string().min(1, {
    message: "First Name is required.",
  }),
  lastName: z.string().min(1, {
    message: "Last Name is required.",
  }),
  tel: z.string().min(1, {
    message: "Tel is required.",
  }),
});

export default function RegisterForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // defaultValues: {
    //   email: "dev1@gmail.com",
    //   password: "dev1234$",
    //   firstName: "dev",
    //   lastName: "dev",
    //   tel: "999-999-9999",
    // },
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      tel: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log("form submitted");
    const { error } = await signUpWithEmailAndPassword(data);

    if (error?.message) {
      toast({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{error.message}</code>
          </pre>
        ),
      });
    } else {
      toast({
        title: "Sucessfully Logged In:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            Sucessfully Registered:
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      });
      router.push("/");
    }
  }

  return (
    <div className="flex flex-col flex-wrap items-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-96 flex-row flex-wrap gap-x-8 space-y-5"
        >
          <Card className="mx-auto max-w-sm">
            <CardHeader>
              <CardTitle className="text-xl">Sign Up</CardTitle>
              <CardDescription>
                Enter your information to create an account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              className="text-black"
                              placeholder="John"
                              {...field}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              className="text-black"
                              placeholder="Smith"
                              {...field}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            className="text-black"
                            placeholder="example@gmail.com"
                            {...field}
                            type="email"
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            className="text-black"
                            placeholder="password"
                            {...field}
                            type="password"
                            onChange={field.onChange}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="tel"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            className="text-black"
                            placeholder="999-999-9999"
                            {...field}
                            type="tel"
                            onChange={field.onChange}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create an account
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
```

## File: src/app/_components/Table.tsx
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

"use client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { type orderType } from "../order/page";
import { Button } from "./ui/button";
import {
  Calendar,
  CheckSquare2Icon,
  Clipboard,
  MoreHorizontal,
  Tags,
  Trash,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { InventoryFormData } from "./DefaultForm";
import React, { use, useState } from "react";
import { api } from "~/trpc/react";

interface DefaultTableProps {
  data: orderType;
  handleDelete: (id: number) => void;
}

export function DefaultTable({ data, handleDelete }: DefaultTableProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const changeDocumentOwner = api.formResponse.changeDocumentOwner.useMutation({
    onSuccess: () => {
      setFormData(null);
      void utils.formResponse.getUsersOrders.invalidate();
    },
  });

  const [formData, setFormData] = useState<{
    id: number;
    userId: string;
    firstName: string | null;
    lastName: string | null;
  } | null>(null);
  const [userId, setUserId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = api.user.getAll.useQuery(undefined, {
    enabled: false, // Disable automatic query on mount
  });

  if (users) console.log("users", data);

  // Handler to open or close popovers
  const handleOpenChange = (popoverId: string) => {
    setIsDropdownOpen((current) => (current === popoverId ? null : popoverId));
  };

  // Define a submit handler.
  async function confirmAndSubmit() {
    console.log("confirmAndSubmit", formData);
    const result = await changeDocumentOwner.mutateAsync(formData!);
    console.log("confirmAndSubmitresult", result);
  }

  const fetchVolunteers = () => {
    void refetch(); // Manually trigger the query when the dropdown is clicked
  };

  return (
    <div className="flex w-full flex-1 flex-col gap-y-3 rounded-md bg-white p-3 text-black">
      <div className="flex w-full items-center justify-between">
        Past Check-out Orders
        <Button
          className="self-end"
          onClick={() => router.push("/order/checkout")}
        >
          New Check-out Order
        </Button>
      </div>
      <Table className="md:whitespace-nowrap">
        <TableCaption>A list of your past orders.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="">Order #</TableHead>
            <TableHead className="">Volunteer</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="text-center">Total Items</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item, index) => {
            const parsedData = JSON.parse(item.data!) as InventoryFormData;
            const totalCheckoutQuantity = parsedData.items.reduce(
              (total: any, currentItem: any) =>
                total + currentItem.quantity.checkout,
              0,
            );

            return (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell className="font-medium">
                  {item.users.firstName} {item.users.lastName}
                </TableCell>
                <TableCell className="font-medium">
                  {parsedData.event.name ?? "undefined"}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {totalCheckoutQuantity}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <DropdownMenu
                    open={isDropdownOpen === `${item.id}`}
                    onOpenChange={() => handleOpenChange(`${item.id}`)}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(
                              item.id as unknown as string,
                            )
                          }
                        >
                          <Clipboard className="mr-2 h-4 w-4" />
                          Copy order ID
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger
                            onMouseEnter={fetchVolunteers}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Assign to...
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="p-0">
                            <Command
                            // filter={(value, search) => {
                            //   if (value.includes(search)) return 1;
                            //   return 0;
                            // }}
                            >
                              <CommandInput
                                placeholder="Volunteer List..."
                                autoFocus={true}
                              />
                              <CommandList>
                                {isLoading && (
                                  <CommandEmpty>Loading...</CommandEmpty>
                                )}
                                {error && (
                                  <CommandEmpty>
                                    Error fetching users
                                  </CommandEmpty>
                                )}
                                {!isLoading && !error && users && (
                                  <CommandGroup>
                                    {users.map((user) => (
                                      <CommandItem
                                        key={user.id}
                                        value={`${user.firstName} ${user.lastName}`}
                                        onSelect={() => {
                                          setUserId(user.id);
                                          setFormData({
                                            id: item.id,
                                            userId: user.id,
                                            firstName: user.firstName,
                                            lastName: user.lastName,
                                          });
                                          setIsDropdownOpen(null);
                                          setIsModalOpen(true);
                                        }}
                                      >
                                        {user.firstName} {user.lastName}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => router.push(`/order/${item.id}`)}
                        >
                          <CheckSquare2Icon className="mr-2 h-4 w-4" />
                          Check In Order
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reassign this order to {formData?.firstName}{" "}
              {formData?.lastName}. Are you sure you wish to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndSubmit}>
              Reassign Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

## File: src/app/_components/TopNavbar.tsx
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import * as React from "react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "./ui/button";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { cn } from "~/lib/utils";

export default function NavigationMenuDemo() {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  return (
    <>
      <div className="hidden md:flex">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            {/* <NavigationMenuItem>
              <Link href="/demo" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Demo Page
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/supabase/posts" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Supabase Posts
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/demo/supabaseclient" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Supabase Data - Client
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Monday</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  <ListItem
                    title="Workspaces"
                    href="/monday/workspaces"
                  ></ListItem>
                  <ListItem title="Form" href="/monday/form"></ListItem>
                  <ListItem title="Orders" href="/monday/order"></ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem className="!ml-[3em]">
              <Link href="/demo/supabaseclient" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Logout
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem> */}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side={"left"}>
            <SheetHeader></SheetHeader>
            <NavigationMenu
              orientation="vertical"
              className="mt-10 flex flex-col"
            >
              <NavigationMenuList className="flex-col items-start space-x-0">
                <NavigationMenuItem>
                  <Link href="/demo" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      onClick={() => setSheetOpen(false)}
                    >
                      Demo Page
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/supabase/posts" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      onClick={() => setSheetOpen(false)}
                    >
                      Supabase Posts
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/demo/supabaseclient" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      onClick={() => setSheetOpen(false)}
                    >
                      Supabase Data - Client
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Monday</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                      <ListItem
                        title="Workspaces"
                        href="/monday/workspaces"
                        onClick={() => setSheetOpen(false)}
                      ></ListItem>
                      <ListItem
                        title="Form"
                        href="/monday/form"
                        onClick={() => setSheetOpen(false)}
                      ></ListItem>
                      <ListItem
                        title="Orders"
                        href="/monday/order"
                        onClick={() => setSheetOpen(false)}
                      ></ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
```

## File: src/app/(auth)/login/page.tsx
```typescript
import LoginForm from "~/app/_components/LoginForm";
import React from "react";

function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <LoginForm />
    </div>
  );
}

export default LoginPage;
```

## File: src/app/(auth)/register/page.tsx
```typescript
import Logo from "~/app/_components/Logo";
import React from "react";
import RegisterForm from "~/app/_components/RegisterForm";

function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <RegisterForm />
    </div>
  );
}

export default RegisterPage;
```

## File: src/app/(auth)/resetpass/page.tsx
```typescript
"use client";

import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter, useSearchParams } from "next/navigation";

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { resetPassword } from "../actions";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z
  .object({
    password: z.string().min(6, {
      message: "Password is required.",
    }),
    confirmPassword: z.string().min(6, {
      message: "Password is required.",
    }),
    code: z.string(),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["confirmPassword"],
      });
    }
  });

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      code: code ?? "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log("form submitted", data);
    const result = await resetPassword(data);
    console.log("result", result);
    const { error } = result;

    if (error) {
      toast({
        title: "There was an error resetting your password!",
        description: "Please try again.",
      });
    } else {
      toast({
        title: "Password sucessfully reset!",
        description: "Redirecting you to the dashboard...",
      });
      router.push("/");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-96 space-y-6">
          <Card className="mx-auto max-w-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>
                Enter a new password for your account below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            className="text-black"
                            {...field}
                            type="password"
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            className="text-black"
                            {...field}
                            type="password"
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input
                          className="space-y-0 text-black"
                          {...field}
                          type="hidden"
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
```

## File: src/app/(auth)/actions.ts
```typescript
"use server";

import { createMondayUserItem } from "../monday/actions";
import supabaseServer from "~/lib/supabase/server";

export async function signInWithEmailAndPassword(data: {
  email: string;
  password: string;
}) {
  const supabase = await supabaseServer();
  const result = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  return result;
}

export async function signUpWithEmailAndPassword(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tel: string;
}) {
  const supabase = await supabaseServer();
  const result = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        tel: data.tel,
      },
    },
  });

  if (!result.error) {
    const result2 = await createMondayUserItem(result);
  }

  return result;
}

export async function signOut() {
  const supabase = await supabaseServer();
  const result = await supabase.auth.signOut();
  return result;
}

export async function readUserSession() {
  const supabase = await supabaseServer();
  return supabase.auth.getSession();
}

export async function sendResetPassword(email: string) {
  const supabase = await supabaseServer();
  const redirectTo =
    process.env.NODE_ENV === "production"
      ? "https://fdot-inventory.vercel.app/resetpass"
      : "http://localhost:3000/resetpass";
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}

export async function resetPassword(data: { password: string; code: string }) {
  console.log("data", data);
  const supabase = await supabaseServer();
  try {
    const { data: session, error } = await supabase.auth.exchangeCodeForSession(
      data.code,
    );

    return supabase.auth.updateUser({
      password: data.password,
    });
  } catch (error) {
    return { error };
  }
}
```

## File: src/app/api/auth/[...nextauth]/route.ts
```typescript
import NextAuth from "next-auth";

import { authOptions } from "~/server/auth";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## File: src/app/api/trpc/[trpc]/route.ts
```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
```

## File: src/app/demo/supabaseclient/page.tsx
```typescript
"use client";

import { type User } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { supabaseBrowser } from "~/lib/supabase/browser";

function SupabaseClientPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getClientSession() {
      setLoading(true);
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("result", user);
      setUser(user);
      setLoading(false);
    }
    void getClientSession();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (user)
    return (
      <div>
        <p>User Found</p>
        <p>{user.email}</p>
      </div>
    );
}

export default SupabaseClientPage;
```

## File: src/app/demo/page.tsx
```typescript
import DemoComponent from "../_components/DemoComponent";
import React from "react";

function DemoPage() {
  return (
    <div>
      <p>DemoPage</p>
      <DemoComponent demoProp="demoProp" />
    </div>
  );
}

export default DemoPage;
```

## File: src/app/monday/categories/page.tsx
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { ComboboxDemo } from "~/app/_components/ComboBox";
import React from "react";
import { fetchCategories } from "~/app/order/actions";

async function page() {
  const fetchedCategories = await fetchCategories();
  console.log("fetchedCategories", fetchedCategories?.data.boards[0].groups);
  const prettyPrintedJSON = JSON.stringify(
    fetchedCategories?.data.boards[0].groups,
    null,
    2,
  );
  return <ComboboxDemo />;
}

export default page;
```

## File: src/app/monday/form/page.tsx
```typescript
import { DefaultForm } from "~/app/_components/DefaultForm";
import React from "react";

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {};

function MondayForm({}: Props) {
  return (
    <div className="container flex w-96 flex-col rounded-md bg-slate-200 p-5 text-black shadow-md">
      MondayForm
      <DefaultForm type="out" />
    </div>
  );
}

export default MondayForm;
```

## File: src/app/monday/workspaces/actions.ts
```typescript
"use server";
import { type APIOptions } from "monday-sdk-js/types/client-api.interface";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();
monday.setApiVersion("2023-10");

export interface Workspace {
  name?: string;
  id?: number;
  description?: string;
}

interface MondayWorkspacesApiResponse {
  data: {
    workspaces: Workspace[];
    account_id: number;
  };
}

const options: APIOptions = {
  token: process.env.MONDAY_TOKEN,
};

export async function fetchAllWorkspaces() {
  "use server";
  try {
    const query = "{ workspaces (limit:100) {name id description} }";
    const result = (await monday.api(
      query,
      options,
    )) as MondayWorkspacesApiResponse;
    console.log("result", result);
    return result;
  } catch (error) {
    console.log("error", error);
  }
}
```

## File: src/app/monday/workspaces/page.tsx
```typescript
import React from "react";
import SinglePostComponent from "../../_components/Post";
import { fetchAllWorkspaces } from "./actions";

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {};

async function Page({}: Props) {
  const fetchedWorkspaces = await fetchAllWorkspaces();
  const workspaces = fetchedWorkspaces?.data.workspaces;

  return (
    <div className="space-y-3">
      {workspaces?.map((workspace, index) => (
        <SinglePostComponent key={index} {...workspace} />
      ))}
    </div>
  );
}
export default Page;
```

## File: src/app/monday/actions.ts
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { api } from "~/trpc/server";
import supabaseServer from "~/lib/supabase/server";
import { type InventoryFormData } from "../_components/DefaultForm";
import { type inferProcedureOutput } from "@trpc/server";
import { type AppRouter } from "~/server/api/root";

import mondaySdk from "monday-sdk-js";
import { type APIOptions } from "monday-sdk-js/types/client-api.interface";
import { JsonObject } from "next-auth/adapters";
import { AuthResponse } from "@supabase/supabase-js";

const monday = mondaySdk();
monday.setApiVersion("2023-10");

const options: APIOptions = {
  token: process.env.MONDAY_TOKEN,
};

export async function saveFormResponse(values: string) {
  try {
    // Step 1: Save the form response to the database
    const dbData = await saveToDatabase(values);
    // console.log("saveFormResponse_server", dbData);
    if (!dbData) return;

    // Step 2: Create Monday Item and SubItems
    const createMondayItemResult = await createMondayItem(dbData);
    if (!createMondayItemResult) return;
    const MondayItemId = createMondayItemResult.createMondayItemId;
    const updatedFormData = JSON.stringify(
      createMondayItemResult.updatedFormData,
    );
    console.log("updatedFormData", updatedFormData);

    // Step 3: Update Database again

    const updateWithMondayData =
      await api.formResponse.updateWithMondayData.mutate({
        id: dbData.id,
        mondayItemId: MondayItemId,
        data: updatedFormData,
      });

    console.log("updateWithMondayData", updateWithMondayData);
  } catch (error) {
    console.log("Error saving to database", error);
    // Handle this error specifically, maybe return or throw a custom error
    throw new Error("Database save failed");
  }
}

export async function updateFormResponse(orderId: number, values: string) {
  console.log("updateFormResponse", values);
  const data = JSON.parse(values);
  const mondayItemId = data.MondayItemId;
  try {
    // Step 1: Change item status to checkin

    const result1 = await checkinOrder(mondayItemId);

    // Step 2: Change checkin quantity on subitems

    const result2 = await changeSubitemQuantity(data);

    // Step 3: update quantity field on Inventory board

    // Step 4: update database
    const updateWithMondayData =
      await api.formResponse.updateWithMondayData.mutate({
        id: orderId,
        status: "checkin",
      });

    // const result3 = await updateInventoryItemQuantity();
  } catch (error) {}
}

export async function checkinOrder(id: string) {
  console.log("checkinOrder_init", id);
  try {
    const mutation = `mutation { change_simple_column_value (board_id: 6309440166, item_id: \"${id}\", column_id:\"status\", value: \"1\") { id }}`;
    const updateMondayOrder = await monday.api(mutation, options);
    console.log("updateMondayOrder", updateMondayOrder);
    return updateMondayOrder;
  } catch (error) {}
}

export async function changeSubitemQuantity(data: any) {
  console.log("changeSubitemQuantity_init", data);
  const updatedItems = await Promise.all(
    data.items.map(async (item: any) => {
      const itemId = await updateSubitem(item); // Your function to create an item on Monday
      return { ...item }; // Append the itemId to the item
    }),
  );
}

export async function updateSubitem(data: any) {
  try {
    const { itemId, quantity } = data;
    console.log("updateSubitem_id", itemId);
    const mutation1 = `mutation { change_simple_column_value (board_id: 6314721404, item_id: \"${itemId}\", column_id:\"numbers2\", value: \"${quantity.checkin}\") { id }}`;
    const result1 = await monday.api(mutation1, options);

    const query1 = `query { items (ids: \"${itemId}\") { column_values (ids: [\"text\"]) { text }} }`;
    const result2 = await monday.api(query1, options);
    const sku = result2.data.items[0].column_values[0].text;

    const query2 = `query { items (ids: \"${sku}\") { column_values (ids: [\"numbers5\"]) { text }} }`;
    const query3 = `query { items (ids: \"${sku}\") { column_values (ids: [\"numbers\"]) { text }} }`;
    const query4 = `query { items (ids: \"${sku}\") { column_values (ids: [\"numbers6\"]) { text }} }`;

    const result5 = await monday.api(query4, options);
    const alterTriggerQuantity =
      result5.data.items[0].column_values[0].text || 0;

    const result3 = await monday.api(query2, options);
    const currentStock = result3.data.items[0].column_values[0].text;
    const result4 = await monday.api(query3, options);
    const currentCheckedOut = result4.data.items[0].column_values[0].text;

    const newQuantity = parseInt(currentStock, 10) + quantity.checkin;
    const newCheckOut = parseInt(currentCheckedOut, 10) - quantity.checkin;

    const newStockBeforeRestock =
      newQuantity - parseInt(alterTriggerQuantity, 10);
    console.log("newStockBeforeRestock", newStockBeforeRestock);
    const mutation2 = `mutation { change_multiple_column_values (board_id: 5798486455, item_id: \"${sku}\", column_values: \"{ \\\"numbers5\\\": \\\"${newQuantity}\\\", \\\"numbers\\\": \\\"${newCheckOut}\\\", \\\"numbers67\\\": \\\"${newStockBeforeRestock}\\\"}\") { id }}`;
    const result6 = await monday.api(mutation2, options);
    console.log("result6", result6);
    return result1;
  } catch (error) {
    console.log("error", error);
  }
}

export async function updateInventoryColumn(data: any) {
  try {
    const { itemId, quantity } = data;
    console.log("updateSubitem_id", itemId);
    const mutation = `mutation { change_simple_column_value (board_id: 6314721404, item_id: \"${itemId}\", column_id:\"numbers2\", value: \"${quantity.checkin}\") { id }}`;
    const result = await monday.api(mutation, options);
    console.log("updateSubitem_end", result);
    return result;
  } catch (error) {
    console.log("error", error);
  }
}

export async function readUserSession() {
  const supabase = await supabaseServer();
  return supabase.auth.getSession();
}

export async function saveToDatabase(values: string) {
  let session;
  try {
    const response = await readUserSession();
    session = response.data.session;
    // Check if session or session.user.id is not available
    if (!session?.user?.id) {
      throw new Error("No valid session or user ID found");
    }
  } catch (error) {
    console.error("Error reading user session:", error);
    throw new Error("Failed to retrieve user session");
  }

  try {
    const result = await api.formResponse.create.mutate({
      data: values,
      createdById: session.user.id,
    });
    return result;
  } catch (error) {
    console.error("Error saving to database:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

export async function createMondayItem(
  dbData: inferProcedureOutput<AppRouter["formResponse"]["getAll"]>[number],
) {
  const user = await api.user.getById.query({ id: dbData.createdById });

  const formData: InventoryFormData = JSON.parse(dbData.data);
  try {
    const mutation = `mutation { create_item (board_id: 6309440166, item_name: \"Order# ${dbData.id}\", column_values: \"{ \\\"email\\\": \\\"${user?.email} ${user?.email}\\\", \\\"text0\\\": \\\"${user?.tel}\\\", \\\"text3\\\": \\\"${formData.location.name}\\\",\\\"text4\\\": \\\"${formData.event.name}\\\",\\\"text__1\\\": \\\"${formData.subevent.name}\\\", \\\"text\\\": \\\"${user?.firstName}\\\", \\\"status\\\": \\\"2\\\" }\") { id board { id } } }`;
    console.log(mutation);
    const createMondayItemResult = await monday.api(mutation, options);
    const createMondayItemId = createMondayItemResult.data.create_item.id;

    // Insert the createMondayItemId into formData
    formData.MondayItemId = createMondayItemId;

    const updatedItems = await Promise.all(
      formData.items.map(async (item: any) => {
        const itemId = await createSubitem(
          item,
          createMondayItemResult.data.create_item.id,
        ); // Your function to create an item on Monday
        return { ...item, itemId }; // Append the itemId to the item
      }),
    );

    // Update the formData with the updated items
    const updatedFormData = { ...formData, items: updatedItems };

    return { createMondayItemId, updatedFormData };

    // // Now, update the JSONB column in your database with this updatedFormData
    // await updateFormDataInDatabase(dbData.id, updatedFormData); // Implement this function based on your DB solution

    // const item_id = result1.data.create_item.id;
    // console.log("createItem_itemID", item_id);
    // const mutation2 = `mutation { change_multiple_column_values (board_id: 5980720965, item_id: \"${item_id}\", column_values: \"{ \\\"name\\\": \\\"${item_name} : ${item_id}\\\" }\") { id board { id } } }`;
    // const result2 = await monday.api(mutation2, options);
    // console.log("createItem_result2", result2);
    // return result2;
  } catch (error) {
    console.log("error", error);
  }
}

export async function createMondayUserItem({ data }: AuthResponse) {
  const mutation = `mutation { create_item (board_id: 6354338796, item_name: \"${data.user?.user_metadata.first_name} ${data.user?.user_metadata.last_name}\", column_values: \"{ \\\"text__1\\\": \\\"${data.user?.email}\\\" }\") { id board { id } } }`;
  const result = await monday.api(mutation, options);
  console.log("createMondayUserItem", result);
}

// export async function updateFormDataInDatabase(
//   databaseId: number,
//   updatedFormData: JsonObject,
// ) {}

export async function createSubitem(
  data: InventoryFormData["items"][number],
  newItemId: string,
) {
  try {
    const { name, id, quantity } = data;
    console.log("item name", name);
    const mutation = `mutation { create_subitem (parent_item_id: ${newItemId}, item_name: ${JSON.stringify(name)}, column_values: \"{ \\\"numbers\\\": \\\"${quantity.checkout}\\\",\\\"text\\\": \\\"${id}\\\" }\") { id board { id } } }`;
    const result = await monday.api(mutation, options);

    const query2 = `query { items (ids: \"${id}\") { column_values (ids: [\"numbers5\"]) { text }} }`;
    const query3 = `query { items (ids: \"${id}\") { column_values (ids: [\"numbers\"]) { text }} }`;
    const query4 = `query { items (ids: \"${id}\") { column_values (ids: [\"numbers6\"]) { text }} }`;

    const result3 = await monday.api(query2, options);
    const currentStock = result3.data.items[0].column_values[0].text;
    console.log("currentStock", currentStock);
    const result4 = await monday.api(query3, options);
    const currentCheckedOut = result4.data.items[0].column_values[0].text || 0;
    const result5 = await monday.api(query4, options);
    const alterTriggerQuantity =
      result5.data.items[0].column_values[0].text || 0;

    console.log("currentCheckedOut", currentCheckedOut);

    const alterTriggerQuantityNum = parseInt(alterTriggerQuantity, 10);

    const newQuantity = parseInt(currentStock, 10) - quantity.checkout;
    console.log("newQuantity", newQuantity);
    console.log("alterTriggerQuantityNum", alterTriggerQuantityNum);
    const newCheckOut = parseInt(currentCheckedOut, 10) + quantity.checkout;
    const newStockBeforeRestock =
      newQuantity - parseInt(alterTriggerQuantity, 10);
    console.log("newStockBeforeRestock", newStockBeforeRestock);

    const mutation2 = `mutation { change_multiple_column_values (board_id: 5798486455, item_id: \"${id}\", column_values: \"{ \\\"numbers5\\\": \\\"${newQuantity}\\\", \\\"numbers\\\": \\\"${newCheckOut}\\\", \\\"numbers67\\\": \\\"${newStockBeforeRestock}\\\"}\") { id }}`;
    const result6 = await monday.api(mutation2, options);
    console.log("result6", result6);

    return result.data.create_subitem.id;
  } catch (error) {
    console.log("error", error);
  }
}
```

## File: src/app/order/[slug]/actions.ts
```typescript
"use server";

import { api } from "~/trpc/server";

export async function getFormData(id: number) {
  try {
    const result = await api.formResponse.getFormResponseById.query({
      id,
    });

    return result;
  } catch (error) {
    console.log("error", error);
  }
}
```

## File: src/app/order/[slug]/page.tsx
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { DefaultForm } from "~/app/_components/DefaultForm";
import { getFormData } from "./actions";

export default async function Page({ params }: { params: { slug: string } }) {
  const id = parseInt(params.slug, 10);
  const result = await getFormData(id);
  console.log("data", result);

  if (!result?.data) return <div>This form does not exist</div>;

  return (
    <div className="container flex flex-col items-center py-32 text-black">
      <DefaultForm data={result?.data} type="in" orderId={id} />
    </div>
  );
}
```

## File: src/app/order/checkin/page.tsx
```typescript
import React from "react";

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {};

function CheckinPage({}: Props) {
  return <div>CheckinPage</div>;
}

export default CheckinPage;
```

## File: src/app/order/checkout/actions.ts
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { type APIOptions } from "monday-sdk-js/types/client-api.interface";
import mondaySdk from "monday-sdk-js";
import { InventoryFormData } from "~/app/_components/DefaultForm";
import supabaseServer from "~/lib/supabase/server";
import { gql } from "@apollo/client";
import createApolloClient from "~/lib/apollo-client";

const client = createApolloClient();

const monday = mondaySdk();
monday.setApiVersion("2023-10");

const options: APIOptions = {
  token: process.env.MONDAY_TOKEN,
};

export async function readUserSession() {
  const supabase = await supabaseServer();
  return supabase.auth.getSession();
}

export async function fetchCategories2() {
  const result = await client.query({
    query: gql`
      query {
        boards(ids: 5798486455) {
          groups {
            title
            id
          }
        }
      }
    `,
  });
  const categories = result.data.boards[0];
  console.log("fetchCategories2", categories);
}
```

## File: src/app/order/checkout/page.tsx
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  fetchCategories,
  fetchEvents,
  fetchItems,
  fetchLocations,
} from "../actions";

import { DefaultForm } from "~/app/_components/DefaultForm";
import React from "react";

export const revalidate = 10;

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {};

async function CheckoutPage({}: Props) {
  const fetchedEvents = await fetchEvents();
  const fetchedLocations = await fetchLocations();
  const fetchedItems = await fetchItems();
  // console.log("fetchedItems", fetchedItems?.data.boards);
  const items = fetchedItems?.data?.boards[0].items_page.items;
  // console.log("items", items);
  const locations = fetchedLocations?.data.boards[0].items_page.items;
  const fetchedCategories = await fetchCategories();
  const categories = fetchedCategories?.data.boards[0].groups;

  // console.log("categories", categories);
  return (
    <div className="container flex flex-col items-center justify-center rounded-md p-3 text-black">
      <DefaultForm
        type="out"
        categories={categories}
        events={fetchedEvents}
        locations={locations}
        items={items}
      />
    </div>
  );
}

export default CheckoutPage;
```

## File: src/app/order/actions.ts
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { api } from "~/trpc/server";
import { redirect } from "next/navigation";

import { type APIOptions } from "monday-sdk-js/types/client-api.interface";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();
monday.setApiVersion("2023-10");

const options: APIOptions = {
  token: process.env.MONDAY_TOKEN,
};

export async function goToOrder(id: string) {
  redirect(`/order/${id}`);
}

export async function getOrders() {
  const result = await api.formResponse.getAll.query();
  return result;
}

export async function getUserOrders() {
  const result = await api.formResponse.getAll.query();
  return result;
}

export async function deleteOrder(id: number) {
  const result = await api.formResponse.deleteResponse.mutate({ id });
  return result;
}

export async function fetchItems() {
  try {
    const query1 =
      '{ boards (ids: 5798486455) { items_page (limit: 500 , query_params: {order_by:[{column_id:"name"}]}) { items { id name group { title id } assets { id public_url }} } } }';
    const query2 =
      '{ boards (ids: 5798486455) { items_page (limit: 500, query_params: {order_by:[{column_id:"name"}], rules: [{column_id: "numbers5", compare_value: [0], operator: greater_than}], operator: and }) { items { id name group { title id } assets { id public_url }} } } }';
    const result = await monday.api(query2, options);
    console.log("fetchItems", result);
    return result;
  } catch (error) {
    console.log("error", error);
  }
}

export async function fetchCategories() {
  try {
    const query = "query { boards (ids: 5798486455) { groups { title id }} }";
    const result = await monday.api(query, options);
    // console.log("fetchCategories", result);
    return result;
  } catch (error) {
    console.log("error", error);
  }
}

export interface Events {
  data: {
    items_page_by_column_values: {
      items: Event[];
    };
  };
}

export interface Event {
  id: string;
  name: string;
  group: {
    id: number;
    title: string;
  };
  column_values: [
    {
      time: string;
      date: string;
    },
  ];
}

export type GroupedEvents = Record<
  number,
  {
    // Use string if your actual data uses string IDs for groups
    groupId: number; // Or string
    title: string;
    items: Omit<Event, "group">[]; // Omit the 'group' property from Event in items array
  }
>;

export async function fetchEvents() {
  try {
    const query =
      'query { items_page_by_column_values ( limit:100 , board_id: 7298393018 , columns: [{ column_id: "dropdown4", column_values: ["Yes"] }]) {items {id name group {id title} column_values(ids: "text7") { ... on DateValue { time date} }} }}';
    const result1 = (await monday.api(query, options)) as Events;
    // console.log("result1", result1);
    const result2 = result1.data.items_page_by_column_values.items;
    console.log("result2", result2);

    const groupedData = result2.reduce<GroupedEvents>((acc, item) => {
      // Use the group id as the key for each group
      const { id, title } = item.group;

      // If the group hasn't been added to the accumulator, add it
      if (!acc[id]) {
        acc[id] = {
          groupId: id,
          title,
          items: [],
        };
      }

      // Add the current item to the group's items array
      acc[id]?.items.push({
        id: item.id,
        name: item.name,
        column_values: item.column_values,
      });

      return acc;
    }, {});

    return groupedData;
  } catch (error) {
    console.log("error", error);
  }
}

export async function getEventSubBoard() {
  try {
    const query =
      'query { items_page_by_column_values ( limit:50 , board_id: 5385787810 , columns: [{ column_id: "dropdown__1", column_values: ["Yes"] }]) {items {id name group {id title} } }}';
    const result1 = (await monday.api(query, options)) as Events;
    // console.log("result1", result1);
    const result2 = result1.data.items_page_by_column_values.items;

    const groupedData = result2.reduce<GroupedEvents>((acc, item) => {
      // Use the group id as the key for each group
      const { id, title } = item.group;

      // If the group hasn't been added to the accumulator, add it
      if (!acc[id]) {
        acc[id] = {
          groupId: id,
          title,
          items: [],
        };
      }

      // Add the current item to the group's items array
      acc[id]?.items.push({
        id: item.id,
        name: item.name,
        column_values: item.column_values,
      });

      return acc;
    }, {});

    return groupedData;
  } catch (error) {
    console.log("error", error);
  }
}

export async function fetchSubEvents(selectedEvent: string) {
  console.log("fetchSubEvents");
  try {
    const query = ` query {items(ids:[${selectedEvent}]) {subitems {id name column_values (ids:"dropdown__1") {text} }}} `;
    const result1 = await monday.api(query, options);

    const subitems = result1.data.items[0].subitems;
    console.log("subitems", subitems);

    const filteredSubitems = subitems.filter(
      (subitem: { column_values: any[] }) =>
        subitem.column_values.some((cv) => cv.text === "Yes"),
    );

    console.log("filteredSubitems", filteredSubitems);

    // const groupedData = result2.reduce<GroupedEvents>((acc, item) => {
    //   // Use the group id as the key for each group
    //   const { id, title } = item.group;

    //   // If the group hasn't been added to the accumulator, add it
    //   if (!acc[id]) {
    //     acc[id] = {
    //       groupId: id,
    //       title,
    //       items: [],
    //     };
    //   }

    //   // Add the current item to the group's items array
    //   acc[id]?.items.push({
    //     id: item.id,
    //     name: item.name,
    //     column_values: item.column_values,
    //   });

    //   return acc;
    // }, {});

    return filteredSubitems;
  } catch (error) {
    console.log("error", error);
  }
}

export async function fetchLocations() {
  try {
    const query =
      "{ boards (ids: 5987199810) { items_page (limit: 500) { items { id name } } } }";
    const result = await monday.api(query, options);
    return result;
  } catch (error) {
    console.log("error", error);
  }
}
```

## File: src/app/order/page.tsx
```typescript
"use client";

import React from "react";
import { type inferProcedureOutput } from "@trpc/server";

import { type AppRouter } from "~/server/api/root";
import { deleteOrder } from "./actions";

import { DefaultTable } from "../_components/Table";
import { toast } from "../_components/ui/use-toast";
import { api } from "~/trpc/react";
import { readUserSession } from "../(auth)/actions";

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {};

export type orderType = inferProcedureOutput<
  AppRouter["formResponse"]["getUsersOrders"]
>;

export default function OrderPage({}: Props) {
  const { data, isLoading } = api.formResponse.getUsersOrders.useQuery();
  console.log("data", data);

  // const [data, setData] = useState<orderType>([]);
  // const [loading, setLoading] = useState(true);

  async function handleDelete(id: number) {
    console.log(`Deleting item with id: ${id}`);
    // Implement your delete logic here
    const result = deleteOrder(id);
    console.log("handleDelete", result);

    toast({
      title: "Sucessfully Submitted:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          Sucessfully Deleted:
          <code className="text-white">{JSON.stringify(id, null, 2)}</code>
        </pre>
      ),
    });
  }

  if (isLoading) return <div>Loading...</div>;
  if (data)
    return (
      <div className="container flex flex-1 flex-col">
        <DefaultTable data={data} handleDelete={handleDelete} />
      </div>
    );
}
```

## File: src/app/supabase/posts/page.tsx
```typescript
import React from "react";
import SinglePostComponent from "~/app/_components/Post";
import { api } from "~/trpc/server";
import { unstable_noStore as noStore } from "next/cache";

async function SupabasePostsPage() {
  noStore();
  const data = await api.post.getAll.query();

  return (
    <div className="space-y-3">
      <p> Supabase Posts:</p>
      {data?.map((item) => <SinglePostComponent key={item.id} {...item} />)}
    </div>
  );
}

export default SupabasePostsPage;
```

## File: src/app/layout.tsx
```typescript
import "~/styles/globals.css";

import Header from "./_components/Header";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "./_components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Create T3 App",
  description: "Generated by create-t3-app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${inter.variable} flex min-h-screen flex-1 flex-col bg-gradient-to-b from-[#2e026d] to-[#15162c]`}
      >
        <TRPCReactProvider>
          <NextTopLoader />
          <Header />

          <main className="mt-20 flex flex-1 flex-col items-center py-5 text-white">
            {children}
          </main>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
```

## File: src/app/page.tsx
```typescript
import { CreatePost } from "~/app/_components/create-post";
import Link from "next/link";
import { Session } from "@supabase/supabase-js";
import { api } from "~/trpc/server";
import { fetchCategories2 } from "./order/checkout/actions";
import { getServerAuthSession } from "~/server/auth";
import { unstable_noStore as noStore } from "next/cache";
import { readUserSession } from "./(auth)/actions";

export default async function Home() {
  noStore();
  const hello = await api.post.hello.query({ text: "from tRPC" });
  // const session = await getServerAuthSession();
  const {
    data: { session },
  } = await readUserSession();

  const result = await fetchCategories2();

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-[3rem]">
          D5 Office Of Safety Inventory System
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="/order/checkout"
          >
            <h3 className="text-2xl font-bold">Check Out →</h3>
            <div className="text-lg">Check out an order.</div>
          </Link>
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="/order"
          >
            <h3 className="text-2xl font-bold">Check In →</h3>
            <div className="text-lg">Check in an order.</div>
          </Link>
        </div>
        {/* <div className="flex flex-col items-center gap-2">
          <p className="text-2xl text-white">
            {hello ? hello.greeting : "Loading tRPC query..."}
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-2xl text-white">
              {session && <span>Logged in as {session.user?.email}</span>}
            </p>
          </div>
        </div> */}

        {/* <CrudShowcase session={session} /> */}
      </div>
    </main>
  );
}

// async function CrudShowcase({ session }: { session: Session | null }) {
//   if (!session?.user) return null;

//   const latestPost = await api.post.getLatest.query();

//   return (
//     <div className="w-full max-w-xs">
//       {latestPost ? (
//         <p className="truncate">Your most recent post: {latestPost.name}</p>
//       ) : (
//         <p>You have no posts yet.</p>
//       )}

//       <CreatePost />
//     </div>
//   );
// }
```

## File: src/lib/supabase/browser.ts
```typescript
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

## File: src/lib/supabase/server.ts
```typescript
/* eslint-disable @typescript-eslint/require-await */
"use server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
```

## File: src/lib/apollo-client.ts
```typescript
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Observable,
} from "@apollo/client";
import mondaySdk from "monday-sdk-js";
import { APIOptions } from "monday-sdk-js/types/client-api.interface";
// Initialize the Monday SDK
const monday = mondaySdk();

const mondayLink = new ApolloLink((operation) => {
  return new Observable((observer) => {
    const { query, variables } = operation;
    const graphqlQuery = {
      query: query.loc && query.loc.source.body,
      variables,
    };
    if (graphqlQuery.query) {
      monday
        .api(graphqlQuery.query, {
          variables: graphqlQuery.variables,
          token: process.env.MONDAY_TOKEN,
        })
        .then((response) => {
          observer.next(response);
          observer.complete();
        })
        .catch((error) => observer.error(error));
    }
  });
});

const createApolloClient = () => {
  return new ApolloClient({
    link: mondayLink,
    cache: new InMemoryCache(),
  });
};

export default createApolloClient;
```

## File: src/lib/fetchCategories.graphql
```graphql
query FetchCategories {
  boards(ids: 5798486455) {
    groups {
      title
      id
    }
  }
}
```

## File: src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## File: src/server/api/routers/formResponse.ts
```typescript
import { and, eq } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { InventoryFormData } from "~/app/_components/DefaultForm";
import { formResponses } from "~/server/db/schema";
import { z } from "zod";

export const formResponseRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ data: z.string().min(1), createdById: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [newRecord] = await ctx.db
        .insert(formResponses)
        .values({
          data: input.data,
          createdById: input.createdById,
          status: "checkout",
        })
        .returning();

      return newRecord;
    }),
  updateWithMondayData: publicProcedure
    .input(
      z.object({
        id: z.number(),
        mondayItemId: z.string().optional(),
        data: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newRecord] = await ctx.db
        .update(formResponses)
        .set({
          mondayItemId: input.mondayItemId,
          data: input.data,
          status: input.status,
        })
        .where(eq(formResponses.id, input.id))
        .returning();

      return newRecord;
    }),
  changeDocumentOwner: publicProcedure
    .input(
      z.object({
        id: z.number(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newRecord] = await ctx.db
        .update(formResponses)
        .set({
          createdById: input.userId,
        })
        .where(eq(formResponses.id, input.id))
        .returning();

      return newRecord;
    }),
  getFormResponseById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.formResponses.findFirst({
        where: eq(formResponses.id, input.id),
      });
    }),
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.formResponses.findMany({
      orderBy: (formResponses, { desc }) => [desc(formResponses.createdAt)],
    });
  }),
  getUsersOrders: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.formResponses.findMany({
      where: and(
        eq(formResponses.createdById, ctx.session.user.id),
        eq(formResponses.status, "checkout"),
      ),

      with: { users: true },
    });
  }),
  deleteResponse: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(formResponses).where(eq(formResponses.id, input.id));
    }),
});
```

## File: src/server/api/routers/post.ts
```typescript
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { posts } from "~/server/db/schema";
import { z } from "zod";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await ctx.db.insert(posts).values({
        name: input.name,
      });
    }),

  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.posts.findFirst({
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });
  }),
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.posts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });
  }),
});
```

## File: src/server/api/routers/user.ts
```typescript
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";
import { z } from "zod";

export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
    }),
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.id)],
    });
  }),
});
```

## File: src/server/api/root.ts
```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { formResponseRouter } from "./routers/formResponse";
import { postRouter } from "~/server/api/routers/post";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  formResponse: formResponseRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
```

## File: src/server/api/trpc.ts
```typescript
/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { TRPCError, initTRPC } from "@trpc/server";

import { ZodError } from "zod";
import { db } from "~/server/db";
import supabaseServer from "~/lib/supabase/server";
import superjson from "superjson";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  //const session = await getServerAuthSession();
  const supabase = await supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
```

## File: src/server/db/index.ts
```typescript
import * as schema from "./schema";

import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "~/env.js";
import postgres from "postgres";

export const db = drizzle(postgres(env.DATABASE_URL), { schema });
```

## File: src/server/db/schema.ts
```typescript
import {
  index,
  jsonb,
  pgSchema,
  pgTableCreator,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { InventoryFormData } from "~/app/_components/DefaultForm";
import { relations, sql } from "drizzle-orm";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `create-t3-app_${name}`);

export const posts = createTable(
  "post",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt"),
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  }),
);

export const formResponses = createTable("formResponses", {
  id: serial("id").primaryKey(),
  data: jsonb("data").$type<string>().notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt"),
  createdById: uuid("createdById")
    .notNull()
    .references(() => users.id),
  mondayItemId: varchar("mondayItemId", { length: 256 }),
  status: varchar("status", { length: 256 }),
});

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
  users: one(users, {
    fields: [formResponses.createdById],
    references: [users.id],
  }),
}));

export const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey().notNull(),
});

export const users = createTable("user", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),

  firstName: varchar("firstName", { length: 256 }),
  lastName: varchar("lastName", { length: 256 }),
  email: varchar("email", { length: 256 }),
  tel: varchar("tel", { length: 256 }),
});
```

## File: src/server/auth.ts
```typescript
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import DiscordProvider from "next-auth/providers/discord";

import { env } from "~/env";
import { db } from "~/server/db";
import { createTable } from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  adapter: DrizzleAdapter(db, createTable) as Adapter,
  providers: [
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
```

## File: src/styles/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
 
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
 
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
 
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
 
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
 
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
 
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
 
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
 
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
 
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
 
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## File: src/trpc/react.tsx
```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import { type AppRouter } from "~/server/api/root";
import { getUrl, transformer } from "./shared";

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          url: getUrl(),
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
```

## File: src/trpc/server.ts
```typescript
import "server-only";

import {
  createTRPCProxyClient,
  loggerLink,
  TRPCClientError,
} from "@trpc/client";
import { callProcedure } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { type TRPCErrorResponse } from "@trpc/server/rpc";
import { headers } from "next/headers";
import { cache } from "react";

import { appRouter, type AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { transformer } from "./shared";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(() => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

export const api = createTRPCProxyClient<AppRouter>({
  transformer,
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    /**
     * Custom RSC link that lets us invoke procedures without using http requests. Since Server
     * Components always run on the server, we can just call the procedure as a function.
     */
    () =>
      ({ op }) =>
        observable((observer) => {
          createContext()
            .then((ctx) => {
              return callProcedure({
                procedures: appRouter._def.procedures,
                path: op.path,
                rawInput: op.input,
                ctx,
                type: op.type,
              });
            })
            .then((data) => {
              observer.next({ result: { data } });
              observer.complete();
            })
            .catch((cause: TRPCErrorResponse) => {
              observer.error(TRPCClientError.from(cause));
            });
        }),
  ],
});
```

## File: src/trpc/shared.ts
```typescript
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";

import { type AppRouter } from "~/server/api/root";

export const transformer = superjson;

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
```

## File: src/env.js
```javascript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL"
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url()
    ),
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
```

## File: src/middleware.tsx
```typescript
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/register", "/login", "/resetpass"];

export async function middleware(request: NextRequest) {
  console.log("middleware_activated");
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone(); // Clone the request URL for potential modifications
  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

  if (user) {
    // User is authenticated
    console.log("Authenticated", user.email);
    if (isPublicPath) {
      // Redirect authenticated users away from public paths to the home page
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  } else {
    // User is not authenticated
    console.log("Unauthenticated");
    if (!isPublicPath) {
      // Redirect unauthenticated users trying to access protected routes to the login page
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

## File: .eslintrc.cjs
```
/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  rules: {
    // These opinionated rules are enabled in stylistic-type-checked above.
    // Feel free to reconfigure them to your own preference.
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",

    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: { attributes: false },
      },
    ],
  },
};

module.exports = config;
```

## File: .gitignore
```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# database
/prisma/db.sqlite
/prisma/db.sqlite-journal

# next.js
/.next/
/out/
next-env.d.ts

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
# do not commit any .env files to git, except for the .env.example file. https://create.t3.gg/en/usage/env-variables#using-environment-variables
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
```

## File: codegen.ts
```typescript
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "https://api.monday.com/v2/get_schema?format=sdl&version=2024-04",
  documents: "src/**/*.graphql",
  generates: {
    "src/gql/": {
      preset: "client",
      plugins: ["typescript", "introspection", "typescript-react-apollo"],
    },
  },
};

export default config;
```

## File: components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "src/app/_components",
    "utils": "src/lib/utils"
  }
}
```

## File: drizzle.config.ts
```typescript
import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/server/db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
  tablesFilter: ["create-t3-app_*"],
} satisfies Config;
```

## File: next.config.js
```javascript
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    serverComponentsExternalPackages: ["monday-sdk-js"],
  },
  images: {
    remotePatterns: [
      {
        hostname: "static.thenounproject.com",
      },
      {
        hostname: "files-monday-com.s3.amazonaws.com",
      },
      {
        hostname: "fdotwww.blob.core.windows.net",
      },
    ],
  },
};

export default config;
```

## File: package.json
```json
{
  "name": "create-t3-app-v7.26.0",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "next build",
    "db:push": "drizzle-kit push:pg",
    "db:introspect": "drizzle-kit introspect:pg",
    "db:studio": "drizzle-kit studio",
    "dev": "next dev",
    "lint": "next lint",
    "start": "next start",
    "codegen": "graphql-codegen --config codegen.ts"
  },
  "dependencies": {
    "@apollo/client": "^3.9.7",
    "@auth/drizzle-adapter": "^0.3.6",
    "@hookform/resolvers": "^3.3.4",
    "@planetscale/database": "^1.11.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "@supabase/ssr": "^0.1.0",
    "@supabase/supabase-js": "^2.39.6",
    "@t3-oss/env-nextjs": "^0.7.1",
    "@tanstack/react-query": "^4.36.1",
    "@trpc/client": "^10.43.6",
    "@trpc/next": "^10.43.6",
    "@trpc/react-query": "^10.43.6",
    "@trpc/server": "^10.43.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "cmdk": "^1.0.0",
    "drizzle-orm": "^0.29.3",
    "graphql": "^16.8.1",
    "lucide-react": "^0.330.0",
    "monday-sdk-js": "^0.5.5",
    "next": "^14.0.4",
    "next-auth": "^4.24.5",
    "nextjs-toploader": "^1.6.6",
    "postgres": "^3.4.3",
    "react": "18.2.0",
    "react-confetti": "^6.1.0",
    "react-dom": "18.2.0",
    "react-hook-form": "^7.50.1",
    "react-icons": "^5.0.1",
    "server-only": "^0.0.1",
    "superjson": "^2.2.1",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "5.0.2",
    "@graphql-codegen/typescript": "^4.0.6",
    "@graphql-codegen/typescript-apollo-client-helpers": "^3.0.0",
    "@graphql-codegen/typescript-operations": "^4.2.0",
    "@types/eslint": "^8.44.7",
    "@types/node": "^18.17.0",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.11.0",
    "@typescript-eslint/parser": "^6.11.0",
    "autoprefixer": "^10.4.14",
    "drizzle-kit": "^0.20.9",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.4",
    "graphql-prettier": "^1.0.6",
    "mysql2": "^3.6.1",
    "postcss": "^8.4.31",
    "prettier": "^3.1.0",
    "prettier-plugin-tailwindcss": "^0.5.7",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.1.6",
    "@graphql-codegen/client-preset": "4.2.4"
  },
  "ct3aMetadata": {
    "initVersion": "7.26.0"
  },
  "packageManager": "pnpm@8.10.0"
}
```

## File: postcss.config.cjs
```
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

module.exports = config;
```

## File: prettier.config.js
```javascript
/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
```

## File: README.md
```markdown
# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
```

## File: tailwind.config.ts
```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## File: tsconfig.json
```json
{
  "compilerOptions": {
    /* Base Options: */
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,

    /* Strictness */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "checkJs": true,

    /* Bundled projects */
    "lib": ["dom", "dom.iterable", "ES2022"],
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "incremental": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"],
      "@/components/*": ["./src/app/_components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": [
    ".eslintrc.cjs",
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.cjs",
    "**/*.js",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```
