// @ts-nocheck
/**
 * GraphQL Data Source Provider
 * High-performance data fetching using GraphQL instead of WordPress REST API
 *
 * Why import queries instead of inline strings?
 * 1. ✅ Type safety - queries are validated by codegen
 * 2. ✅ Reusability - same query used by React hooks and direct fetches
 * 3. ✅ Maintainability - single source of truth for each query
 * 4. ✅ Fragment support - automatic fragment composition
 * 5. ✅ IDE support - better autocomplete and error checking
 *
 * @package theme-boilerplate
 */

import {
  GET_GRAPHQL_CONTENT_TYPES,
  GET_GRAPHQL_ROLES,
  GET_GRAPHQL_TAXONOMIES,
  GET_GRAPHQL_TAXONOMY_TERMS,
  GET_GRAPHQL_USERS,
} from "@/lib/graphql/system/queries";

import { GET_GENERIC_CONTENT } from "@/lib/graphql/common/queries";
// Import the query documents from our centralized definitions
// These queries use fragments and are validated by GraphQL Code Generator
// import { GET_GROUPS } from "@/lib/graphql/groups/queries"; // Disabled: group not in GraphQL schema yet
import { graphqlClient } from "@/lib/graphql-client";
import { log } from "@/lib/logging";

const USER_ORDER_BY_OPTIONS = [
  { label: "Display Name (Public)", value: "DISPLAY_NAME" },
  { label: "Nice Name (Slug)", value: "NICE_NAME" },
  { label: "Registered Date", value: "REGISTERED" },
  { label: "Login (Username)", value: "LOGIN" },
  { label: "Email", value: "EMAIL" },
];

const USER_ORDER_BY_VALUES = new Set(USER_ORDER_BY_OPTIONS.map((option) => option.value));

/**
 * Helper function to fetch categories that match a specific meta query
 * Uses the wp-graphql-term-meta-query plugin
 *
 * @param {string} metaKey - The meta key to search for
 * @param {string} metaValue - The meta value to match
 * @param {string} compare - GraphQL comparison operator (default: "EQUAL_TO")
 * @param {string} type - GraphQL meta type (default: "CHAR")
 * @returns {Promise<number[]>} - Array of category IDs that match the meta query
 */
