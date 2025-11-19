// @ts-nocheck
/**
 * WordPress Data Source Provider
 * Provides data fetching and field configuration for WordPress content
 */
export const wordPressDataSource = {
  label: "WordPress",

  // Fields to inject when this data source is selected
  getFields: (data) => {
    // Helper to create filter fields for a given filter index
    const createFilterFields = (filterNum) => {
      const filterPrefix = `filter${filterNum}_`;
      const filterType = data?.props?.wp_settings?.[`${filterPrefix}type`] || "none";

      const fields = {
        [`${filterPrefix}type`]: {
          type: "select",
          label: `Filter ${filterNum} Type`,
          options: [
            { label: "None", value: "none" },
            { label: "Categories", value: "categories" },
            { label: "Content Type", value: "content_type" },
            { label: "Pods Relationship", value: "pods" },
          ],
        },
      };

      // Add category fields if this filter is set to categories
      if (filterType === "categories") {
        fields[`${filterPrefix}categories`] = {
          type: "external",
          label: `Filter ${filterNum} Categories`,
          placeholder: "Select categories...",
          fetchList: async ({ query }) => {
            try {
              const nonce = window.themeBoilerplateData?.nonce;
              let allCategories = [];
              let page = 1;
              let hasMore = true;

              // Fetch all pages (WP REST API limits to 100 per page)
              while (hasMore) {
                const response = await fetch(
                  `${
                    window.location.origin
                  }/wp-json/wp/v2/categories?per_page=100&page=${page}&search=${query || ""}`,
                  { headers: { "X-WP-Nonce": nonce } }
                );

                if (!response.ok) break;

                const categories = await response.json();
                allCategories = [...allCategories, ...categories];

                // Check if there are more pages
                const totalPages = response.headers.get("X-WP-TotalPages");
                hasMore = totalPages && page < parseInt(totalPages);
                page++;
              }

              return allCategories.map((cat) => ({ title: cat.name, value: cat.id }));
            } catch (error) {
              console.error("[WordPress DS] Error fetching categories:", error);
              return [];
            }
          },
          getItemSummary: (item) => item?.title || item,
        };

        fields[`${filterPrefix}operator`] = {
          type: "radio",
          label: `Filter ${filterNum} Operator`,
          options: [
            { label: "Include", value: "include" },
            { label: "Exclude", value: "exclude" },
          ],
        };
      }

      // Add content type fields if this filter is set to content_type
      if (filterType === "content_type") {
        fields[`${filterPrefix}content_types`] = {
          type: "external",
          label: `Filter ${filterNum} Content Types`,
          placeholder: "Select content types...",
          fetchList: async ({ query }) => {
            try {
              const nonce = window.themeBoilerplateData?.nonce;
              const baseUrl = window.location.origin;
              let allContentTypes = [];
              let page = 1;
              let hasMore = true;

              // Fetch all pages (WP REST API limits to 100 per page)
              while (hasMore) {
                const response = await fetch(
                  `${baseUrl}/wp-json/wp/v2/content_type?per_page=100&page=${page}&search=${
                    query || ""
                  }`,
                  {
                    headers: {
                      "X-WP-Nonce": nonce,
                    },
                  }
                );

                if (!response.ok) {
                  console.error(
                    `Error fetching content types: ${response.status} ${response.statusText}`
                  );
                  break;
                }

                const contentTypes = await response.json();

                // Validate that we got an array
                if (!Array.isArray(contentTypes)) {
                  console.error("Content types response is not an array:", contentTypes);
                  break;
                }

                allContentTypes = [...allContentTypes, ...contentTypes];

                // Check if there are more pages
                const totalPages = response.headers.get("X-WP-TotalPages");
                hasMore = totalPages && page < parseInt(totalPages);
                page++;
              }

              return allContentTypes.map((type) => ({
                label: type.name,
                value: type.id.toString(),
              }));
            } catch (error) {
              console.error("Error fetching content types:", error);
              return [];
            }
          },
        };

        fields[`${filterPrefix}operator`] = {
          type: "select",
          label: `Filter ${filterNum} Operator`,
          options: [
            { label: "Include", value: "include" },
            { label: "Exclude", value: "exclude" },
          ],
        };
      }

      // Add Pods fields if this filter is set to pods
      if (filterType === "pods") {
        fields[`${filterPrefix}pods_field`] = {
          type: "text",
          label: `Filter ${filterNum} Pods Field`,
          placeholder: "e.g., related_downloads",
        };

        fields[`${filterPrefix}pods_source`] = {
          type: "radio",
          label: `Filter ${filterNum} Source`,
          options: [
            { label: "Current Post", value: "current" },
            { label: "Specific Post ID", value: "specific" },
          ],
        };

        if (data?.props?.wp_settings?.[`${filterPrefix}pods_source`] === "specific") {
          fields[`${filterPrefix}pods_id`] = {
            type: "number",
            label: `Filter ${filterNum} Post ID`,
            placeholder: "Enter post ID",
          };
        }
      }

      return fields;
    };

    const baseObjectFields = {
      wp_post_type: {
        type: "external",
        label: "Post Type",
        fetchList: async () => {
          const restUrl = window.location.origin + "/wp-json/wp/v2";
          const nonce = window.themeBoilerplateData?.nonce;

          try {
            const response = await fetch(`${restUrl}/types`, {
              headers: {
                "X-WP-Nonce": nonce,
              },
            });

            if (!response.ok) {
              // console.error("[WordPress Data Source] Failed to fetch post types");
              return [
                { title: "Posts", value: "post" },
                { title: "Pages", value: "page" },
              ];
            }

            const types = await response.json();
            // console.log("[WordPress Data Source] Raw post types response:", types);

            // Filter to only public, non-attachment types
            const postTypeOptions = Object.entries(types)
              .filter(([slug, type]) => {
                // console.log(`[WordPress Data Source] Checking post type: ${slug}`, {
                //   viewable: type.viewable,
                //   show_in_rest: type.show_in_rest,
                //   rest_base: type.rest_base,
                // });

                // Check if post type is available in REST API and is viewable
                return (
                  type.show_in_rest !== false &&
                  type.viewable !== false &&
                  slug !== "attachment" &&
                  slug !== "wp_block" &&
                  slug !== "wp_template" &&
                  slug !== "wp_template_part" &&
                  slug !== "wp_navigation"
                );
              })
              .map(([slug, type]) => ({
                title: type.name,
                value: slug,
              }))
              .sort((a, b) => a.title.localeCompare(b.title));

            // console.log("[WordPress Data Source] Filtered post types:", postTypeOptions);

            if (postTypeOptions.length === 0) {
              console.warn(
                "[WordPress Data Source] No post types found after filtering, using fallback"
              );
            }

            return postTypeOptions.length > 0
              ? postTypeOptions
              : [
                  { title: "Posts", value: "post" },
                  { title: "Pages", value: "page" },
                ];
          } catch (error) {
            console.error("[WordPress Data Source] Error fetching post types:", error);
            return [
              { title: "Posts", value: "post" },
              { title: "Pages", value: "page" },
            ];
          }
        },
      },
      wp_posts_per_page: {
        type: "number",
        label: "Posts Per Page",
        min: 1,
        max: 100,
      },
      wp_order: {
        type: "select",
        label: "Order",
        options: [
          { label: "Ascending", value: "asc" },
          { label: "Descending", value: "desc" },
        ],
      },
      wp_orderby: {
        type: "select",
        label: "Order By",
        options: [
          { label: "Date", value: "date" },
          { label: "Title", value: "title" },
          { label: "Menu Order", value: "menu_order" },
          { label: "Random", value: "rand" },
        ],
      },
      // Merge in filter fields for up to 3 filters
      ...createFilterFields(1),
      ...createFilterFields(2),
      ...createFilterFields(3),
    };

    return {
      wp_settings: {
        type: "object",
        label: "🗄️ WordPress Settings",
        objectFields: baseObjectFields,
      },
      wp_grouping: {
        type: "object",
        label: "📊 Grouping Settings",
        objectFields: {
          enabled: {
            type: "radio",
            label: "Enable Grouping",
            options: [
              { label: "No", value: false },
              { label: "Yes", value: true },
            ],
          },
          ...(data?.props?.wp_grouping?.enabled
            ? {
                display_type: {
                  type: "select",
                  label: "Display Type",
                  options: [
                    { label: "Default (List with Headings)", value: "default" },
                    { label: "Cards (Grouped in Cards)", value: "cards" },
                    { label: "Accordion (Collapsible Groups)", value: "accordion" },
                  ],
                },
                group_by: {
                  type: "external",
                  label: "Group By (Level 1)",
                  fetchList: async () => {
                    // Extract post type - handle both string and object formats
                    let postType = data?.props?.wp_settings?.wp_post_type || "post";

                    // If it's an object, extract the value property
                    if (typeof postType === "object" && postType !== null) {
                      postType = postType.value || postType.label || "post";
                    }

                    console.log(
                      "[WordPress Data Source] Fetching taxonomies for post type:",
                      postType
                    );

                    try {
                      // Fetch taxonomies for the selected post type
                      const response = await fetch(
                        `${window.location.origin}/wp-json/wp/v2/taxonomies?type=${postType}`
                      );

                      if (!response.ok) {
                        console.error(
                          "[WordPress Data Source] Failed to fetch taxonomies:",
                          response.status
                        );
                        return [
                          { label: "Category", value: "category" },
                          { label: "Tag", value: "tag" },
                          { label: "Author", value: "author" },
                        ];
                      }

                      const taxonomies = await response.json();
                      const options = [];

                      console.log("[WordPress Data Source] Raw taxonomies response:", taxonomies);

                      // Convert taxonomies object to array of options
                      for (const [key, taxonomy] of Object.entries(taxonomies)) {
                        // Skip nav_menu and post_format (WordPress internals)
                        // Include all other taxonomies since they're returned by the API for this post type
                        if (key !== "nav_menu" && key !== "post_format") {
                          options.push({
                            label: taxonomy.name,
                            value: key,
                          });
                          console.log(
                            "[WordPress Data Source] Added taxonomy:",
                            key,
                            taxonomy.name
                          );
                        } else {
                          console.log("[WordPress Data Source] Skipped taxonomy:", key);
                        }
                      }

                      // Always add Author as an option
                      options.push({ label: "Author", value: "author" });

                      console.log(
                        "[WordPress Data Source] Available grouping options for",
                        postType,
                        ":",
                        options
                      );

                      return options.length > 0
                        ? options
                        : [
                            { label: "Category", value: "category" },
                            { label: "Tag", value: "tag" },
                            { label: "Author", value: "author" },
                          ];
                    } catch (error) {
                      console.error("[WordPress Data Source] Error fetching taxonomies:", error);
                      // Fallback options
                      return [
                        { label: "Category", value: "category" },
                        { label: "Tag", value: "tag" },
                        { label: "Author", value: "author" },
                      ];
                    }
                  },
                },
                group_by_2: {
                  type: "external",
                  label: "Group By (Level 2 - Optional)",
                  fetchList: async () => {
                    // Same taxonomy fetching logic
                    let postType = data?.props?.wp_settings?.wp_post_type || "post";

                    if (typeof postType === "object" && postType !== null) {
                      postType = postType.value || postType.label || "post";
                    }

                    try {
                      const response = await fetch(
                        `${window.location.origin}/wp-json/wp/v2/taxonomies?type=${postType}`
                      );

                      if (!response.ok) {
                        return [
                          { label: "None", value: "none" },
                          { label: "Category", value: "category" },
                          { label: "Tag", value: "tag" },
                          { label: "Author", value: "author" },
                        ];
                      }

                      const taxonomies = await response.json();
                      const options = [{ label: "None", value: "none" }];

                      for (const [key, taxonomy] of Object.entries(taxonomies)) {
                        if (key !== "nav_menu" && key !== "post_format") {
                          options.push({
                            label: taxonomy.name,
                            value: key,
                          });
                        }
                      }

                      options.push({ label: "Author", value: "author" });

                      return options;
                    } catch (error) {
                      return [
                        { label: "None", value: "none" },
                        { label: "Category", value: "category" },
                        { label: "Tag", value: "tag" },
                        { label: "Author", value: "author" },
                      ];
                    }
                  },
                },
                show_group_titles: {
                  type: "radio",
                  label: "Show Group Titles",
                  options: [
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ],
                },
                sort_groups: {
                  type: "select",
                  label: "Sort Groups",
                  options: [
                    { label: "Alphabetically", value: "alphabetical" },
                    { label: "By Count (Descending)", value: "count_desc" },
                    { label: "By Count (Ascending)", value: "count_asc" },
                  ],
                },
                group_columns: {
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
                },
              }
            : {}),
        },
      },
    };
  },

  // Default values for WordPress fields
  getDefaultProps: () => ({
    wp_settings: {
      wp_post_type: "post",
      wp_posts_per_page: 10,
      wp_order: "desc",
      wp_orderby: "date",
      wp_filters: [],
    },
    wp_grouping: {
      enabled: false,
      display_type: "default",
      group_by: "category",
      group_by_2: "none",
      show_group_titles: true,
      sort_groups: "alphabetical",
      group_columns: "3",
    },
  }),

  // Fetch data function
  fetchData: async (props) => {
    const restUrl = window.themeBoilerplateData?.restUrl;
    const nonce = window.themeBoilerplateData?.nonce;

    if (!restUrl) {
      console.error("[WordPress Data Source] REST URL not available");
      return [];
    }

    // Extract WordPress settings from nested object
    const settings = props.wp_settings || {};

    // Ensure we have valid values, use defaults if undefined
    // wp_post_type can be an object {title, value} from external field or a string
    let wp_post_type = settings.wp_post_type || "post";
    if (typeof wp_post_type === "object" && wp_post_type.value) {
      wp_post_type = wp_post_type.value;
    }

    const wp_posts_per_page = settings.wp_posts_per_page || 10;
    const wp_order = settings.wp_order || "desc";
    const wp_orderby = settings.wp_orderby || "date";

    // Collect active filters from the new multi-filter format
    const activeFilters = [];
    for (let i = 1; i <= 3; i++) {
      const filterType = settings[`filter${i}_type`];
      if (filterType && filterType !== "none") {
        const filter = { type: filterType };

        if (filterType === "categories") {
          filter.categories = settings[`filter${i}_categories`] || [];
          filter.operator = settings[`filter${i}_operator`] || "include";
        } else if (filterType === "content_type") {
          filter.content_types = settings[`filter${i}_content_types`] || [];
          filter.operator = settings[`filter${i}_operator`] || "include";
        } else if (filterType === "pods") {
          filter.pods_field = settings[`filter${i}_pods_field`] || "";
          filter.pods_source = settings[`filter${i}_pods_source`] || "current";
          filter.pods_id = settings[`filter${i}_pods_id`] || null;
        }

        activeFilters.push(filter);
      }
    }

    // For backward compatibility, check old-style filter fields
    const wp_filter_type = settings.wp_filter_type;
    const wp_categories = settings.wp_categories;
    const wp_category_operator = settings.wp_category_operator;
    const wp_pods_relationship_field = settings.wp_pods_relationship_field;
    const wp_pods_current_post = settings.wp_pods_current_post;
    const wp_pods_post_id = settings.wp_pods_post_id;

    // Removed excessive logging

    // Fetch the post type info to get the correct REST base
    let endpoint = wp_post_type;

    try {
      const typeResponse = await fetch(
        `${window.location.origin}/wp-json/wp/v2/types/${wp_post_type}`,
        {
          headers: {
            "X-WP-Nonce": nonce,
          },
        }
      );

      if (typeResponse.ok) {
        const typeData = await typeResponse.json();
        // Use the REST base if available, otherwise fallback to slug
        endpoint = typeData.rest_base || wp_post_type;
        // console.log("[WordPress Data Source] Using REST base:", endpoint);
      } else {
        // Fallback mapping for common post types
        const postTypeEndpointMap = {
          post: "posts",
          page: "pages",
        };
        endpoint = postTypeEndpointMap[wp_post_type] || wp_post_type;
      }
    } catch (error) {
      console.warn(
        "[WordPress Data Source] Could not fetch post type info, using fallback:",
        error
      );
      // Fallback mapping
      const postTypeEndpointMap = {
        post: "posts",
        page: "pages",
      };
      endpoint = postTypeEndpointMap[wp_post_type] || wp_post_type;
    }

    // Handle Pods relationship filtering (check new multi-filter format first)
    const podsFilter = activeFilters.find((f) => f.type === "pods" && f.pods_field);

    // Use new filter format if available, otherwise fall back to old format
    const usePods = podsFilter || (wp_filter_type === "pods" && wp_pods_relationship_field);
    const podsField = podsFilter ? podsFilter.pods_field : wp_pods_relationship_field;
    const podsSource = podsFilter ? podsFilter.pods_source : wp_pods_current_post;
    const podsId = podsFilter ? podsFilter.pods_id : wp_pods_post_id;

    // console.log("[WordPress Data Source] Pods Check:", {
    //   podsFilter,
    //   usePods,
    //   podsField,
    //   podsSource,
    //   podsId,
    //   wp_post_type,
    // });

    if (usePods && podsField) {
      // console.log(
      //   "[WordPress Data Source] ✅ PODS FILTERING ACTIVATED for post type:",
      //   wp_post_type
      // );
      // console.log("[WordPress Data Source] Pods relationship filtering enabled");
      // console.log("[WordPress Data Source] Relationship field:", wp_pods_relationship_field);
      // console.log("[WordPress Data Source] Current post mode:", wp_pods_current_post);
      // console.log("[WordPress Data Source] Specific post ID:", wp_pods_post_id);

      try {
        // Determine the source post ID
        let sourcePostId;
        let postType = "post";
        let postSlug = null;

        if (podsSource === "current") {
          // Get current post ID from URL or window object
          const urlParams = new URLSearchParams(window.location.search);
          sourcePostId = urlParams.get("post") || window.themeBoilerplateData?.postId;
          postType = urlParams.get("post_type") || window.themeBoilerplateData?.postType || "post";

          // console.log("[WordPress Data Source] URL params postId:", sourcePostId);
          // console.log(
          //   "[WordPress Data Source] Window postId:",
          //   window.themeBoilerplateData?.postId
          // );
          // console.log("[WordPress Data Source] Window pathname:", window.location.pathname);

          // If we don't have a post ID yet, try to extract from pathname
          // Format: /district/district-1 or /group/my-group-slug
          if (!sourcePostId) {
            const pathParts = window.location.pathname.split("/").filter(Boolean);
            console.log("[WordPress Data Source] Path parts:", pathParts);

            if (pathParts.length >= 2) {
              postType = pathParts[0]; // e.g., "district" or "group"
              postSlug = pathParts[1]; // e.g., "district-1"
              // console.log("[WordPress Data Source] Extracted postType from path:", postType);
              // console.log("[WordPress Data Source] Extracted postSlug from path:", postSlug);

              // Fetch the post by slug to get its ID
              const restBase =
                {
                  post: "posts",
                  page: "pages",
                  district: "district",
                  group: "group",
                  download: "download",
                }[postType] || postType;

              const slugUrl = `${window.location.origin}/wp-json/wp/v2/${restBase}?slug=${postSlug}`;
              // console.log("[WordPress Data Source] Fetching post ID by slug:", slugUrl);

              const slugResponse = await fetch(slugUrl, {
                headers: {
                  "X-WP-Nonce": nonce,
                },
              });

              if (slugResponse.ok) {
                const posts = await slugResponse.json();
                if (Array.isArray(posts) && posts.length > 0) {
                  sourcePostId = posts[0].id;
                  // console.log("[WordPress Data Source] Resolved post ID from slug:", sourcePostId);
                } else {
                  // console.warn("[WordPress Data Source] No post found for slug:", postSlug);
                }
              } else {
                // console.error(
                //   "[WordPress Data Source] Failed to fetch post by slug:",
                //   slugResponse.status
                // );
              }
            }
          }

          // console.log("[WordPress Data Source] Final current post ID:", sourcePostId);
          // console.log("[WordPress Data Source] Final post type:", postType);
        } else {
          sourcePostId = podsId;
          // For specific post ID, we need to determine the SOURCE post type
          // We'll try different post types until we find the right one
          postType = null; // Will be determined dynamically
          // console.log("[WordPress Data Source] Using specific post ID:", sourcePostId);
        }

        if (!sourcePostId) {
          // console.error(
          //   "[WordPress Data Source] No source post ID available for Pods relationship"
          // );
          // console.error("[WordPress Data Source] Checked:", {
          //   urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
          //   windowData: window.themeBoilerplateData,
          //   pathname: window.location.pathname,
          // });
          return [];
        }

        // If we don't have a SOURCE post type (specific ID case), try to fetch it
        // Note: wp_post_type is the TARGET post type we want to display (e.g., "slide")
        // We need to find the SOURCE post type (e.g., "district" for ID 46)
        if (!postType) {
          // console.log(
          //   "[WordPress Data Source] SOURCE post type unknown, attempting to determine for ID:",
          //   sourcePostId
          // );

          // Try common post types (prioritize custom post types first for better performance)
          const postTypesToTry = ["district", "group", "download", "slide", "posts", "pages"];

          for (const tryRestBase of postTypesToTry) {
            try {
              const tryUrl = `${window.location.origin}/wp-json/wp/v2/${tryRestBase}/${sourcePostId}`;
              // console.log("[WordPress Data Source] Trying:", tryUrl);

              const tryResponse = await fetch(tryUrl, {
                headers: {
                  "X-WP-Nonce": nonce,
                },
              });

              if (tryResponse.ok) {
                const tryPost = await tryResponse.json();
                postType = tryPost.type || tryRestBase.replace(/s$/, ""); // Remove trailing 's'
                // console.log("[WordPress Data Source] Found SOURCE post type:", postType);
                break;
              }
            } catch (error) {
              // Continue trying
              // console.log(`[WordPress Data Source] Not a ${tryRestBase}`);
            }
          }

          if (!postType) {
            // console.error(
            //   "[WordPress Data Source] Could not determine SOURCE post type for ID:",
            //   sourcePostId
            // );
            return [];
          }
        }

        // console.log("[WordPress Data Source] SOURCE post type:", postType);
        // console.log("[WordPress Data Source] TARGET post type (will display):", wp_post_type);

        // Fetch the source post with the Pods relationship field included
        // Pods fields are automatically included in the WordPress REST API response
        const restBase =
          {
            post: "posts",
            page: "pages",
            district: "district",
            group: "group",
            download: "download",
            slide: "slide",
          }[postType] || postType;

        const sourcePostUrl = `${window.location.origin}/wp-json/wp/v2/${restBase}/${sourcePostId}`;
        // console.log("[WordPress Data Source] Fetching source post with Pods field:", sourcePostUrl);

        const sourcePostResponse = await fetch(sourcePostUrl, {
          headers: {
            "X-WP-Nonce": nonce,
          },
        });

        // console.log(
        //   "[WordPress Data Source] Source post response status:",
        //   sourcePostResponse.status
        // );

        if (!sourcePostResponse.ok) {
          const errorText = await sourcePostResponse.text();
          console.error("[WordPress Data Source] Failed to fetch source post:", errorText);
          return [];
        }

        const sourcePost = await sourcePostResponse.json();
        // console.log("[WordPress Data Source] Source post data:", sourcePost);
        // console.log("[WordPress Data Source] Source post keys:", Object.keys(sourcePost));
        // console.log(
        //   "[WordPress Data Source] Looking for relationship field:",
        //   wp_pods_relationship_field
        // );

        // Extract the relationship field from the source post
        let relatedItems = sourcePost[podsField];
        // console.log(
        //   `[WordPress Data Source] Related items from field '${wp_pods_relationship_field}':`,
        //   relatedItems
        // );
        // console.log("[WordPress Data Source] Related items type:", typeof relatedItems);
        // console.log("[WordPress Data Source] Is array?:", Array.isArray(relatedItems));

        // If the relationship field doesn't exist on the source post,
        // it means we need to query in the reverse direction
        // (e.g., find slides where related_districts contains district ID 46)
        if (!relatedItems) {
          // console.log(
          //   "[WordPress Data Source] Field not found on source post, querying target posts with filter"
          // );
          // console.log("[WordPress Data Source] Target post type:", wp_post_type);
          // console.log(
          //   "[WordPress Data Source] Will fetch posts where",
          //   wp_pods_relationship_field,
          //   "contains",
          //   sourcePostId
          // );

          // Fetch target posts filtered by the relationship
          const targetRestBase =
            {
              post: "posts",
              page: "pages",
              district: "district",
              group: "group",
              download: "download",
              slide: "slide",
            }[wp_post_type] || wp_post_type;

          // For reverse relationships, we need to use the Pods REST API
          // Try different query formats:
          // 1. Pods format: pods_meta[field_name]=value
          // 2. Meta query format: meta_key & meta_value
          // 3. Or use the Pods REST API directly

          // Let's try the Pods REST API format first
          const targetUrl = `${window.location.origin}/wp-json/pods/v1/${wp_post_type}?per_page=${wp_posts_per_page}&where[${podsField}.ID]=${sourcePostId}&_embed`;
          // console.log("[WordPress Data Source] Fetching target posts via Pods API:", targetUrl);

          let targetResponse = await fetch(targetUrl, {
            headers: {
              "X-WP-Nonce": nonce,
            },
          });

          // If Pods API fails, fallback to standard WP REST API with meta query
          if (!targetResponse.ok) {
            // console.warn(
            //   "[WordPress Data Source] Pods API failed, trying WP REST API with meta query"
            // );
            const fallbackUrl = `${window.location.origin}/wp-json/wp/v2/${targetRestBase}?per_page=${wp_posts_per_page}&_embed`;
            // console.log("[WordPress Data Source] Fallback URL:", fallbackUrl);

            targetResponse = await fetch(fallbackUrl, {
              headers: {
                "X-WP-Nonce": nonce,
              },
            });
          }

          if (!targetResponse.ok) {
            const errorText = await targetResponse.text();
            console.error("[WordPress Data Source] Failed to fetch target posts:", errorText);
            return [];
          }

          let targetPosts = await targetResponse.json();
          // console.log(
          //   "[WordPress Data Source] Target posts found (before filtering):",
          //   targetPosts.length
          // );

          // Check if the first post has the relationship field
          if (targetPosts.length > 0) {
            // console.log("[WordPress Data Source] First post keys:", Object.keys(targetPosts[0]));
            // console.log(
            //   "[WordPress Data Source] First post has relationship field?",
            //   wp_pods_relationship_field in targetPosts[0]
            // );
            // if (targetPosts[0][wp_pods_relationship_field]) {
            //   console.log(
            //     "[WordPress Data Source] First post relationship value:",
            //     targetPosts[0][wp_pods_relationship_field]
            //   );
            // }
          }

          // If we used the fallback WP REST API, we need to manually filter by the relationship
          // The Pods fields might be included in the WP REST API response
          if (targetPosts.length > 0 && podsField in targetPosts[0]) {
            // console.log("[WordPress Data Source] Filtering posts client-side by relationship");
            targetPosts = targetPosts.filter((post) => {
              const relatedItems = post[podsField];
              // console.log(
              //   `[WordPress Data Source] Post ${post.id} has ${podsField}:`,
              //   relatedItems
              // );

              // Handle false (no relationship)
              if (!relatedItems || relatedItems === false) {
                // console.log(`[WordPress Data Source] Post ${post.id} has no relationships`);
                return false;
              }

              if (Array.isArray(relatedItems)) {
                // Extract IDs from Pods relationship objects
                const relatedIds = relatedItems
                  .map((item) => {
                    // If it's an object with ID or id property, extract it
                    if (typeof item === "object" && item !== null) {
                      return item.ID || item.id;
                    }
                    // Otherwise assume it's already an ID
                    return item;
                  })
                  .filter((id) => id !== undefined);

                // console.log(`[WordPress Data Source] Post ${post.id} extracted IDs:`, relatedIds);

                const hasMatch = relatedIds.some((id) => parseInt(id) === parseInt(sourcePostId));
                // console.log(`[WordPress Data Source] Post ${post.id} matches? ${hasMatch}`);
                return hasMatch;
              }
              return false;
            });
            // console.log(
            //   "[WordPress Data Source] Target posts found (after filtering):",
            //   targetPosts.length
            // );
          } else {
            console.warn(
              `[WordPress Data Source] Relationship field '${podsField}' not found in WP REST API response. Cannot filter. Returning all posts.`
            );
          }

          // These are already in WP REST API format, transform them
          relatedItems = targetPosts.map((post) => {
            // Extract featured image URL from _embedded data
            let featuredMediaUrl = null;
            if (post._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
              featuredMediaUrl = post._embedded["wp:featuredmedia"][0].source_url;
            }

            return {
              ID: post.id,
              post_title: post.title?.rendered || "",
              post_excerpt: post.excerpt?.rendered || "",
              post_content: post.content?.rendered || "",
              guid: post.link || "",
              post_date: post.date || "",
              featured_media: post.featured_media || null,
              format: post.format || "standard", // ✅ Add post format
              post_format: post.format || "standard", // ✅ Add as alternative field name
              _thumbnail_id: featuredMediaUrl
                ? [
                    post.featured_media,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    featuredMediaUrl,
                  ]
                : null,
            };
          });
          console.log("[WordPress Data Source] Converted to Pods format:", relatedItems.length);
        }

        if (!relatedItems || !Array.isArray(relatedItems) || relatedItems.length === 0) {
          console.warn("[WordPress Data Source] No related items found");
          return [];
        }

        // Apply per_page limit
        const limitedItems = relatedItems.slice(0, wp_posts_per_page);

        // Transform Pods data to common format
        const transformedData = limitedItems.map((item) => {
          // Handle _thumbnail_id which can be an array or single value
          let thumbnailId = item._thumbnail_id || item.featured_media || null;
          let featuredMediaUrl = null;

          if (Array.isArray(thumbnailId)) {
            // If it's an array, it contains full media data
            // Format: [ID, author, date, date_gmt, empty, name, empty, status, ...]
            // The image URL is at index 18 in the array
            featuredMediaUrl = thumbnailId[18] || null;
            thumbnailId = thumbnailId[0] || null; // Get the ID from first element
          }

          // Convert string to number if needed
          if (typeof thumbnailId === "string") {
            thumbnailId = parseInt(thumbnailId, 10);
          }

          const format = item.format || item.post_format || "standard";
          console.log(`[WordPress Data Source - Pods] Transforming item ${item.ID || item.id}:`, {
            raw_format: item.format,
            raw_post_format: item.post_format,
            transformed_format: format,
            title: item.post_title || item.title?.rendered || item.name,
          });

          return {
            id: item.ID || item.id,
            title: item.post_title || item.title?.rendered || item.name || "",
            excerpt: item.post_excerpt || item.excerpt?.rendered || "",
            content: item.post_content || item.content?.rendered || "",
            link: item.guid || item.link || "",
            date: item.post_date || item.date || "",
            image: thumbnailId,
            featured_media_url: featuredMediaUrl, // Add direct URL for SlideCard
            format: format, // Add post format
            _raw: item,
          };
        });

        console.log(
          "[WordPress Data Source] Transformed Pods data:",
          transformedData.length,
          "items"
        );
        console.log("[WordPress Data Source - Pods] Sample item with format:", transformedData[0]);
        return transformedData;
      } catch (error) {
        console.error("[WordPress Data Source] Error fetching Pods relationship:", error);
        return [];
      }
    }

    // Build URL with category filtering
    // Note: We don't add _fields parameter because we want ALL fields including format
    let url = `${window.location.origin}/wp-json/wp/v2/${endpoint}?per_page=${wp_posts_per_page}&order=${wp_order}&orderby=${wp_orderby}&_embed`;

    console.log("[WordPress Data Source] Base URL (should include format):", url);

    // Apply multiple filters
    console.log("[WordPress Data Source] Applying filters:", activeFilters);

    // Collect all category and content_type IDs from all filters first
    const allCategoryIds = [];
    const allCategoryExcludeIds = [];
    const allContentTypeIds = [];
    const allContentTypeExcludeIds = [];

    // Process each active filter to collect IDs
    for (const filter of activeFilters) {
      if (filter.type === "categories") {
        let categoriesArray = filter.categories || [];

        // Handle both array and object formats
        if (!Array.isArray(categoriesArray) && typeof categoriesArray === "object") {
          categoriesArray = Object.values(categoriesArray);
        }

        if (categoriesArray.length > 0) {
          // Extract category IDs
          const categoryIds = categoriesArray
            .map((cat) => {
              if (typeof cat === "object" && cat !== null && cat.value !== undefined) {
                return cat.value;
              }
              return cat;
            })
            .filter((id) => {
              const numId = typeof id === "string" ? parseInt(id, 10) : id;
              return typeof numId === "number" && !isNaN(numId) && numId > 0;
            })
            .map((id) => (typeof id === "string" ? parseInt(id, 10) : id));

          if (categoryIds.length > 0) {
            if (filter.operator === "exclude") {
              allCategoryExcludeIds.push(...categoryIds);
            } else {
              allCategoryIds.push(...categoryIds);
            }
          }
        }
      } else if (filter.type === "content_type") {
        let contentTypesArray = filter.content_types || [];

        // Handle both array and object formats
        if (!Array.isArray(contentTypesArray) && typeof contentTypesArray === "object") {
          contentTypesArray = Object.values(contentTypesArray);
        }

        if (contentTypesArray && contentTypesArray.length > 0) {
          // Convert to IDs, handling both string and object formats
          const typeIds = contentTypesArray
            .map((type) => (typeof type === "object" && type.value ? type.value : type))
            .filter((id) => {
              const numId = typeof id === "string" ? parseInt(id, 10) : id;
              return typeof numId === "number" && !isNaN(numId) && numId > 0;
            })
            .map((id) => (typeof id === "string" ? parseInt(id, 10) : id));

          if (typeIds.length > 0) {
            if (filter.operator === "exclude") {
              allContentTypeExcludeIds.push(...typeIds);
            } else {
              allContentTypeIds.push(...typeIds);
            }
          }
        }
      }
      // Note: Pods filters are handled earlier in the function before building the URL
    }

    // Now append all collected IDs to the URL using array notation for multiple values
    if (allCategoryIds.length > 0) {
      // Remove duplicates
      const uniqueIds = [...new Set(allCategoryIds)];
      // Use array notation for multiple values: categories[]=1&categories[]=2
      url += `&${uniqueIds.map((id) => `categories[]=${id}`).join("&")}`;
      console.log(
        `[WordPress Data Source] Added category filter (include): ${uniqueIds.join(",")}`
      );
    }

    if (allCategoryExcludeIds.length > 0) {
      const uniqueIds = [...new Set(allCategoryExcludeIds)];
      url += `&${uniqueIds.map((id) => `categories_exclude[]=${id}`).join("&")}`;
      console.log(
        `[WordPress Data Source] Added category filter (exclude): ${uniqueIds.join(",")}`
      );
    }

    if (allContentTypeIds.length > 0) {
      const uniqueIds = [...new Set(allContentTypeIds)];
      // Use array notation for multiple values: content_type[]=1&content_type[]=2
      url += `&${uniqueIds.map((id) => `content_type[]=${id}`).join("&")}`;
      console.log(
        `[WordPress Data Source] Added content_type filter (include): ${uniqueIds.join(",")}`
      );
    }

    if (allContentTypeExcludeIds.length > 0) {
      const uniqueIds = [...new Set(allContentTypeExcludeIds)];
      url += `&${uniqueIds.map((id) => `content_type_exclude[]=${id}`).join("&")}`;
      console.log(
        `[WordPress Data Source] Added content_type filter (exclude): ${uniqueIds.join(",")}`
      );
    }

    // Backward compatibility: Apply old-style filters if no new filters are active
    if (activeFilters.length === 0 && wp_filter_type === "categories" && wp_categories) {
      let categoriesArray = wp_categories;
      if (!Array.isArray(categoriesArray) && typeof categoriesArray === "object") {
        categoriesArray = Object.values(categoriesArray);
      }

      if (categoriesArray && categoriesArray.length > 0) {
        const categoryIds = categoriesArray
          .map((cat) => (typeof cat === "object" && cat.value ? cat.value : cat))
          .filter((id) => {
            const numId = typeof id === "string" ? parseInt(id, 10) : id;
            return typeof numId === "number" && !isNaN(numId) && numId > 0;
          })
          .map((id) => (typeof id === "string" ? parseInt(id, 10) : id));

        if (categoryIds.length > 0) {
          const categoryParam =
            wp_category_operator === "exclude" ? "categories_exclude" : "categories";
          url += `&${categoryParam}=${categoryIds.join(",")}`;
        }
      }
    }

    console.log("[WordPress Data Source] Fetching from:", url);
    console.log("[WordPress Data Source] Props:", {
      wp_post_type,
      wp_posts_per_page,
      wp_order,
      wp_orderby,
      wp_filter_type,
      wp_categories,
      wp_category_operator,
    });

    try {
      const response = await fetch(url, {
        headers: {
          "X-WP-Nonce": nonce,
        },
      });

      console.log("[WordPress Data Source] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[WordPress Data Source] Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("[WordPress Data Source] Fetched data count:", data.length);
      console.log("[WordPress Data Source] Fetched data:", data);
      console.log("[WordPress Data Source] First item raw data:", data[0]);
      console.log("[WordPress Data Source] First item has format field?:", "format" in data[0]);
      console.log("[WordPress Data Source] First item format value:", data[0]?.format);

      if (!Array.isArray(data)) {
        console.error("[WordPress Data Source] Expected array, got:", typeof data);
        return [];
      }

      if (data.length === 0) {
        console.warn("[WordPress Data Source] No items found matching filters");
        return [];
      }

      // Transform WordPress data to a common format
      const transformedData = data.map((item) => {
        const format = item.format || "standard";
        // console.log(`[WordPress Data Source] Transforming item ${item.id}:`, {
        //   raw_format: item.format,
        //   transformed_format: format,
        //   title: item.title?.rendered,
        // });

        // Extract featured image URL from _embedded data
        let featuredMediaUrl = null;
        if (item._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
          featuredMediaUrl = item._embedded["wp:featuredmedia"][0].source_url;
        }

        return {
          id: item.id,
          title: item.title?.rendered || "",
          excerpt: item.excerpt?.rendered || "",
          content: item.content?.rendered || "",
          link: item.link || "",
          date: item.date || "",
          image: item.featured_media || null,
          featured_media_url: featuredMediaUrl, // Add direct URL
          format: format, // Add post format
          // Store original data for advanced use cases
          _raw: item,
        };
      });

      console.log("[WordPress Data Source] Transformed data:", transformedData.length, "items");
      if (transformedData.length > 0) {
        console.log("[WordPress Data Source] Sample item structure:", transformedData[0]);
        console.log("[WordPress Data Source] Sample item _raw:", transformedData[0]?._raw);
        console.log(
          "[WordPress Data Source] Sample item _embedded:",
          transformedData[0]?._raw?._embedded
        );
      }

      // Apply grouping if enabled
      const grouping = props.wp_grouping || {};
      console.log("[WordPress Data Source] Checking grouping:", grouping);
      console.log("[WordPress Data Source] Grouping enabled?:", grouping.enabled);
      console.log("[WordPress Data Source] Group by value:", grouping.group_by);
      console.log("[WordPress Data Source] Has data?:", transformedData.length > 0);

      if (grouping.enabled && transformedData.length > 0) {
        console.log("[WordPress Data Source] ✅ GROUPING ACTIVATED!");
        return wordPressDataSource.groupData(transformedData, grouping);
      }

      console.log("[WordPress Data Source] ❌ Grouping NOT activated, returning ungrouped data");
      return transformedData;
    } catch (error) {
      console.error("[WordPress Data Source] Error fetching data:", error);
      return [];
    }
  },

  // Helper function to extract group keys for an item
  getGroupKeys: (item, groupByValue) => {
    let groupKeys = [];

    switch (groupByValue) {
      case "category":
        if (item._raw?.categories && Array.isArray(item._raw.categories)) {
          groupKeys = item._raw.categories.map((catId) => {
            const catName =
              item._raw?._embedded?.["wp:term"]?.[0]?.find((t) => t.id === catId)?.name ||
              `Category ${catId}`;
            return { key: catId, name: catName };
          });
        }
        if (groupKeys.length === 0) {
          groupKeys = [{ key: "uncategorized", name: "Uncategorized" }];
        }
        break;

      case "tag":
        if (item._raw?.tags && Array.isArray(item._raw.tags)) {
          groupKeys = item._raw.tags.map((tagId) => {
            const tagName =
              item._raw?._embedded?.["wp:term"]?.[1]?.find((t) => t.id === tagId)?.name ||
              `Tag ${tagId}`;
            return { key: tagId, name: tagName };
          });
        }
        if (groupKeys.length === 0) {
          groupKeys = [{ key: "untagged", name: "Untagged" }];
        }
        break;

      case "post_format":
        const format = item.format || "standard";
        groupKeys = [{ key: format, name: format.charAt(0).toUpperCase() + format.slice(1) }];
        break;

      case "content_type":
        if (
          item._raw?.content_type &&
          Array.isArray(item._raw.content_type) &&
          item._raw.content_type.length > 0
        ) {
          groupKeys = item._raw.content_type.map((typeId) => {
            const typeName =
              item._raw?._embedded?.["wp:term"]?.find((termArray) =>
                termArray.some((t) => t.taxonomy === "content_type" && t.id === typeId)
              )?.[0]?.name || `Type ${typeId}`;
            return { key: typeId, name: typeName };
          });
        }
        if (groupKeys.length === 0) {
          groupKeys = [{ key: "standard", name: "Standard" }];
        }
        break;

      case "author":
        const authorId = item._raw?.author || 0;
        const authorName = item._raw?._embedded?.author?.[0]?.name || `Author ${authorId}`;
        groupKeys = [{ key: authorId, name: authorName }];
        break;

      default:
        // Handle custom taxonomies dynamically
        if (item._raw?.[groupByValue] && Array.isArray(item._raw[groupByValue])) {
          groupKeys = item._raw[groupByValue].map((termId) => {
            let termName = null;

            if (item._raw?._embedded?.["wp:term"]) {
              for (let i = 0; i < item._raw._embedded["wp:term"].length; i++) {
                const termArray = item._raw._embedded["wp:term"][i];
                if (Array.isArray(termArray)) {
                  for (const t of termArray) {
                    if (t.taxonomy === groupByValue && t.id === termId) {
                      termName = t.name;
                      break;
                    }
                  }
                  if (termName) break;
                }
              }
            }

            return {
              key: termId,
              name: termName || `Uncategorized`,
            };
          });
        }

        if (groupKeys.length === 0) {
          groupKeys = [{ key: "uncategorized", name: "Uncategorized" }];
        }
        break;
    }

    return groupKeys;
  },

  // Group data based on grouping settings
  groupData: (data, grouping) => {
    let {
      group_by,
      group_by_2,
      display_type = "default",
      show_group_titles = true,
      sort_groups = "alphabetical",
    } = grouping;

    // Handle if group_by is an object (from external field)
    if (typeof group_by === "object" && group_by !== null) {
      group_by = group_by.value || group_by.label || group_by;
    }

    // Handle if group_by_2 is an object (from external field)
    if (typeof group_by_2 === "object" && group_by_2 !== null) {
      group_by_2 = group_by_2.value || group_by_2.label || group_by_2;
    }

    // Check if we need nested grouping
    const hasNestedGrouping = group_by_2 && group_by_2 !== "none";

    console.log("[WordPress Data Source] Grouping data by:", group_by);
    console.log("[WordPress Data Source] Group by 2:", group_by_2);
    console.log("[WordPress Data Source] Has nested grouping:", hasNestedGrouping);

    // Create groups
    const groups = {};

    data.forEach((item) => {
      // Get level 1 group keys using helper
      const level1GroupKeys = wordPressDataSource.getGroupKeys(item, group_by);

      // Add item to each level 1 group
      level1GroupKeys.forEach(({ key, name }) => {
        if (!groups[key]) {
          groups[key] = {
            groupKey: key,
            groupName: name,
            items: hasNestedGrouping ? {} : [], // Use object for nested grouping, array otherwise
          };
        }

        if (hasNestedGrouping) {
          // Get level 2 group keys
          const level2GroupKeys = wordPressDataSource.getGroupKeys(item, group_by_2);

          // Add item to each level 2 subgroup
          level2GroupKeys.forEach(({ key: subKey, name: subName }) => {
            const compositeKey = `${key}_${subKey}`;
            if (!groups[key].items[compositeKey]) {
              groups[key].items[compositeKey] = {
                groupKey: subKey,
                groupName: subName,
                items: [],
              };
            }
            groups[key].items[compositeKey].items.push(item);
          });
        } else {
          // Single level grouping - just add item directly
          groups[key].items.push(item);
        }
      });
    });

    // Convert to array and sort
    let groupedArray = Object.values(groups);

    // If we have nested grouping, convert the items object to an array
    if (hasNestedGrouping) {
      groupedArray = groupedArray.map((group) => ({
        ...group,
        items: Object.values(group.items),
      }));
    }

    // Helper function to count total items (works for both single and nested)
    const getTotalCount = (group) => {
      if (Array.isArray(group.items)) {
        return group.items.length;
      } else {
        return group.items.reduce((sum, subgroup) => sum + subgroup.items.length, 0);
      }
    };

    switch (sort_groups) {
      case "alphabetical":
        groupedArray.sort((a, b) => a.groupName.localeCompare(b.groupName));
        break;
      case "count_desc":
        groupedArray.sort((a, b) => getTotalCount(b) - getTotalCount(a));
        break;
      case "count_asc":
        groupedArray.sort((a, b) => getTotalCount(a) - getTotalCount(b));
        break;
    }

    console.log("[WordPress Data Source] Grouped data:", groupedArray);

    return {
      _grouped: true,
      _nested: hasNestedGrouping,
      display_type,
      groups: groupedArray,
      show_group_titles,
    };
  },
};
