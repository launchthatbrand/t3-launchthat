# Phase 5: Enterprise Features - Scenario Builder

## Product Requirements Document (PRD)

### Version: 1.0

### Date: January 16, 2025

### Phase: 5 - Enterprise Features

### Duration: Weeks 15-18

---

## Executive Summary

Phase 5 focuses on implementing enterprise-grade features that transform the Scenario Builder into a production-ready, enterprise automation platform. This phase will implement Role-Based Access Control (RBAC), comprehensive organization management, scenario templates and marketplace, and advanced performance optimization. The goal is to have a secure, scalable, and enterprise-ready automation platform that can support multiple organizations and teams.

## Success Criteria

**Phase 5 is complete when:**

- ✅ Role-Based Access Control (RBAC) system is fully implemented
- ✅ Organization management system is operational
- ✅ Scenario templates and marketplace are functional
- ✅ Advanced performance optimization is implemented
- ✅ `pnpm build` runs successfully with no errors
- ✅ Enterprise-ready automation platform is demonstrated

---

## Technical Requirements

### 1. Role-Based Access Control (RBAC)

#### **Permission System Architecture**

```typescript
// packages/scenario-builder-core/src/security/permissions.ts
export enum Permission {
  // Scenario permissions
  SCENARIO_CREATE = "scenario:create",
  SCENARIO_READ = "scenario:read",
  SCENARIO_UPDATE = "scenario:update",
  SCENARIO_DELETE = "scenario:delete",
  SCENARIO_EXECUTE = "scenario:execute",
  SCENARIO_SHARE = "scenario:share",
  SCENARIO_TEMPLATE_CREATE = "scenario:template:create",
  SCENARIO_TEMPLATE_PUBLISH = "scenario:template:publish",

  // Connection permissions
  CONNECTION_CREATE = "connection:create",
  CONNECTION_READ = "connection:read",
  CONNECTION_UPDATE = "connection:update",
  CONNECTION_DELETE = "connection:delete",
  CONNECTION_TEST = "connection:test",
  CONNECTION_SHARE = "connection:share",

  // Organization permissions
  ORG_MEMBER_INVITE = "org:member:invite",
  ORG_MEMBER_REMOVE = "org:member:remove",
  ORG_MEMBER_ROLE_UPDATE = "org:member:role:update",
  ORG_SETTINGS_UPDATE = "org:settings:update",
  ORG_BILLING_VIEW = "org:billing:view",
  ORG_BILLING_UPDATE = "org:billing:update",

  // System permissions
  SYSTEM_ADMIN = "system:admin",
  SYSTEM_MONITORING = "system:monitoring",
  SYSTEM_CONFIG = "system:config",
  SYSTEM_USERS = "system:users:manage",
  SYSTEM_ORGANIZATIONS = "system:organizations:manage",

  // Marketplace permissions
  MARKETPLACE_PUBLISH = "marketplace:publish",
  MARKETPLACE_MODERATE = "marketplace:moderate",
  MARKETPLACE_ANALYTICS = "marketplace:analytics",
}

export const RolePermissions: Record<string, Permission[]> = {
  owner: Object.values(Permission),

  admin: [
    Permission.SCENARIO_CREATE,
    Permission.SCENARIO_READ,
    Permission.SCENARIO_UPDATE,
    Permission.SCENARIO_DELETE,
    Permission.SCENARIO_EXECUTE,
    Permission.SCENARIO_SHARE,
    Permission.SCENARIO_TEMPLATE_CREATE,
    Permission.SCENARIO_TEMPLATE_PUBLISH,
    Permission.CONNECTION_CREATE,
    Permission.CONNECTION_READ,
    Permission.CONNECTION_UPDATE,
    Permission.CONNECTION_DELETE,
    Permission.CONNECTION_TEST,
    Permission.CONNECTION_SHARE,
    Permission.ORG_MEMBER_INVITE,
    Permission.ORG_MEMBER_REMOVE,
    Permission.ORG_MEMBER_ROLE_UPDATE,
    Permission.ORG_SETTINGS_UPDATE,
    Permission.ORG_BILLING_VIEW,
    Permission.ORG_BILLING_UPDATE,
  ],

  manager: [
    Permission.SCENARIO_CREATE,
    Permission.SCENARIO_READ,
    Permission.SCENARIO_UPDATE,
    Permission.SCENARIO_EXECUTE,
    Permission.SCENARIO_SHARE,
    Permission.SCENARIO_TEMPLATE_CREATE,
    Permission.CONNECTION_CREATE,
    Permission.CONNECTION_READ,
    Permission.CONNECTION_UPDATE,
    Permission.CONNECTION_TEST,
    Permission.CONNECTION_SHARE,
    Permission.ORG_MEMBER_INVITE,
    Permission.ORG_SETTINGS_UPDATE,
  ],

  member: [
    Permission.SCENARIO_CREATE,
    Permission.SCENARIO_READ,
    Permission.SCENARIO_UPDATE,
    Permission.SCENARIO_EXECUTE,
    Permission.CONNECTION_READ,
    Permission.CONNECTION_TEST,
  ],

  viewer: [Permission.SCENARIO_READ, Permission.CONNECTION_READ],

  guest: [Permission.SCENARIO_READ],
};

export interface PermissionCheck {
  userId: string;
  organizationId: string;
  permission: Permission;
  resourceType?: string;
  resourceId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}
```