const fetchCategoriesWithMeta = async (metaKey, metaValue, compare = "EQUAL_TO", type = "CHAR") => {
  if (!metaKey || !metaKey.trim()) {
    log("fetchCategoriesWithMeta: No meta key provided", "warn", {
      context: "graphQLDataSource",
    });
    return [];
  }

  const graphqlEndpoint = `${window.location.origin}/graphql`;

  // Build the meta query arguments
  const metaQueryArgs = {
    metaArray: [
      {
        key: metaKey.trim(),
        ...(metaValue && metaValue.trim() ? { value: metaValue.trim() } : {}),
        ...(compare ? { compare } : {}),
        ...(type && type !== "CHAR" ? { type } : {}),
      },
    ],
  };

  const CATEGORY_META_QUERY = `
    query GetCategoriesWithMeta($metaQuery: RootQueryToCategoryConnectionWhereArgsMetaQuery) {
      categories(where: { metaQuery: $metaQuery } first: 500) {
        edges {
          node {
            databaseId
            name
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: CATEGORY_META_QUERY,
        variables: {
          metaQuery: metaQueryArgs,
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      log("GraphQL errors fetching categories with meta", "error", {
        context: "graphQLDataSource",
        data: { errors: data.errors, metaKey, metaValue, compare, type },
      });
      return [];
    }

    const categoryIds = data.data?.categories?.edges?.map((edge) => edge.node.databaseId) || [];

    log("Fetched categories with meta", "info", {
      context: "graphQLDataSource",
      data: {
        metaKey,
        metaValue,
        compare,
        type,
        count: categoryIds.length,
        categoryIds,
      },
    });

    return categoryIds;
  } catch (error) {
    log("Failed to fetch categories with meta", "error", {
      context: "graphQLDataSource",
      data: { error, metaKey, metaValue, compare, type },
    });
    return [];
  }
};

export const graphQLDataSource = {
  label: "GraphQL (Fast)",

  // Fields to inject when this data source is selected
  getFields: (data) => {
    const currentFilters = data?.props?.gql_filters || {};
    const dataType = data?.props?.gql_settings?.gql_data_type || "post_type";

    const filterTypeOptions = {
      post_type: [
        { label: "None", value: "none" },
        { label: "Categories", value: "categories" },
        { label: "Category Meta", value: "category_meta" },
        { label: "Content Type", value: "content_type" },
        { label: "Post Meta", value: "post_meta" },
      ],
      users: [
        { label: "None", value: "none" },
        { label: "Role", value: "role" },
        { label: "Search Keyword", value: "search" },
      ],
      taxonomies: [
        { label: "None", value: "none" },
        { label: "Search", value: "search" },
        { label: "Include IDs", value: "ids" },
      ],
    };

    const createFilterFields = (filterNum) => {
      const prefix = `filter${filterNum}_`;
      const filterType = currentFilters[`${prefix}type`] || "none";

      const fields = {
        [`${prefix}type`]: {
          type: "select",
          label: `Filter ${filterNum} Type`,
          options: filterTypeOptions[dataType] || filterTypeOptions.post_type,
        },
      };

      if (dataType === "post_type") {
        if (filterType === "categories") {
          fields[`${prefix}categories`] = {
            type: "external",
            label: `Filter ${filterNum} Categories`,
            placeholder: "Select categories...",
            multiple: true,
            fetchList: async ({ query }) => {
              try {
                const nonce = window.themeBoilerplateData?.nonce;
                let allCategories = [];
                let page = 1;
                let hasMore = true;

                while (hasMore) {
                  const response = await fetch(
                    `${
                      window.location.origin
                    }/wp-json/wp/v2/categories?per_page=100&page=${page}&search=${query || ""}`,
                    {
                      headers: {
                        "X-WP-Nonce": nonce,
                      },
                    }
                  );

                  if (!response.ok) break;

                  const categories = await response.json();
                  allCategories = [...allCategories, ...categories];

                  const totalPages = response.headers.get("X-WP-TotalPages");
                  hasMore = totalPages && page < parseInt(totalPages);
                  page++;
                }

                return allCategories.map((cat) => ({ title: cat.name, value: cat.id }));
              } catch (error) {
                log("Failed to fetch categories for GraphQL filters", "error", {
                  context: "graphQLDataSource",
                  error,
                });
                return [];
              }
            },
            getItemSummary: (item) => item?.title || item,
          };

          fields[`${prefix}operator`] = {
            type: "radio",
            label: `Filter ${filterNum} Operator`,
            options: [
              { label: "Include", value: "include" },
              { label: "Exclude", value: "exclude" },
            ],
          };

          fields[`${prefix}mode`] = {
            type: "radio",
            label: `Filter ${filterNum} Mode`,
            options: [
              { label: "OR (any selected category)", value: "or" },
              { label: "AND (must have all selected categories)", value: "and" },
            ],
          };
        }

        if (filterType === "content_type") {
          fields[`${prefix}content_types`] = {
            type: "external",
            label: `Filter ${filterNum} Content Types`,
            placeholder: "Select content types...",
            multiple: true,
            fetchList: async ({ query }) => {
              try {
                const nonce = window.themeBoilerplateData?.nonce;
                let allContentTypes = [];
                let page = 1;
                let hasMore = true;

                while (hasMore) {
                  const response = await fetch(
                    `${
                      window.location.origin
                    }/wp-json/wp/v2/post_content_type?per_page=100&page=${page}&search=${
                      query || ""
                    }`,
                    {
                      headers: {
                        "X-WP-Nonce": nonce,
                      },
                    }
                  );

                  if (!response.ok) break;

                  const contentTypes = await response.json();
                  allContentTypes = [...allContentTypes, ...contentTypes];

                  const totalPages = response.headers.get("X-WP-TotalPages");
                  hasMore = totalPages && page < parseInt(totalPages);
                  page++;
                }

                return allContentTypes.map((ct) => ({ title: ct.name, value: ct.slug }));
              } catch (error) {
                log("Failed to fetch content types for GraphQL filters", "error", {
                  context: "graphQLDataSource",
                  error,
                });
                return [];
              }
            },
            getItemSummary: (item) => item?.title || item,
          };

          fields[`${prefix}operator`] = {
            type: "radio",
            label: `Filter ${filterNum} Operator`,
            options: [
              { label: "Include", value: "include" },
              { label: "Exclude", value: "exclude" },
            ],
          };
        }

        if (filterType === "category_meta") {
          fields[`${prefix}category_meta_key`] = {
            type: "text",
            label: `Filter ${filterNum} Category Meta Key`,
            placeholder: "e.g. show_on_download_page, featured, order",
          };

          fields[`${prefix}category_meta_value`] = {
            type: "text",
            label: `Filter ${filterNum} Category Meta Value`,
            placeholder: "e.g. 1, true, active",
          };

          fields[`${prefix}category_meta_compare`] = {
            type: "select",
            label: `Filter ${filterNum} Compare Operator`,
            options: [
              { label: "Equals (EQUAL_TO)", value: "EQUAL_TO" },
              { label: "Not Equals (NOT_EQUAL_TO)", value: "NOT_EQUAL_TO" },
              { label: "Greater Than (GREATER_THAN)", value: "GREATER_THAN" },
              {
                label: "Greater or Equal (GREATER_THAN_OR_EQUAL_TO)",
                value: "GREATER_THAN_OR_EQUAL_TO",
              },
              { label: "Less Than (LESS_THAN)", value: "LESS_THAN" },
              { label: "Less or Equal (LESS_THAN_OR_EQUAL_TO)", value: "LESS_THAN_OR_EQUAL_TO" },
              { label: "Like (LIKE)", value: "LIKE" },
              { label: "Not Like (NOT_LIKE)", value: "NOT_LIKE" },
              { label: "Exists (EXISTS)", value: "EXISTS" },
              { label: "Not Exists (NOT_EXISTS)", value: "NOT_EXISTS" },
            ],
          };

          fields[`${prefix}category_meta_type`] = {
            type: "select",
            label: `Filter ${filterNum} Meta Type`,
            options: [
              { label: "String (CHAR)", value: "CHAR" },
              { label: "Number (NUMERIC)", value: "NUMERIC" },
              { label: "Integer (SIGNED)", value: "SIGNED" },
              { label: "Decimal (DECIMAL)", value: "DECIMAL" },
              { label: "Date (DATE)", value: "DATE" },
              { label: "DateTime (DATETIME)", value: "DATETIME" },
              { label: "Time (TIME)", value: "TIME" },
            ],
          };
        }

        if (filterType === "post_meta") {
          fields[`${prefix}meta_key`] = {
            type: "text",
            label: `Filter ${filterNum} Meta Key`,
            placeholder: "e.g. related_districts, featured, status",
          };

          fields[`${prefix}meta_value`] = {
            type: "textarea",
            label: `Filter ${filterNum} Meta Value`,
            placeholder: "Static: 1, active, 100\nDynamic: {{current_post_id}}",
          };

          fields[`${prefix}meta_compare`] = {
            type: "select",
            label: `Filter ${filterNum} Compare Operator`,
            options: [
              { label: "Equals (=)", value: "=" },
              { label: "Not Equals (!=)", value: "!=" },
              { label: "Greater Than (>)", value: ">" },
              { label: "Greater or Equal (>=)", value: ">=" },
              { label: "Less Than (<)", value: "<" },
              { label: "Less or Equal (<=)", value: "<=" },
              { label: "Like", value: "LIKE" },
              { label: "Not Like", value: "NOT LIKE" },
              { label: "Exists", value: "EXISTS" },
              { label: "Not Exists", value: "NOT EXISTS" },
            ],
          };

          fields[`${prefix}meta_type`] = {
            type: "select",
            label: `Filter ${filterNum} Meta Type`,
            options: [
              { label: "Text (CHAR)", value: "CHAR" },
              { label: "Number (NUMERIC)", value: "NUMERIC" },
              { label: "Date (DATE)", value: "DATE" },
              { label: "DateTime (DATETIME)", value: "DATETIME" },
              { label: "Decimal (DECIMAL)", value: "DECIMAL" },
              { label: "Signed Integer (SIGNED)", value: "SIGNED" },
              { label: "Unsigned Integer (UNSIGNED)", value: "UNSIGNED" },
            ],
          };
        }
      }

      if (dataType === "users") {
        if (filterType === "role") {
          fields[`${prefix}roles`] = {
            type: "external",
            label: `Filter ${filterNum} Roles`,
            multiple: true,
            placeholder: "Select roles...",
            fetchList: async ({ query }) => {
              const options = await graphQLDataSource.__loadRoleOptions();
              if (!query) {
                return options;
              }
              return options.filter((option) =>
                option.title.toLowerCase().includes(query.toLowerCase())
              );
            },
            getItemSummary: (item) => item?.title || item,
          };
        }

        if (filterType === "search") {
          fields[`${prefix}search`] = {
            type: "text",
            label: `Filter ${filterNum} Search Keyword`,
            placeholder: "Search display name, username, email...",
          };
        }
      }

      if (dataType === "taxonomies") {
        if (filterType === "search") {
          fields[`${prefix}search`] = {
            type: "text",
            label: `Filter ${filterNum} Search Keyword`,
            placeholder: "Search term name or description...",
          };
        }

        if (filterType === "ids") {
          fields[`${prefix}ids`] = {
            type: "textarea",
            label: `Filter ${filterNum} Term IDs`,
            placeholder: "Comma-separated IDs: 12, 34, 56",
          };
        }
      }

      return fields;
    };

    const fetchPostTypeOptions = async () => {
      try {
        const options = await graphQLDataSource.__loadContentTypeOptions();
        if (options.length > 0) {
          return options;
        }
      } catch (error) {
        log("Failed to fetch GraphQL content types", "error", {
          context: "graphQLDataSource",
          error,
        });
      }

      try {
        const options = await graphQLDataSource.__fallbackContentTypeOptions();
        return options.length > 0
          ? options
          : [
              { title: "Districts", value: "district" },
              { title: "Downloads", value: "download" },
              { title: "Slides", value: "slide" },
            ];
      } catch (error) {
        log("Failed to fetch REST post types", "error", {
          context: "graphQLDataSource",
          error,
        });

        return [
          { title: "Districts", value: "district" },
          { title: "Downloads", value: "download" },
          { title: "Slides", value: "slide" },
        ];
      }
    };

    const fetchTaxonomyOptions = async ({ query }) => {
      const options = await graphQLDataSource.__loadTaxonomyOptions();
      if (!query) {
        return options;
      }
      return options.filter((option) => option.title.toLowerCase().includes(query.toLowerCase()));
    };

    const fetchRoleOptions = async ({ query }) => {
      const options = await graphQLDataSource.__loadRoleOptions();
      if (!query) {
        return options;
      }
      return options.filter((option) => option.title.toLowerCase().includes(query.toLowerCase()));
    };

    const baseSettingsFields = {
      gql_data_type: {
        type: "select",
        label: "Data Type",
        options: [
          { label: "Post Type", value: "post_type" },
          { label: "Users", value: "users" },
          { label: "Taxonomies", value: "taxonomies" },
        ],
      },
    };

    const settingsByType = {
      post_type: {
        gql_post_type: {
          type: "external",
          label: "Post Type",
          fetchList: fetchPostTypeOptions,
        },
        gql_specific_ids: {
          type: "textarea",
          label: "Specific Post IDs (Optional)",
          placeholder:
            "Enter comma-separated post IDs: 123, 456, 789\nLeave empty to query all posts",
        },
        gql_posts_per_page: {
          type: "number",
          label: "Posts Per Page",
          min: 1,
          max: 500,
        },
        gql_order: {
          type: "select",
          label: "Order",
          options: [
            { label: "Ascending", value: "ASC" },
            { label: "Descending", value: "DESC" },
          ],
        },
        gql_orderby: {
          type: "select",
          label: "Order By",
          options: [
            { label: "Date", value: "DATE" },
            { label: "Title", value: "TITLE" },
            { label: "Menu Order", value: "MENU_ORDER" },
          ],
        },
      },
      users: {
        gql_user_specific_ids: {
          type: "textarea",
          label: "Specific User IDs (Optional)",
          placeholder: "Comma-separated user IDs",
        },
        gql_users_per_page: {
          type: "number",
          label: "Users Per Page",
          min: 1,
          max: 200,
        },
        gql_user_order: {
          type: "select",
          label: "Order",
          options: [
            { label: "Ascending", value: "ASC" },
            { label: "Descending", value: "DESC" },
          ],
        },
        gql_user_orderby: {
          type: "select",
          label: "Order By",
          options: USER_ORDER_BY_OPTIONS,
        },
      },
      taxonomies: {
        gql_taxonomy: {
          type: "external",
          label: "Taxonomy",
          fetchList: fetchTaxonomyOptions,
        },
        gql_taxonomy_specific_ids: {
          type: "textarea",
          label: "Specific Term IDs (Optional)",
          placeholder: "Comma-separated term IDs",
        },
        gql_terms_per_page: {
          type: "number",
          label: "Terms Per Page",
          min: 1,
          max: 500,
        },
      },
    };

    const groupingOptionsMap = {
      post_type: [
        { label: "Category", value: "category" },
        { label: "Tag", value: "tag" },
        { label: "Author", value: "author" },
        { label: "Content Type", value: "content_type" },
      ],
      users: [
        { label: "Role", value: "role" },
        { label: "First Letter", value: "first_letter" },
      ],
      taxonomies: [
        { label: "Parent Term", value: "parent" },
        { label: "First Letter", value: "first_letter" },
      ],
    };

    const groupingFields = {
      enabled: {
        type: "radio",
        label: "Enable Grouping",
        options: [
          { label: "No", value: false },
          { label: "Yes", value: true },
        ],
      },
    };

    if (data?.props?.gql_grouping?.enabled) {
      groupingFields.display_type = {
        type: "select",
        label: "Display Type",
        options: [
          { label: "Default (List with Headings)", value: "default" },
          { label: "Cards (Grouped in Cards)", value: "cards" },
          { label: "Accordion (Collapsible Groups)", value: "accordion" },
        ],
      };

      groupingFields.group_by = {
        type: "select",
        label: "Group By (Level 1)",
        options: groupingOptionsMap[dataType] || groupingOptionsMap.post_type,
      };

      if (dataType === "post_type") {
        groupingFields.group_by_2 = {
          type: "select",
          label: "Group By (Level 2 - Optional)",
          options: [{ label: "None", value: "none" }, ...groupingOptionsMap.post_type],
        };
      }

      groupingFields.show_group_titles = {
        type: "radio",
        label: "Show Group Titles",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      };

      groupingFields.sort_groups = {
        type: "select",
        label: "Sort Groups",
        options: [
          { label: "Alphabetically", value: "alphabetical" },
          { label: "By Count (Descending)", value: "count_desc" },
          { label: "By Count (Ascending)", value: "count_asc" },
        ],
      };

      groupingFields.group_columns = {
        type: "select",
        label: "Columns Within Groups",
        options: [
          { label: "1 Column", value: "1" },
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
          { label: "5 Columns", value: "5" },
          { label: "6 Columns", value: "6" },
        ],
      };
    }

    return {
      gql_settings: {
        type: "object",
        label: "⚡ GraphQL Settings",
        objectFields: {
          ...baseSettingsFields,
          ...(settingsByType[dataType] || settingsByType.post_type),
        },
      },
      gql_grouping: {
        type: "object",
        label: "📊 Grouping Settings",
        objectFields: groupingFields,
      },
      gql_filters: {
        type: "object",
        label: "🔍 Filters",
        objectFields: {
          ...createFilterFields(1),
          ...createFilterFields(2),
          ...createFilterFields(3),
          ...createFilterFields(4),
          ...createFilterFields(5),
        },
      },
    };
  },

  // Default values
  getDefaultProps: () => ({
    gql_settings: {
      gql_data_type: "post_type",
      gql_post_type: "district",
      gql_posts_per_page: 10,
      gql_order: "DESC",
      gql_orderby: "DATE",
      gql_users_per_page: 20,
      gql_user_order: "DESC",
      gql_user_orderby: "DISPLAY_NAME",
      gql_terms_per_page: 50,
      gql_taxonomy: "category",
    },
    gql_grouping: {
      enabled: false,
      display_type: "default",
      group_by: "category",
      group_by_2: "none",
      show_group_titles: true,
      sort_groups: "alphabetical",
      group_columns: "3",
    },
    gql_filters: {
      filter1_type: "none",
      filter2_type: "none",
      filter3_type: "none",
      filter4_type: "none",
      filter5_type: "none",
    },
  }),

  // Fetch data using GraphQL
  fetchData: async (props) => {
    const settings = props.gql_settings || {};
    const dataType = settings.gql_data_type || "post_type";

    if (dataType === "users") {
      return graphQLDataSource.__fetchUsers(props);
    }

    if (dataType === "taxonomies") {
      return graphQLDataSource.__fetchTaxonomyTerms(props);
    }

    // Handle external field format: extract value from {title, value} object
    let postType = settings.gql_post_type || "district";
    if (typeof postType === "object" && postType !== null) {
      postType = postType.value || postType.label || "district";
    }

    const first = settings.gql_posts_per_page || 10;
    const order = settings.gql_order || "DESC";
    const orderBy = settings.gql_orderby || "DATE";
    const filters = props.gql_filters || {};

    try {
      const contentTypeInfo = await graphQLDataSource.__getContentTypeInfo(postType);

      if (!contentTypeInfo?.enumName) {
        throw new Error(
          `Post type "${postType}" is not registered with WPGraphQL. Enable GraphQL support for this content type.`
        );
      }

      const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

      log(`Fetching ${first} ${postType}(s) via GraphQL`, "info", {
        context: "graphQLDataSource",
        data: {
          postType,
          enumName: contentTypeInfo.enumName,
          first,
          order,
          orderBy,
        },
      });

      const where = {
        orderby: [
          {
            field: orderBy,
            order: order,
          },
        ],
      };

      // Handle specific post IDs if provided
      const specificIds = settings?.gql_specific_ids;
      if (specificIds && typeof specificIds === "string" && specificIds.trim()) {
        const ids = specificIds
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id && !isNaN(parseInt(id)))
          .map((id) => parseInt(id));

        if (ids.length > 0) {
          where.in = ids;
          log("Applying specific post IDs filter", "info", {
            context: "graphQLDataSource",
            data: { postIds: ids },
          });
        }
      }

      const categoryIn = new Set(); // OR mode - include any
      const categoryNotIn = new Set(); // OR mode - exclude any
      const categoryInAnd = []; // AND mode - include all (array of single IDs)
      const categoryNotInAnd = []; // AND mode - exclude all (array of single IDs)
      const contentTypeIn = new Set();
      const contentTypeNotIn = new Set();
      const metaQueries = [];

      const normalizeIds = (items) => {
        if (!items) return [];
        const array = Array.isArray(items) ? items : [items];
        return array
          .map((item) => {
            if (item == null) return null;
            if (typeof item === "object") {
              if (item.value !== undefined) return String(item.value);
              if (item.id !== undefined) return String(item.id);
            }
            if (typeof item === "string" || typeof item === "number") {
              const value = String(item).trim();
              return value.length ? value : null;
            }
            return null;
          })
          .filter(Boolean);
      };

      for (let i = 1; i <= 5; i++) {
        const type = filters[`filter${i}_type`];

        if (type === "categories") {
          const selectedIds = normalizeIds(filters[`filter${i}_categories`]);
          if (!selectedIds.length) continue;

          const operator = filters[`filter${i}_operator`] || "include";
          const mode = filters[`filter${i}_mode`] || "or";

          if (operator === "include") {
            if (mode === "and") {
              // AND mode: Each category gets its own query
              selectedIds.forEach((id) => categoryInAnd.push(id));
            } else {
              // OR mode: All categories in one query
              selectedIds.forEach((id) => categoryIn.add(id));
            }
          } else {
            if (mode === "and") {
              // AND mode: Each category gets its own query
              selectedIds.forEach((id) => categoryNotInAnd.push(id));
            } else {
              // OR mode: All categories in one query
              selectedIds.forEach((id) => categoryNotIn.add(id));
            }
          }
        }

        if (type === "category_meta") {
          const metaKey = filters[`filter${i}_category_meta_key`];
          if (!metaKey || !metaKey.trim()) continue;

          const metaValue = filters[`filter${i}_category_meta_value`];
          const metaCompare = filters[`filter${i}_category_meta_compare`] || "EQUAL_TO";
          const metaType = filters[`filter${i}_category_meta_type`] || "CHAR";

          // Fetch categories that match the meta query
          const categoryIds = await fetchCategoriesWithMeta(
            metaKey.trim(),
            metaValue ? metaValue.trim() : "",
            metaCompare,
            metaType
          );

          // Add the fetched category IDs to the categoryIn filter (OR mode)
          if (categoryIds.length > 0) {
            categoryIds.forEach((id) => categoryIn.add(id));

            log("Applying category meta filter", "info", {
              context: "graphQLDataSource",
              data: {
                metaKey,
                metaValue,
                metaCompare,
                metaType,
                categoryIds,
                count: categoryIds.length,
              },
            });
          } else {
            log("No categories found matching meta query", "warn", {
              context: "graphQLDataSource",
              data: { metaKey, metaValue, metaCompare, metaType },
            });
          }
        }

        if (type === "content_type") {
          const selectedSlugs = normalizeIds(filters[`filter${i}_content_types`]);
          if (!selectedSlugs.length) continue;

          const operator = filters[`filter${i}_operator`] || "include";
          if (operator === "include") {
            selectedSlugs.forEach((slug) => contentTypeIn.add(slug));
          } else {
            selectedSlugs.forEach((slug) => contentTypeNotIn.add(slug));
          }
        }

        if (type === "post_meta") {
          const metaKey = filters[`filter${i}_meta_key`];
          if (!metaKey || !metaKey.trim()) continue;

          const metaQuery = {
            key: metaKey.trim(),
          };

          // Add value if provided (not needed for EXISTS/NOT EXISTS)
          let metaValue = filters[`filter${i}_meta_value`];
          if (metaValue && metaValue.trim()) {
            metaValue = metaValue.trim();

            // Replace dynamic placeholders
            // {{current_post_id}} - The current page/post ID
            if (metaValue.includes("{{current_post_id}}")) {
              const currentPostId =
                window.themeBoilerplateData?.postId ||
                window.themeBoilerplateData?.currentPostId ||
                "";
              metaValue = metaValue.replace(/\{\{current_post_id\}\}/g, String(currentPostId));

              log("Replaced {{current_post_id}} placeholder", "info", {
                context: "graphQLDataSource",
                data: { originalValue: filters[`filter${i}_meta_value`], resolvedValue: metaValue },
              });
            }

            metaQuery.value = metaValue;
          }

          // Add compare operator (default: =)
          const metaCompare = filters[`filter${i}_meta_compare`] || "=";
          if (metaCompare) {
            metaQuery.compare = metaCompare;
          }

          // Add type for numeric/date comparisons (default: CHAR)
          const metaType = filters[`filter${i}_meta_type`];
          if (metaType && metaType !== "CHAR") {
            metaQuery.type = metaType;
          }

          metaQueries.push(metaQuery);
        }
      }

      // Handle OR mode categories (existing behavior)
      if (categoryIn.size > 0) {
        where.categoryIn = Array.from(categoryIn);
      }
      if (categoryNotIn.size > 0) {
        where.categoryNotIn = Array.from(categoryNotIn);
      }

      // Handle AND mode categories (new behavior)
      if (categoryInAnd.length > 0) {
        where.categoryInAnd = categoryInAnd;
        log("Applying category filter (include AND mode)", "info", {
          context: "graphQLDataSource",
          data: { categoryIds: categoryInAnd },
        });
      }
      if (categoryNotInAnd.length > 0) {
        where.categoryNotInAnd = categoryNotInAnd;
        log("Applying category filter (exclude AND mode)", "info", {
          context: "graphQLDataSource",
          data: { categoryIds: categoryNotInAnd },
        });
      }

      // Handle content type filtering
      // GraphQL postContentType now supports multiple values (array of slugs)
      if (contentTypeIn.size > 0) {
        where.postContentType = Array.from(contentTypeIn);

        log("Applying content type filter (include)", "info", {
          context: "graphQLDataSource",
          data: { contentTypes: Array.from(contentTypeIn) },
        });
      }

      // Note: contentTypeNotIn (exclude mode) is not natively supported in GraphQL schema
      // We implement client-side filtering after fetching the data
      if (contentTypeNotIn.size > 0) {
        log("Content type exclusion will be applied via client-side filtering", "info", {
          context: "graphQLDataSource",
          data: { excludeContentTypes: Array.from(contentTypeNotIn) },
        });
      }

      // Handle post meta filtering
      if (metaQueries.length > 0) {
        where.metaQuery = metaQueries;

        log("Applying post meta filter", "info", {
          context: "graphQLDataSource",
          data: { metaQueries },
        });
      }

      const variables = {
        first,
        where: {
          ...where,
          contentTypes: [contentTypeInfo.enumName],
        },
      };

      const response = await graphqlClient.request(GET_GENERIC_CONTENT, variables);
      const data = response?.contentNodes;

      const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      const duration = Math.round(endTime - startTime);

      log(`GraphQL fetch completed in ${duration}ms`, "info", {
        context: "graphQLDataSource",
        data: {
          postType,
          enumName: contentTypeInfo.enumName,
          count: data?.nodes?.length || 0,
          duration,
        },
      });

      // Transform GraphQL data to match the format expected by LoopGridBlock
      const transformedData = (data?.nodes || []).map((node) => {
        // Extract format from postContentTypes taxonomy (e.g., "link", "video", "quote")
        const contentTypeNodes = node.postContentTypes?.nodes || [];
        const format = contentTypeNodes.length > 0 ? contentTypeNodes[0].slug : "standard";

        return {
          id: node.databaseId,
          title: node.title || "",
          excerpt: node.excerpt || "",
          content: node.content || "", // Full HTML content from GraphQL
          link: node.uri || "",
          date: "", // Can add if needed
          image: node.featuredImage?.node?.sourceUrl || null,
          featured_media_url: node.featuredImage?.node?.sourceUrl || null,
          format,
          _raw: node,
        };
      });

      log(`Transformed ${transformedData.length} items`, "info", {
        context: "graphQLDataSource",
      });

      // Apply client-side content type exclusion filter (if GraphQL doesn't support it)
      let filteredData = transformedData;
      if (contentTypeNotIn.size > 0) {
        const excludeSlugs = Array.from(contentTypeNotIn);
        filteredData = transformedData.filter((item) => {
          // Check if item has this content type
          const contentTypeNodes = item._raw?.postContentTypes?.nodes || [];
          const itemContentTypes = contentTypeNodes.map((ct) => ct.slug);

          // Exclude if item has any of the excluded content types
          const hasExcludedType = itemContentTypes.some((slug) => excludeSlugs.includes(slug));
          return !hasExcludedType;
        });

        log(
          `Client-side filtered ${
            transformedData.length - filteredData.length
          } items by content type exclusion`,
          "info",
          {
            context: "graphQLDataSource",
            data: {
              excludeContentTypes: excludeSlugs,
              before: transformedData.length,
              after: filteredData.length,
            },
          }
        );
      }

      // Return data with metadata about filtered categories
      // This helps with grouping - we only want to show groups for filtered categories
      return {
        items: filteredData,
        _filteredCategoryIds: Array.from(categoryIn), // Categories that passed the filter
      };
    } catch (error) {
      log("GraphQL fetch failed", "error", {
        context: "graphQLDataSource",
        data: { error: error.message },
      });
      console.error("[GraphQL Data Source] Error:", error);
      return [];
    }
  },
};

// --- Internal helpers ----------------------------------------------------

const contentTypeMetaCache = new Map();
let contentTypeOptionsCache = null;
let contentTypeOptionsPromise = null;
const taxonomyMetaCache = new Map();
let taxonomyOptionsCache = null;
let taxonomyOptionsPromise = null;
let roleOptionsCache = null;
let roleOptionsPromise = null;

const toEnumName = (slug) =>
  String(slug || "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();

graphQLDataSource.__contentTypeMetaCache = contentTypeMetaCache;

graphQLDataSource.__loadContentTypeOptions = async function loadContentTypeOptions() {
  if (contentTypeOptionsCache) {
    return contentTypeOptionsCache;
  }

  if (contentTypeOptionsPromise) {
    return contentTypeOptionsPromise;
  }

  contentTypeOptionsPromise = (async () => {
    try {
      const response = await graphqlClient.request(GET_GRAPHQL_CONTENT_TYPES);
      const nodes = response?.contentTypes?.nodes || [];

      const options = nodes
        .filter((node) => node?.name)
        .map((node) => {
          const slug = node.name;
          const title =
            node?.labels?.singularName ||
            node?.labels?.name ||
            node?.graphqlSingleName ||
            node?.graphqlPluralName ||
            slug;

          const meta = {
            slug,
            enumName: toEnumName(slug),
            graphqlSingleName: node?.graphqlSingleName,
            graphqlPluralName: node?.graphqlPluralName,
            hasArchive: Boolean(node?.hasArchive),
          };

          contentTypeMetaCache.set(slug, meta);

          return {
            title,
            value: slug,
          };
        })
        .filter((option) => option.title && option.value)
        .sort((a, b) => a.title.localeCompare(b.title));

      contentTypeOptionsCache = options;
      contentTypeOptionsPromise = null;
      return options;
    } catch (error) {
      contentTypeOptionsPromise = null;
      throw error;
    }
  })();

  return contentTypeOptionsPromise;
};

graphQLDataSource.__fallbackContentTypeOptions = async function fallbackContentTypeOptions() {
  try {
    const restUrl = window.location.origin + "/wp-json/wp/v2";
    const nonce = window.themeBoilerplateData?.nonce;
    const response = await fetch(`${restUrl}/types`, {
      headers: {
        "X-WP-Nonce": nonce,
      },
    });

    if (!response.ok) {
      throw new Error(`REST types request failed with status ${response.status}`);
    }

    const types = await response.json();

    const options = Object.entries(types)
      .filter(([slug]) => slug && typeof slug === "string")
      .map(([slug, type]) => {
        const title = type?.name || slug;
        const meta = {
          slug,
          enumName: toEnumName(slug),
          graphqlSingleName: type?.name,
          graphqlPluralName: type?.labels?.name,
          hasArchive: Boolean(type?.has_archive),
        };
        contentTypeMetaCache.set(slug, meta);

        return {
          title,
          value: slug,
        };
      })
      .filter((option) => option.title && option.value)
      .sort((a, b) => a.title.localeCompare(b.title));

    contentTypeOptionsCache = options;
    return options;
  } catch (error) {
    log("Failed to build fallback GraphQL post type options", "error", {
      context: "graphQLDataSource",
      error,
    });
    return [];
  }
};

graphQLDataSource.__getContentTypeInfo = async function getContentTypeInfo(postType) {
  if (!contentTypeMetaCache.has(postType)) {
    try {
      await graphQLDataSource.__loadContentTypeOptions();
    } catch (error) {
      // Ignore – we will fall back to enum conversion below
    }
  }

  if (!contentTypeMetaCache.has(postType)) {
    const fallbackMeta = {
      slug: postType,
      enumName: toEnumName(postType),
    };
    contentTypeMetaCache.set(postType, fallbackMeta);
  }

  return contentTypeMetaCache.get(postType);
};

graphQLDataSource.__loadRoleOptions = async function loadRoleOptions() {
  if (roleOptionsCache) {
    return roleOptionsCache;
  }

  if (roleOptionsPromise) {
    return roleOptionsPromise;
  }

  roleOptionsPromise = (async () => {
    try {
      const response = await graphqlClient.request(GET_GRAPHQL_ROLES);
      const nodes = response?.roles?.nodes || [];
      const options =
        nodes
          .filter((node) => node?.name)
          .map((node) => ({
            title: node.displayName || node.name,
            value: node.name,
          }))
          .sort((a, b) => a.title.localeCompare(b.title)) || [];

      roleOptionsCache = options;
      roleOptionsPromise = null;
      return options;
    } catch (error) {
      roleOptionsPromise = null;
      log("Failed to load GraphQL role options", "error", {
        context: "graphQLDataSource",
        error,
      });
      return [];
    }
  })();

  return roleOptionsPromise;
};

graphQLDataSource.__loadTaxonomyOptions = async function loadTaxonomyOptions() {
  if (taxonomyOptionsCache) {
    return taxonomyOptionsCache;
  }

  if (taxonomyOptionsPromise) {
    return taxonomyOptionsPromise;
  }

  taxonomyOptionsPromise = (async () => {
    try {
      const response = await graphqlClient.request(GET_GRAPHQL_TAXONOMIES);
      const nodes = response?.taxonomies?.nodes || [];

      const options =
        nodes
          .filter((node) => node?.name)
          .map((node) => {
            const slug = node.name;
            const title = node?.labels?.singularName || node?.labels?.name || slug;

            taxonomyMetaCache.set(slug, {
              slug,
              enumName: toEnumName(slug),
            });

            return {
              title,
              value: slug,
            };
          })
          .sort((a, b) => a.title.localeCompare(b.title)) || [];

      taxonomyOptionsCache = options;
      taxonomyOptionsPromise = null;
      return options;
    } catch (error) {
      taxonomyOptionsPromise = null;
      log("Failed to load GraphQL taxonomy options", "error", {
        context: "graphQLDataSource",
        error,
      });
      return [];
    }
  })();

  return taxonomyOptionsPromise;
};

graphQLDataSource.__getTaxonomyEnum = function getTaxonomyEnum(slug) {
  if (!slug) {
    return "CATEGORY";
  }

  if (!taxonomyMetaCache.has(slug)) {
    taxonomyMetaCache.set(slug, {
      slug,
      enumName: toEnumName(slug),
    });
  }

  return taxonomyMetaCache.get(slug).enumName;
};

graphQLDataSource.__fetchUsers = async function fetchUsers(props) {
  const settings = props.gql_settings || {};
  const filters = props.gql_filters || {};
  const first = settings.gql_users_per_page || 20;
  let order = settings.gql_user_order || "DESC";
  if (typeof order === "object" && order !== null) {
    order = order.value || order.label || "DESC";
  }
  if (order !== "ASC" && order !== "DESC") {
    order = "DESC";
  }

  let orderBy = settings.gql_user_orderby || "DISPLAY_NAME";
  if (typeof orderBy === "object" && orderBy !== null) {
    orderBy = orderBy.value || orderBy.label || orderBy.title || "DISPLAY_NAME";
  }
  if (orderBy === "NAME") {
    orderBy = "DISPLAY_NAME";
  }
  if (!USER_ORDER_BY_VALUES.has(orderBy)) {
    orderBy = "DISPLAY_NAME";
  }

  const where = {
    orderby: [
      {
        field: orderBy,
        order,
      },
    ],
  };

  const specificIds = settings.gql_user_specific_ids;
  if (specificIds && typeof specificIds === "string" && specificIds.trim()) {
    const ids = specificIds
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !Number.isNaN(id));
    if (ids.length > 0) {
      where.include = ids;
    }
  }

  for (let i = 1; i <= 5; i++) {
    const type = filters[`filter${i}_type`];
    if (type === "role") {
      const values = filters[`filter${i}_roles`];
      const roles = (Array.isArray(values) ? values : [values])
        .map((role) => {
          if (!role) return null;
          if (typeof role === "object") {
            return role.value || role.title || null;
          }
          return role;
        })
        .filter(Boolean)
        .map((role) => toEnumName(role));
      if (roles.length > 0) {
        where.roleIn = roles;
      }
    }

    if (type === "search") {
      const value = filters[`filter${i}_search`];
      if (value && value.trim()) {
        where.search = value.trim();
      }
    }
  }

  try {
    const response = await graphqlClient.request(GET_GRAPHQL_USERS, {
      first,
      where,
    });

    const nodes = response?.users?.nodes || [];
    return nodes.map((user) => ({
      id: user.databaseId,
      title: user.name || user.nicename || user.slug,
      excerpt: user.description || "",
      link: user.uri || "#",
      image: user.avatar?.url || null,
      featured_media_url: user.avatar?.url || null,
      format: "user",
      roles: user.roles?.nodes?.map((role) => role.name) || [],
      _raw: user,
    }));
  } catch (error) {
    log("GraphQL users fetch failed", "error", {
      context: "graphQLDataSource",
      data: { error: error.message },
    });
    return [];
  }
};

graphQLDataSource.__fetchTaxonomyTerms = async function fetchTaxonomyTerms(props) {
  const settings = props.gql_settings || {};
  const filters = props.gql_filters || {};
  let taxonomy = settings.gql_taxonomy || "category";
  if (typeof taxonomy === "object" && taxonomy !== null) {
    taxonomy = taxonomy.value || taxonomy.title || taxonomy.slug || "category";
  }

  const taxonomyEnum = graphQLDataSource.__getTaxonomyEnum(taxonomy);
  const first = settings.gql_terms_per_page || 50;

  let search = null;
  let includeIds = [];

  const parseIds = (value) => {
    if (!value || !value.trim()) {
      return [];
    }
    return value
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !Number.isNaN(id));
  };

  const specificIds = settings.gql_taxonomy_specific_ids;
  if (specificIds) {
    includeIds = parseIds(specificIds);
  }

  for (let i = 1; i <= 5; i++) {
    const type = filters[`filter${i}_type`];
    if (type === "search") {
      const value = filters[`filter${i}_search`];
      if (value && value.trim()) {
        search = value.trim();
      }
    }

    if (type === "ids") {
      const idsValue = filters[`filter${i}_ids`];
      if (idsValue) {
        includeIds = [...includeIds, ...parseIds(idsValue)];
      }
    }
  }

  const variables = {
    taxonomy: [taxonomyEnum],
    first,
  };

  if (search) {
    variables.search = search;
  }

  if (includeIds.length > 0) {
    variables.include = includeIds;
  }

  try {
    const response = await graphqlClient.request(GET_GRAPHQL_TAXONOMY_TERMS, variables);
    const nodes = response?.terms?.nodes || [];

    return nodes.map((term) => ({
      id: term.databaseId,
      title: term.name,
      excerpt: term.description || "",
      link: term.uri || "#",
      image: null,
      format: "taxonomy",
      count: term.count,
      parentId: term.parentDatabaseId || term.parent?.node?.databaseId || null,
      _raw: {
        ...term,
        taxonomy,
      },
    }));
  } catch (error) {
    log("GraphQL taxonomy fetch failed", "error", {
      context: "graphQLDataSource",
      data: { error: error.message },
    });
    return [];
  }
};
