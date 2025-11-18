import {
  BookOpen,
  Bot,
  HammerIcon,
  HelpCircle,
  Image,
  Settings2,
  Share2,
  ShoppingCart,
  TerminalSquare,
  Twitter,
  User,
  Users,
} from "lucide-react";

export const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: TerminalSquare,
    isActive: true,
  },
  {
    title: "LMS",
    url: "/admin/lms",
    icon: Users,
    items: [
      {
        title: "Courses",
        url: "/admin/lms/courses",
        icon: BookOpen,
      },
      {
        title: "Lessons",
        url: "/admin/lms/lessons",
        icon: BookOpen,
      },
      {
        title: "Topics",
        url: "/admin/lms/topics",
        icon: BookOpen,
      },
      {
        title: "Quizzes",
        url: "/admin/lms/quizzes",
        icon: BookOpen,
      },
    ],
  },

  {
    title: "Campaign Calendar",
    url: "/admin/calendar",
    icon: BookOpen,
    items: [
      {
        title: "Create Calendar",
        url: "/admin/calendar/create",
        icon: BookOpen,
      },
      {
        title: "Create Event",
        url: "/admin/calendar/event/create",
        icon: BookOpen,
      },
      {
        title: "Categories",
        url: "/admin/calendar/category",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Shop",
    url: "/admin/store",
    icon: User,
    items: [
      {
        title: "Dashboard",
        url: "/admin/store",
        icon: BookOpen,
      },
      {
        title: "Orders",
        url: "/admin/store/orders",
        icon: BookOpen,
      },
      {
        title: "Products",
        url: "/admin/store/products",
        icon: BookOpen,
      },
      {
        title: "Funnels",
        url: "/admin/store/funnels",
        icon: BookOpen,
      },
      {
        title: "Categories",
        url: "/admin/store/products/categories",
        icon: BookOpen,
      },

      {
        title: "Tags",
        url: "/admin/store/products/tags",
        icon: BookOpen,
      },
      {
        title: "Chargebacks",
        url: "/admin/store/chargebacks",
        icon: BookOpen,
      },
      {
        title: "Balances",
        url: "/admin/store/balances",
        icon: BookOpen,
      },
      {
        title: "Settings",
        url: "/admin/store/settings",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Helpdesk",
    url: "/admin/helpdesk",
    icon: HelpCircle,
    items: [
      {
        title: "Tickets",
        url: "/admin/helpdesk/tickets",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Social",
    url: "/social/feed",
    icon: Twitter,
    items: [
      {
        title: "Feed",
        url: "#",
      },
      {
        title: "Team",
        url: "#",
      },
      {
        title: "Billing",
        url: "#",
      },
      {
        title: "Limits",
        url: "#",
      },
    ],
  },
  {
    title: "Tasks",
    url: "/admin/tasks",
    icon: BookOpen,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings2,
    items: [
      {
        title: "General",
        url: "/admin/settings/site",
      },
      {
        title: "Post types",
        url: "/admin/settings/post-types",
      },
      {
        title: "Custom fields",
        url: "/admin/settings/post-types?tab=fields",
      },
      {
        title: "Taxonomies",
        url: "/admin/settings/post-types?tab=taxonomies",
      },
      {
        title: "Templates",
        url: "/admin/settings/post-types?tab=templates",
      },
      {
        title: "Menus",
        url: "/admin/settings/menus",
      },
      {
        title: "Roles",
        url: "/admin/settings/roles",
      },
      {
        title: "Plans",
        url: "/admin/settings/plans",
      },
      {
        title: "Organizations",
        url: "/admin/settings/organizations",
      },
    ],
  },
  { title: "Tools", url: "/admin/tools", icon: HammerIcon },
  {
    title: "Integrations",
    url: "/admin/integrations",
    icon: Share2,
    items: [
      {
        title: "Apps",
        url: "/admin/integrations",
      },
      {
        title: "Connections",
        url: "/admin/integrations?tab=connections",
      },
      {
        title: "Scenarios",
        url: "/admin/integrations?tab=scenarios",
      },
      {
        title: "Plugins",
        url: "/admin/integrations/plugins",
        icon: BookOpen,
      },
      {
        title: "Logs",
        url: "/admin/integrations/logs",
      },
    ],
  },
];