#### **Permission Checker Implementation**

```typescript
// packages/scenario-builder-core/src/security/permissionChecker.ts
export class PermissionChecker {
  private rolePermissions: Map<string, Set<Permission>>;
  private resourcePermissions: Map<string, ResourcePermission[]>;

  constructor() {
    this.rolePermissions = new Map();
    this.resourcePermissions = new Map();
    this.initializeRolePermissions();
  }

  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    try {
      // Get user's role in the organization
      const userRole = await this.getUserRole(
        check.userId,
        check.organizationId,
      );
      if (!userRole) {
        return {
          allowed: false,
          reason: "User not a member of this organization",
        };
      }

      // Check role-based permissions
      const rolePermissions = this.rolePermissions.get(userRole);
      if (!rolePermissions || !rolePermissions.has(check.permission)) {
        return { allowed: false, reason: "Insufficient role permissions" };
      }

      // Check resource-specific permissions if applicable
      if (check.resourceType && check.resourceId) {
        const resourcePermission = await this.checkResourcePermission(check);
        if (!resourcePermission.allowed) {
          return resourcePermission;
        }
      }

      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        reason: `Permission check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async checkMultiplePermissions(
    checks: PermissionCheck[],
  ): Promise<PermissionResult[]> {
    return Promise.all(checks.map((check) => this.checkPermission(check)));
  }

  async getUserRole(
    userId: string,
    organizationId: string,
  ): Promise<string | null> {
    // This will be implemented with the database layer
    // For now, return a default role
    return "member";
  }

  private async checkResourcePermission(
    check: PermissionCheck,
  ): Promise<PermissionResult> {
    const resourceKey = `${check.resourceType}:${check.resourceId}`;
    const permissions = this.resourcePermissions.get(resourceKey) || [];

    // Check if user has explicit permission on this resource
    const userPermission = permissions.find(
      (p) => p.userId === check.userId && p.permission === check.permission,
    );

    if (userPermission) {
      return { allowed: userPermission.allowed, reason: userPermission.reason };
    }

    // Check if user has inherited permission
    const inheritedPermission = permissions.find(
      (p) => p.inheritedFrom && p.permission === check.permission,
    );

    if (inheritedPermission) {
      return {
        allowed: inheritedPermission.allowed,
        reason: inheritedPermission.reason,
      };
    }

    // Default to role-based permissions
    return { allowed: true };
  }

  private initializeRolePermissions(): void {
    Object.entries(RolePermissions).forEach(([role, permissions]) => {
      this.rolePermissions.set(role, new Set(permissions));
    });
  }
}
```

### 2. Organization Management System

#### **Organization Structure & Management**

```typescript
// packages/scenario-builder-core/src/organizations/organizationManager.ts
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  plan: "free" | "pro" | "enterprise" | "custom";
  settings: OrganizationSettings;
  limits: OrganizationLimits;
  status: "active" | "suspended" | "cancelled";
  createdAt: number;
  updatedAt: number;
}

export interface OrganizationSettings {
  timezone: string;
  locale: string;
  dateFormat: string;
  timeFormat: string;
  notifications: NotificationSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
  branding: BrandingSettings;
}

export interface OrganizationLimits {
  maxMembers: number;
  maxScenarios: number;
  maxExecutionsPerMonth: number;
  maxStorageGB: number;
  maxIntegrations: number;
  maxWebhooks: number;
  maxTemplates: number;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  permissions: Permission[];
  invitedBy?: string;
  invitedAt: number;
  joinedAt?: number;
  status: "invited" | "active" | "suspended";
  metadata: Record<string, any>;
}

export class OrganizationManager {
  private organizations: Map<string, Organization> = new Map();
  private members: Map<string, OrganizationMember[]> = new Map();
  private invitations: Map<string, OrganizationInvitation> = new Map();

  async createOrganization(
    data: CreateOrganizationData,
  ): Promise<Organization> {
    const organization: Organization = {
      id: generateId(),
      name: data.name,
      slug: this.generateSlug(data.name),
      description: data.description,
      logo: data.logo,
      plan: data.plan || "free",
      settings: this.getDefaultSettings(),
      limits: this.getPlanLimits(data.plan || "free"),
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.organizations.set(organization.id, organization);

    // Add creator as owner
    await this.addMember(organization.id, data.ownerId, "owner");

    return organization;
  }

  async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>,
  ): Promise<Organization> {
    const organization = this.organizations.get(organizationId);
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    const updated = { ...organization, ...updates, updatedAt: Date.now() };
    this.organizations.set(organizationId, updated);

    return updated;
  }

  async addMember(
    organizationId: string,
    userId: string,
    role: string,
  ): Promise<OrganizationMember> {
    const member: OrganizationMember = {
      id: generateId(),
      organizationId,
      userId,
      role,
      permissions: RolePermissions[role] || [],
      joinedAt: Date.now(),
      status: "active",
      metadata: {},
    };

    if (!this.members.has(organizationId)) {
      this.members.set(organizationId, []);
    }

    this.members.get(organizationId)!.push(member);
    return member;
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    const members = this.members.get(organizationId);
    if (!members) return;

    const index = members.findIndex((m) => m.userId === userId);
    if (index !== -1) {
      members.splice(index, 1);
    }
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    newRole: string,
  ): Promise<OrganizationMember> {
    const members = this.members.get(organizationId);
    if (!members) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    const member = members.find((m) => m.userId === userId);
    if (!member) {
      throw new Error(
        `Member ${userId} not found in organization ${organizationId}`,
      );
    }

    member.role = newRole;
    member.permissions = RolePermissions[newRole] || [];
    member.metadata.lastRoleUpdate = Date.now();

    return member;
  }

  async inviteMember(
    organizationId: string,
    email: string,
    role: string,
    invitedBy: string,
  ): Promise<OrganizationInvitation> {
    const invitation: OrganizationInvitation = {
      id: generateId(),
      organizationId,
      email,
      role,
      invitedBy,
      invitedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      status: "pending",
      token: this.generateInvitationToken(),
    };

    if (!this.invitations.has(organizationId)) {
      this.invitations.set(organizationId, []);
    }

    this.invitations.get(organizationId)!.push(invitation);

    // Send invitation email
    await this.sendInvitationEmail(invitation);

    return invitation;
  }

  async acceptInvitation(
    token: string,
    userId: string,
  ): Promise<OrganizationMember> {
    const invitation = this.findInvitationByToken(token);
    if (!invitation) {
      throw new Error("Invalid invitation token");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been used or expired");
    }

    if (Date.now() > invitation.expiresAt) {
      throw new Error("Invitation has expired");
    }

    // Add member to organization
    const member = await this.addMember(
      invitation.organizationId,
      userId,
      invitation.role,
    );

    // Mark invitation as accepted
    invitation.status = "accepted";
    invitation.acceptedAt = Date.now();
    invitation.acceptedBy = userId;

    return member;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private getDefaultSettings(): OrganizationSettings {
    return {
      timezone: "UTC",
      locale: "en-US",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      notifications: {
        email: true,
        slack: false,
        webhook: false,
      },
      security: {
        requireMFA: false,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        ipWhitelist: [],
      },
      integrations: {
        allowCustomIntegrations: false,
        requireApproval: true,
      },
      branding: {
        primaryColor: "#3B82F6",
        logo: undefined,
        customCSS: undefined,
      },
    };
  }

  private getPlanLimits(plan: string): OrganizationLimits {
    const limits = {
      free: {
        maxMembers: 5,
        maxScenarios: 10,
        maxExecutionsPerMonth: 1000,
        maxStorageGB: 1,
        maxIntegrations: 5,
        maxWebhooks: 10,
        maxTemplates: 5,
      },
      pro: {
        maxMembers: 25,
        maxScenarios: 100,
        maxExecutionsPerMonth: 10000,
        maxStorageGB: 10,
        maxIntegrations: 20,
        maxWebhooks: 100,
        maxTemplates: 50,
      },
      enterprise: {
        maxMembers: 1000,
        maxScenarios: 10000,
        maxExecutionsPerMonth: 1000000,
        maxStorageGB: 1000,
        maxIntegrations: 1000,
        maxWebhooks: 10000,
        maxTemplates: 1000,
      },
      custom: {
        maxMembers: -1, // Unlimited
        maxScenarios: -1,
        maxExecutionsPerMonth: -1,
        maxStorageGB: -1,
        maxIntegrations: -1,
        maxWebhooks: -1,
        maxTemplates: -1,
      },
    };

    return limits[plan as keyof typeof limits] || limits.free;
  }
}
```

### 3. Scenario Templates & Marketplace

#### **Template System Architecture**

```typescript
// packages/scenario-builder-core/src/templates/templateManager.ts
export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  authorId?: string;
  authorOrganizationId?: string;
  version: string;
  definition: ScenarioDefinition;
  requiredIntegrations: string[];
  requiredConnections: string[];
  usageCount: number;
  rating: number;
  ratingCount: number;
  downloads: number;
  isOfficial: boolean;
  isPublic: boolean;
  isApproved: boolean;
  price?: number;
  currency?: string;
  license: "free" | "commercial" | "enterprise";
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentCategoryId?: string;
  templateCount: number;
}

export interface TemplateSearchFilters {
  category?: string;
  tags?: string[];
  author?: string;
  priceRange?: { min: number; max: number };
  rating?: number;
  integrations?: string[];
  license?: string;
  isOfficial?: boolean;
  sortBy?: "popularity" | "rating" | "newest" | "price";
  sortOrder?: "asc" | "desc";
}

export class TemplateManager {
  private templates: Map<string, ScenarioTemplate> = new Map();
  private categories: Map<string, TemplateCategory> = new Map();
  private ratings: Map<string, TemplateRating[]> = new Map();
  private downloads: Map<string, TemplateDownload[]> = new Map();

  async createTemplate(data: CreateTemplateData): Promise<ScenarioTemplate> {
    const template: ScenarioTemplate = {
      id: generateId(),
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      author: data.author,
      authorId: data.authorId,
      authorOrganizationId: data.authorOrganizationId,
      version: data.version || "1.0.0",
      definition: data.definition,
      requiredIntegrations: data.requiredIntegrations || [],
      requiredConnections: data.requiredConnections || [],
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
      downloads: 0,
      isOfficial: data.isOfficial || false,
      isPublic: data.isPublic || false,
      isApproved: data.isApproved || false,
      price: data.price,
      currency: data.currency || "USD",
      license: data.license || "free",
      metadata: data.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.templates.set(template.id, template);

    // Update category template count
    await this.updateCategoryTemplateCount(template.category, 1);

    return template;
  }

  async searchTemplates(
    filters: TemplateSearchFilters,
  ): Promise<ScenarioTemplate[]> {
    let results = Array.from(this.templates.values());

    // Apply filters
    if (filters.category) {
      results = results.filter((t) => t.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((t) =>
        filters.tags!.some((tag) => t.tags.includes(tag)),
      );
    }

    if (filters.author) {
      results = results.filter((t) => t.author === filters.author);
    }

    if (filters.priceRange) {
      results = results.filter((t) => {
        if (!t.price) return true; // Free templates
        return (
          t.price >= filters.priceRange!.min &&
          t.price <= filters.priceRange!.max
        );
      });
    }

    if (filters.rating) {
      results = results.filter((t) => t.rating >= filters.rating!);
    }

    if (filters.integrations && filters.integrations.length > 0) {
      results = results.filter((t) =>
        filters.integrations!.every((integration) =>
          t.requiredIntegrations.includes(integration),
        ),
      );
    }

    if (filters.license) {
      results = results.filter((t) => t.license === filters.license);
    }

    if (filters.isOfficial !== undefined) {
      results = results.filter((t) => t.isOfficial === filters.isOfficial);
    }

    // Apply sorting
    if (filters.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filters.sortBy) {
          case "popularity":
            aValue = a.usageCount;
            bValue = b.usageCount;
            break;
          case "rating":
            aValue = a.rating;
            bValue = b.rating;
            break;
          case "newest":
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case "price":
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          default:
            return 0;
        }

        if (filters.sortOrder === "desc") {
          return bValue - aValue;
        } else {
          return aValue - bValue;
        }
      });
    }

    return results;
  }

  async getTemplateById(templateId: string): Promise<ScenarioTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async downloadTemplate(
    templateId: string,
    userId: string,
  ): Promise<ScenarioDefinition> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Check if user has access to this template
    if (!template.isPublic && !template.isOfficial) {
      // Check if user is in the same organization or has purchased the template
      // This will be implemented with the permission system
    }

    // Record download
    await this.recordDownload(templateId, userId);

    // Increment download count
    template.downloads++;
    template.updatedAt = Date.now();

    return template.definition;
  }

  async rateTemplate(
    templateId: string,
    userId: string,
    rating: number,
    comment?: string,
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Check if user has already rated this template
    const existingRating = this.ratings
      .get(templateId)
      ?.find((r) => r.userId === userId);
    if (existingRating) {
      throw new Error("User has already rated this template");
    }

    // Add rating
    const newRating: TemplateRating = {
      id: generateId(),
      templateId,
      userId,
      rating,
      comment,
      createdAt: Date.now(),
    };

    if (!this.ratings.has(templateId)) {
      this.ratings.set(templateId, []);
    }

    this.ratings.get(templateId)!.push(newRating);

    // Update template rating
    const allRatings = this.ratings.get(templateId)!;
    template.rating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    template.ratingCount = allRatings.length;
    template.updatedAt = Date.now();
  }

  async createTemplateFromScenario(
    scenarioId: string,
    userId: string,
    templateData: CreateTemplateData,
  ): Promise<ScenarioTemplate> {
    // Get scenario definition
    const scenario = await this.getScenarioDefinition(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    // Check if user has permission to create templates from this scenario
    // This will be implemented with the permission system

    // Create template
    const template = await this.createTemplate({
      ...templateData,
      definition: scenario,
      authorId: userId,
    });

    return template;
  }

  private async recordDownload(
    templateId: string,
    userId: string,
  ): Promise<void> {
    const download: TemplateDownload = {
      id: generateId(),
      templateId,
      userId,
      downloadedAt: Date.now(),
    };

    if (!this.downloads.has(templateId)) {
      this.downloads.set(templateId, []);
    }

    this.downloads.get(templateId)!.push(download);
  }

  private async updateCategoryTemplateCount(
    categoryId: string,
    delta: number,
  ): Promise<void> {
    const category = this.categories.get(categoryId);
    if (category) {
      category.templateCount += delta;
      this.categories.set(categoryId, category);
    }
  }
}
```

### 4. Performance Optimization

#### **Advanced Caching System**

```typescript
// packages/scenario-builder-core/src/caching/advancedCacheManager.ts
export interface CacheConfig {
  ttl: number;
  maxSize: number;
  evictionPolicy: "lru" | "lfu" | "fifo";
  compression: boolean;
  encryption: boolean;
  distributed: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  metadata: {
    createdAt: number;
    accessedAt: number;
    accessCount: number;
    size: number;
    tags: string[];
  };
}

export class AdvancedCacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private redisClient?: Redis;
  private config: CacheConfig;
  private stats: CacheStats;

  constructor(config: CacheConfig) {
    this.config = config;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    };
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult) {
        if (this.isExpired(memoryResult)) {
          this.memoryCache.delete(key);
          this.stats.misses++;
          return null;
        }

        // Update access metadata
        memoryResult.metadata.accessedAt = Date.now();
        memoryResult.metadata.accessCount++;
        this.stats.hits++;

        return memoryResult.value;
      }

      // Check Redis cache if distributed
      if (this.config.distributed && this.redisClient) {
        const redisResult = await this.redisClient.get(key);
        if (redisResult) {
          const parsed = JSON.parse(redisResult);

          // Add to memory cache
          this.setMemoryCache(key, parsed.value, parsed.metadata);

          this.stats.hits++;
          return parsed.value;
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<void> {
    try {
      const metadata: CacheEntry["metadata"] = {
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
        size: this.calculateSize(value),
        tags: options?.tags || [],
      };

      // Set in memory cache
      this.setMemoryCache(key, value, metadata);

      // Set in Redis if distributed
      if (this.config.distributed && this.redisClient) {
        const entry: CacheEntry = { key, value, metadata };
        const serialized = JSON.stringify(entry);

        if (this.config.encryption) {
          const encrypted = await this.encrypt(serialized);
          await this.redisClient.setex(
            key,
            Math.floor(this.config.ttl / 1000),
            encrypted,
          );
        } else {
          await this.redisClient.setex(
            key,
            Math.floor(this.config.ttl / 1000),
            serialized,
          );
        }
      }

      this.stats.sets++;
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (this.config.distributed && this.redisClient) {
      await this.redisClient.del(key);
    }

    this.stats.deletes++;
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keysToDelete: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (entry.metadata.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    if (this.config.distributed && this.redisClient) {
      // Use Redis SCAN to find keys with tag
      const keys = await this.redisClient.keys(`*:${tag}:*`);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.config.distributed && this.redisClient) {
      await this.redisClient.flushdb();
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private setMemoryCache<T>(
    key: string,
    value: T,
    metadata: CacheEntry["metadata"],
  ): void {
    // Check if we need to evict entries
    if (this.memoryCache.size >= this.config.maxSize) {
      this.evictEntries();
    }

    this.memoryCache.set(key, { key, value, metadata });
  }

  private evictEntries(): void {
    const entries = Array.from(this.memoryCache.values());

    switch (this.config.evictionPolicy) {
      case "lru":
        entries.sort((a, b) => a.metadata.accessedAt - b.metadata.accessedAt);
        break;
      case "lfu":
        entries.sort((a, b) => a.metadata.accessCount - b.metadata.accessCount);
        break;
      case "fifo":
        entries.sort((a, b) => a.metadata.createdAt - b.metadata.createdAt);
        break;
    }

    // Remove oldest/least used entries
    const toRemove = Math.ceil(this.config.maxSize * 0.1); // Remove 10%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.memoryCache.delete(entries[i].key);
    }

    this.stats.evictions += toRemove;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.metadata.createdAt > this.config.ttl;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length;
  }

  private async encrypt(data: string): Promise<string> {
    // Implement encryption logic
    return data;
  }
}
```

#### **Query Optimization & Indexing**

```typescript
// packages/scenario-builder-core/src/database/queryOptimizer.ts
export interface QueryPlan {
  query: string;
  indexes: string[];
  estimatedCost: number;
  estimatedRows: number;
  executionTime: number;
}

export class QueryOptimizer {
  private indexRegistry: Map<string, DatabaseIndex> = new Map();
  private queryCache: Map<string, CachedQuery> = new Map();
  private statistics: QueryStatistics;

  constructor() {
    this.statistics = {
      totalQueries: 0,
      cachedQueries: 0,
      slowQueries: 0,
      averageExecutionTime: 0,
    };
  }

  async optimizeQuery(query: string, parameters: any[]): Promise<QueryPlan> {
    // Check query cache first
    const cacheKey = this.generateCacheKey(query, parameters);
    const cached = this.queryCache.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      this.statistics.cachedQueries++;
      return cached.plan;
    }

    // Analyze query and generate execution plan
    const plan = await this.generateQueryPlan(query, parameters);

    // Cache the plan
    this.queryCache.set(cacheKey, {
      plan,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000, // 5 minutes
    });

    this.statistics.totalQueries++;
    return plan;
  }

  async suggestIndexes(query: string): Promise<IndexSuggestion[]> {
    const suggestions: IndexSuggestion[] = [];

    // Analyze query for potential index improvements
    const analysis = this.analyzeQuery(query);

    // Check for missing indexes on WHERE clauses
    analysis.whereClauses.forEach((clause) => {
      if (!this.hasIndex(clause.table, clause.column)) {
        suggestions.push({
          table: clause.table,
          columns: [clause.column],
          type: "single",
          priority: "high",
          estimatedImprovement: "significant",
        });
      }
    });

    // Check for missing composite indexes
    analysis.joins.forEach((join) => {
      if (!this.hasCompositeIndex(join.table, join.columns)) {
        suggestions.push({
          table: join.table,
          columns: join.columns,
          type: "composite",
          priority: "medium",
          estimatedImprovement: "moderate",
        });
      }
    });

    return suggestions;
  }

  async createIndex(suggestion: IndexSuggestion): Promise<void> {
    const index: DatabaseIndex = {
      id: generateId(),
      table: suggestion.table,
      columns: suggestion.columns,
      type: suggestion.type,
      status: "creating",
      createdAt: Date.now(),
    };

    this.indexRegistry.set(index.id, index);

    try {
      // Create index in database
      await this.executeCreateIndex(index);

      index.status = "active";
      index.createdAt = Date.now();

      // Update statistics
      this.updateIndexStatistics(index);
    } catch (error) {
      index.status = "failed";
      index.error = error instanceof Error ? error.message : "Unknown error";
      throw error;
    }
  }

  private async generateQueryPlan(
    query: string,
    parameters: any[],
  ): Promise<QueryPlan> {
    const startTime = Date.now();

    // Parse query to identify tables, columns, and operations
    const parsed = this.parseQuery(query);

    // Find applicable indexes
    const indexes = this.findApplicableIndexes(parsed);

    // Estimate execution cost
    const estimatedCost = this.estimateExecutionCost(parsed, indexes);
    const estimatedRows = this.estimateResultRows(parsed, indexes);

    const executionTime = Date.now() - startTime;

    return {
      query,
      indexes: indexes.map((i) => i.id),
      estimatedCost,
      estimatedRows,
      executionTime,
    };
  }

  private parseQuery(query: string): ParsedQuery {
    // Implement SQL query parsing
    // This is a simplified version
    return {
      tables: [],
      columns: [],
      whereClauses: [],
      joins: [],
      orderBy: [],
      groupBy: [],
      limit: undefined,
    };
  }

  private findApplicableIndexes(parsed: ParsedQuery): DatabaseIndex[] {
    const applicable: DatabaseIndex[] = [];

    this.indexRegistry.forEach((index) => {
      if (index.status === "active" && this.isIndexApplicable(index, parsed)) {
        applicable.push(index);
      }
    });

    return applicable;
  }

  private isIndexApplicable(
    index: DatabaseIndex,
    parsed: ParsedQuery,
  ): boolean {
    // Check if index columns are used in WHERE, JOIN, or ORDER BY clauses
    return index.columns.some(
      (column) =>
        parsed.whereClauses.some((clause) => clause.column === column) ||
        parsed.joins.some((join) => join.columns.includes(column)) ||
        parsed.orderBy.some((order) => order.column === column),
    );
  }

  private estimateExecutionCost(
    parsed: ParsedQuery,
    indexes: DatabaseIndex[],
  ): number {
    // Implement cost estimation algorithm
    let cost = 0;

    // Base cost for table scans
    cost += parsed.tables.length * 1000;

    // Reduce cost for each applicable index
    cost -= indexes.length * 200;

    // Add cost for complex operations
    if (parsed.joins.length > 0) cost += parsed.joins.length * 500;
    if (parsed.groupBy.length > 0) cost += 300;
    if (parsed.orderBy.length > 0) cost += 200;

    return Math.max(cost, 100); // Minimum cost
  }

  private estimateResultRows(
    parsed: ParsedQuery,
    indexes: DatabaseIndex[],
  ): number {
    // Implement row estimation algorithm
    let estimatedRows = 1000; // Default estimate

    // Adjust based on WHERE clauses
    estimatedRows *= Math.pow(0.1, parsed.whereClauses.length);

    // Adjust based on indexes
    estimatedRows *= Math.pow(0.5, indexes.length);

    // Apply LIMIT if present
    if (parsed.limit) {
      estimatedRows = Math.min(estimatedRows, parsed.limit);
    }

    return Math.max(estimatedRows, 1);
  }

  private hasIndex(table: string, column: string): boolean {
    return Array.from(this.indexRegistry.values()).some(
      (index) =>
        index.table === table &&
        index.columns.includes(column) &&
        index.status === "active",
    );
  }

  private hasCompositeIndex(table: string, columns: string[]): boolean {
    return Array.from(this.indexRegistry.values()).some(
      (index) =>
        index.table === table &&
        index.type === "composite" &&
        columns.every((col) => index.columns.includes(col)) &&
        index.status === "active",
    );
  }
}
```

---

## Deliverables

### **Code Deliverables**

- [ ] Complete RBAC system with permission management
- [ ] Organization management system with member management
- [ ] Scenario templates and marketplace system
- [ ] Advanced caching and performance optimization
- [ ] Query optimization and indexing system
- [ ] Enterprise-ready automation platform

### **Testing Deliverables**

- [ ] RBAC system tests
- [ ] Organization management tests
- [ ] Template and marketplace tests
- [ ] Performance optimization tests
- [ ] Security and permission tests
- [ ] Enterprise feature integration tests

### **Documentation Deliverables**

- [ ] RBAC configuration guide
- [ ] Organization management guide
- [ ] Template creation and marketplace guide
- [ ] Performance optimization guide
- [ ] Enterprise deployment guide
- [ ] Security and compliance documentation

### **Quality Gates**

- [ ] `pnpm build` runs successfully with no errors
- [ ] All TypeScript compilation passes
- [ ] RBAC system enforces permissions correctly
- [ ] Organization management works properly
- [ ] Template marketplace is functional
- [ ] Performance meets enterprise requirements
- [ ] Security features are properly implemented

---

## Success Metrics

### **Technical Metrics**

- ✅ **Build Success**: 100% successful builds across all packages
- ✅ **Type Safety**: Zero TypeScript compilation errors
- ✅ **Test Coverage**: >95% test coverage for enterprise features
- ✅ **Performance**: <50ms for simple operations, <200ms for complex operations

### **Functional Metrics**

- ✅ **RBAC System**: Enforces permissions correctly across all operations
- ✅ **Organization Management**: Supports multi-tenant organizations with proper isolation
- ✅ **Template Marketplace**: Enables template sharing and discovery
- ✅ **Performance**: Meets enterprise scalability requirements

---

## Phase 5 Completion Checklist

- [ ] Implement complete RBAC system
- [ ] Build organization management system
- [ ] Create scenario templates and marketplace
- [ ] Implement advanced performance optimization
- [ ] Add query optimization and indexing
- [ ] Write comprehensive tests for enterprise features
- [ ] Test multi-tenant organization scenarios
- [ ] Run `pnpm build` and fix all errors
- [ ] Verify all enterprise features work correctly
- [ ] Test security and permission enforcement
- [ ] Create enterprise deployment documentation
- [ ] Demonstrate enterprise-ready automation platform

**Phase 5 is complete when all items above are checked, `pnpm build` runs successfully with no errors, and the platform demonstrates enterprise-ready capabilities with proper security, multi-tenancy, and performance optimization.**
