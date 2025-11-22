type GenericRecord = Record<string, any>;

type GroupByValue = string | { value?: string; label?: string } | null | undefined;

export type GroupKey = {
  key: string;
  name: string;
};

const pluralizeContentType = (name: string): string => {
  const specialCases: Record<string, string> = {
    Archive: "Archives",
    Link: "Links",
    Gallery: "Galleries",
    Video: "Videos",
    Audio: "Audio",
    Image: "Images",
    Quote: "Quotes",
    Standard: "Standard",
    Download: "Downloads",
    "Call to Action": "Calls to Action",
    "Call-to-Action": "Calls-to-Action",
  };

  if (specialCases[name]) {
    return specialCases[name];
  }

  if (
    name.endsWith("y") &&
    !name.endsWith("ay") &&
    !name.endsWith("ey") &&
    !name.endsWith("oy") &&
    !name.endsWith("uy")
  ) {
    return name.slice(0, -1) + "ies";
  }

  if (name.endsWith("s") || name.endsWith("x") || name.endsWith("z") || name.endsWith("ch") || name.endsWith("sh")) {
    return name + "es";
  }

  return name + "s";
};

const normalizeGroupBy = (groupByValue: GroupByValue): string => {
  if (typeof groupByValue === "object" && groupByValue !== null) {
    return String(groupByValue.value ?? groupByValue.label ?? "");
  }
  return groupByValue ? String(groupByValue) : "";
};

const shouldIncludeCategory = (id: number | string, filteredCategoryIds: number[] | null) =>
  !filteredCategoryIds || filteredCategoryIds.includes(Number(id));

export const getGroupKeys = (
  item: GenericRecord,
  groupByValue: GroupByValue,
  filteredCategoryIds: number[] | null = null,
): GroupKey[] => {
  const normalizedGroupBy = normalizeGroupBy(groupByValue);
  const groupKeys: GroupKey[] = [];

  switch (normalizedGroupBy) {
    case "category": {
      if (item._embedded?.["wp:term"]?.[0]) {
        item._embedded["wp:term"][0].forEach((cat: GenericRecord) => {
          if (!shouldIncludeCategory(cat.id, filteredCategoryIds)) return;
          groupKeys.push({ key: `category_${cat.id}`, name: cat.name });
        });
      } else if (Array.isArray(item.categories)) {
        item.categories.forEach((cat: GenericRecord | number) => {
          const id = typeof cat === "object" ? cat.id : cat;
          if (!shouldIncludeCategory(id, filteredCategoryIds)) return;
          const name = typeof cat === "object" ? cat.name : `Category ${id}`;
          groupKeys.push({ key: `category_${id}`, name });
        });
      } else if (item._raw?.categories) {
        const cats = item._raw.categories?.nodes || [];
        cats.forEach((cat: GenericRecord) => {
          const catId = cat.databaseId || cat.id;
          if (!shouldIncludeCategory(catId, filteredCategoryIds)) return;
          groupKeys.push({ key: `category_${catId}`, name: cat.name });
        });
      }
      break;
    }

    case "tag": {
      if (item._embedded?.["wp:term"]?.[1]) {
        item._embedded["wp:term"][1].forEach((tag: GenericRecord) => {
          groupKeys.push({ key: `tag_${tag.id}`, name: tag.name });
        });
      } else if (Array.isArray(item.tags)) {
        item.tags.forEach((tag: GenericRecord | number) => {
          const id = typeof tag === "object" ? tag.id : tag;
          const name = typeof tag === "object" ? tag.name : `Tag ${id}`;
          groupKeys.push({ key: `tag_${id}`, name });
        });
      } else if (item._raw?.tags) {
        const tags = item._raw.tags?.nodes || [];
        tags.forEach((tag: GenericRecord) => {
          groupKeys.push({ key: `tag_${tag.databaseId || tag.id}`, name: tag.name });
        });
      }
      break;
    }

    case "author": {
      if (item._embedded?.author?.[0]) {
        const author = item._embedded.author[0];
        groupKeys.push({ key: `author_${author.id}`, name: author.name });
      } else if (item.author) {
        const authorId = typeof item.author === "object" ? item.author.id : item.author;
        const authorName = typeof item.author === "object" ? item.author.name : `Author ${item.author}`;
        groupKeys.push({ key: `author_${authorId}`, name: authorName });
      } else if (item._raw?.author?.node) {
        const author = item._raw.author.node;
        groupKeys.push({ key: `author_${author.databaseId || author.id}`, name: author.name });
      }
      break;
    }

    case "content_type": {
      if (item._raw?.postContentTypes) {
        const contentTypes = item._raw.postContentTypes?.nodes || [];
        if (contentTypes.length > 0) {
          contentTypes.forEach((contentType: GenericRecord) => {
            const isStandard = contentType.slug === "standard";
            groupKeys.push({
              key: isStandard ? "content_type_standard" : `content_type_${contentType.databaseId || contentType.id}`,
              name: pluralizeContentType(contentType.name),
            });
          });
        } else {
          groupKeys.push({ key: "content_type_standard", name: pluralizeContentType("Standard") });
        }
      } else if (Array.isArray(item.content_type)) {
        item.content_type.forEach((type: GenericRecord | number) => {
          const id = typeof type === "object" ? type.id : type;
          const name = typeof type === "object" ? type.name : `Type ${id}`;
          groupKeys.push({ key: `content_type_${id}`, name: pluralizeContentType(name) });
        });
      } else if (item._embedded?.["wp:term"]) {
        item._embedded["wp:term"].forEach((termArray: unknown) => {
          if (!Array.isArray(termArray)) return;
          termArray.forEach((term) => {
            if ((term as GenericRecord).taxonomy === "content_type") {
              const typedTerm = term as GenericRecord;
              groupKeys.push({
                key: `content_type_${typedTerm.id}`,
                name: pluralizeContentType(typedTerm.name),
              });
            }
          });
        });
      }
      break;
    }

    case "role": {
      if (Array.isArray(item.roles)) {
        item.roles.forEach((role: GenericRecord | string) => {
          const roleName = typeof role === "object" ? role.name : role;
          groupKeys.push({ key: `role_${roleName}`, name: roleName });
        });
      } else if (item._raw?.roles) {
        const roles = item._raw.roles?.nodes || [];
        roles.forEach((role: GenericRecord) => {
          groupKeys.push({ key: `role_${role.name}`, name: role.name });
        });
      }
      break;
    }

    case "first_letter": {
      if (item.title) {
        const titleValue =
          typeof item.title === "object" ? item.title.rendered || item.title.text : item.title;
        if (titleValue) {
          const firstLetter = titleValue.charAt(0).toUpperCase();
          groupKeys.push({ key: `letter_${firstLetter}`, name: firstLetter });
        }
      }
      break;
    }

    case "parent": {
      if (item._raw?.parent || item.parentId || item.parent) {
        const parentId = item._raw?.parent?.node?.databaseId || item.parentId || item.parent;
        const parentName = item._raw?.parent?.node?.name || item.parentName || `Parent ${parentId ?? "None"}`;
        groupKeys.push({ key: `parent_${parentId ?? "none"}`, name: parentName });
      } else {
        groupKeys.push({ key: "parent_none", name: "No Parent" });
      }
      break;
    }

    default: {
      if (Array.isArray(item[normalizedGroupBy])) {
        item[normalizedGroupBy].forEach((termId: GenericRecord | number) => {
          let termName: string | null = null;

          if (item._embedded?.["wp:term"]) {
            for (const termArray of item._embedded["wp:term"]) {
              if (!Array.isArray(termArray)) continue;
              for (const term of termArray) {
                if ((term as GenericRecord).taxonomy === normalizedGroupBy && (term as GenericRecord).id === termId) {
                  termName = (term as GenericRecord).name;
                  break;
                }
              }
              if (termName) break;
            }
          }

          groupKeys.push({
            key: `${normalizedGroupBy}_${termId}`,
            name: termName || "Uncategorized",
          });
        });
      } else if (item._embedded?.["wp:term"]) {
        item._embedded["wp:term"].forEach((termArray: unknown) => {
          if (!Array.isArray(termArray)) return;
          termArray.forEach((term) => {
            if ((term as GenericRecord).taxonomy === normalizedGroupBy) {
              const typedTerm = term as GenericRecord;
              groupKeys.push({
                key: `${normalizedGroupBy}_${typedTerm.id}`,
                name: typedTerm.name,
              });
            }
          });
        });
      } else if (item._raw?.[normalizedGroupBy]) {
        const terms = item._raw[normalizedGroupBy]?.nodes || [];
        terms.forEach((term: GenericRecord) => {
          groupKeys.push({
            key: `${normalizedGroupBy}_${term.databaseId || term.id}`,
            name: term.name || "Uncategorized",
          });
        });
      } else {
        groupKeys.push({
          key: `${normalizedGroupBy || "misc"}_uncategorized`,
          name: "Uncategorized",
        });
      }
      break;
    }
  }

  if (groupKeys.length === 0) {
    groupKeys.push({
      key: `${normalizedGroupBy || "misc"}_default`,
      name: "Miscellaneous",
    });
  }

  return groupKeys;
};
/**
 * Grouping Helpers
 * Shared utilities for grouping data by taxonomy, author, etc.
 * Used by both WordPress and GraphQL data sources
 *
 * @package theme-boilerplate
 */

/**
 * Pluralize a content type name for group headings
 * @param {string} name - Singular name (e.g., "Link", "Archive")
 * @returns {string} Pluralized name (e.g., "Links", "Archives")
 */
const pluralizeContentType = (name) => {
  // Handle special cases and common pluralization rules
  const specialCases = {
    Archive: "Archives",
    Link: "Links",
    Gallery: "Galleries",
    Video: "Videos",
    Audio: "Audio", // Audio is often uncountable
    Image: "Images",
    Quote: "Quotes",
    Standard: "Standard", // Standard doesn't need plural
    Download: "Downloads",
    "Call to Action": "Calls to Action",
    "Call-to-Action": "Calls-to-Action",
  };

  // Check if we have a special case
  if (specialCases[name]) {
    return specialCases[name];
  }

  // Default pluralization rules
  if (
    name.endsWith("y") &&
    !name.endsWith("ay") &&
    !name.endsWith("ey") &&
    !name.endsWith("oy") &&
    !name.endsWith("uy")
  ) {
    // Words ending in consonant + y: change y to ies (e.g., "Category" -> "Categories")
    return name.slice(0, -1) + "ies";
  } else if (
    name.endsWith("s") ||
    name.endsWith("x") ||
    name.endsWith("z") ||
    name.endsWith("ch") ||
    name.endsWith("sh")
  ) {
    // Words ending in s, x, z, ch, sh: add es
    return name + "es";
  } else {
    // Default: just add s
    return name + "s";
  }
};

/**
 * Extract group keys for an item based on the grouping field
 * @param {Object} item - The data item
 * @param {string} groupByValue - What to group by (category, tag, author, etc.)
 * @param {Array|null} filteredCategoryIds - Optional: category IDs to filter by (only used when grouping by category)
 * @returns {Array} Array of {key, name} objects
 */
export const getGroupKeys = (item, groupByValue, filteredCategoryIds = null) => {
  let groupKeys = [];

  // Handle string format for groupBy
  if (typeof groupByValue === "object" && groupByValue !== null) {
    groupByValue = groupByValue.value || groupByValue.label || groupByValue;
  }

  switch (groupByValue) {
    case "category":
      // Handle both REST API format (_embedded) and direct categories array
      if (item._embedded?.["wp:term"]?.[0]) {
        // REST API format
        item._embedded["wp:term"][0].forEach((cat) => {
          // Filter by allowed category IDs if provided
          if (filteredCategoryIds && !filteredCategoryIds.includes(cat.id)) {
            return; // Skip this category
          }
          groupKeys.push({
            key: `category_${cat.id}`,
            name: cat.name,
          });
        });
      } else if (item.categories && Array.isArray(item.categories)) {
        // Direct categories array format
        item.categories.forEach((cat) => {
          const id = typeof cat === "object" ? cat.id : cat;
          const name = typeof cat === "object" ? cat.name : `Category ${cat}`;
          // Filter by allowed category IDs if provided
          if (filteredCategoryIds && !filteredCategoryIds.includes(id)) {
            return; // Skip this category
          }
          groupKeys.push({
            key: `category_${id}`,
            name: name,
          });
        });
      } else if (item._raw?.categories) {
        // GraphQL format: extract from _raw
        const cats = item._raw.categories?.nodes || [];
        cats.forEach((cat) => {
          const catId = cat.databaseId || cat.id;
          // Filter by allowed category IDs if provided
          if (filteredCategoryIds && !filteredCategoryIds.includes(catId)) {
            return; // Skip this category
          }
          groupKeys.push({
            key: `category_${catId}`,
            name: cat.name,
          });
        });
      }
      break;

    case "tag":
      // Handle both REST API format (_embedded) and direct tags array
      if (item._embedded?.["wp:term"]?.[1]) {
        // REST API format (tags are usually at index 1)
        item._embedded["wp:term"][1].forEach((tag) => {
          groupKeys.push({
            key: `tag_${tag.id}`,
            name: tag.name,
          });
        });
      } else if (item.tags && Array.isArray(item.tags)) {
        // Direct tags array format
        item.tags.forEach((tag) => {
          const id = typeof tag === "object" ? tag.id : tag;
          const name = typeof tag === "object" ? tag.name : `Tag ${tag}`;
          groupKeys.push({
            key: `tag_${id}`,
            name: name,
          });
        });
      } else if (item._raw?.tags) {
        // GraphQL format: extract from _raw
        const tags = item._raw.tags?.nodes || [];
        tags.forEach((tag) => {
          groupKeys.push({
            key: `tag_${tag.databaseId || tag.id}`,
            name: tag.name,
          });
        });
      }
      break;

    case "author":
      // Handle both REST API format (_embedded) and direct author
      if (item._embedded?.author?.[0]) {
        const author = item._embedded.author[0];
        groupKeys.push({
          key: `author_${author.id}`,
          name: author.name,
        });
      } else if (item.author) {
        const authorId = typeof item.author === "object" ? item.author.id : item.author;
        const authorName =
          typeof item.author === "object" ? item.author.name : `Author ${item.author}`;
        groupKeys.push({
          key: `author_${authorId}`,
          name: authorName,
        });
      } else if (item._raw?.author) {
        // GraphQL format: extract from _raw
        const author = item._raw.author?.node;
        if (author) {
          groupKeys.push({
            key: `author_${author.databaseId || author.id}`,
            name: author.name,
          });
        }
      }
      break;

    case "content_type":
      // Handle content type taxonomy (postContentTypes)
      if (item._raw?.postContentTypes) {
        // GraphQL format: extract from _raw
        const contentTypes = item._raw.postContentTypes?.nodes || [];
        if (contentTypes.length > 0) {
          contentTypes.forEach((contentType) => {
            // Use special "content_type_standard" key for "standard" slug
            const isStandard = contentType.slug === "standard";
            groupKeys.push({
              key: isStandard
                ? `content_type_standard`
                : `content_type_${contentType.databaseId || contentType.id}`,
              name: pluralizeContentType(contentType.name), // Pluralize for group heading
            });
          });
        } else {
          // No content type assigned - default to "standard"
          groupKeys.push({
            key: `content_type_standard`,
            name: "Standard",
          });
        }
      } else if (item.format) {
        // Fallback: use the format field directly (e.g., "link", "video", "quote")
        const isStandard = item.format === "standard";
        const formatName = item.format.charAt(0).toUpperCase() + item.format.slice(1); // Capitalize
        groupKeys.push({
          key: isStandard ? `content_type_standard` : `content_type_${item.format}`,
          name: pluralizeContentType(formatName), // Pluralize for group heading
        });
      } else {
        // No format or postContentTypes - default to "standard"
        groupKeys.push({
          key: `content_type_standard`,
          name: "Standard",
        });
      }
      break;

    case "role":
      {
        const roles =
          item.roles || item._raw?.roles?.nodes?.map((role) => role.displayName || role.name) || [];

        if (!roles.length) {
          groupKeys.push({
            key: "role_unknown",
            name: "No Role",
          });
        } else {
          roles.forEach((role) => {
            if (!role) return;
            groupKeys.push({
              key: `role_${String(role).toLowerCase()}`,
              name: role,
            });
          });
        }
      }
      break;

    case "first_letter":
      {
        const source = item.title || item.name || item._raw?.name || item._raw?.title || "";
        const trimmed = source.trim();
        const letter = trimmed ? trimmed.charAt(0).toUpperCase() : "";
        const groupName = letter && /[A-Z]/.test(letter) ? letter : "#";
        groupKeys.push({
          key: `first_letter_${groupName}`,
          name: groupName === "#" ? "Other" : groupName,
        });
      }
      break;

    case "parent":
      {
        const parent =
          item._raw?.parent?.node ||
          (item._raw?.parentName
            ? { databaseId: item._raw?.parentDatabaseId, name: item._raw?.parentName }
            : null);
        if (parent?.name) {
          groupKeys.push({
            key: `parent_${parent.databaseId || parent.name}`,
            name: parent.name,
          });
        } else {
          groupKeys.push({
            key: "parent_root",
            name: "Top Level",
          });
        }
      }
      break;

    default:
      // Check if it's a custom taxonomy
      if (groupByValue && item._raw?.[groupByValue]) {
        // GraphQL custom taxonomy format
        const terms = item._raw[groupByValue]?.nodes || [];
        terms.forEach((term) => {
          groupKeys.push({
            key: `${groupByValue}_${term.databaseId || term.id}`,
            name: term.name,
          });
        });
      }
      break;
  }

  // If no groups found, add to "Uncategorized"
  if (groupKeys.length === 0) {
    groupKeys.push({
      key: "uncategorized",
      name: "Uncategorized",
    });
  }

  return groupKeys;
};

/**
 * Group data based on grouping settings
 * @param {Array} data - The data to group
 * @param {Object} grouping - Grouping configuration
 * @param {Array|null} filteredCategoryIds - Optional: category IDs to limit groups to (from category meta filter)
 * @returns {Array} Grouped data structure
 */
export const groupData = (data, grouping, filteredCategoryIds = null) => {
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

  console.log("[Grouping Helper] Grouping data by:", group_by);
  console.log("[Grouping Helper] Group by 2:", group_by_2);
  console.log("[Grouping Helper] Has nested grouping:", hasNestedGrouping);
  console.log("[Grouping Helper] Filtered category IDs:", filteredCategoryIds);

  // Create groups
  const groups = {};

  data.forEach((item) => {
    // Get level 1 group keys using helper
    // Pass filteredCategoryIds only if grouping by category
    const shouldFilterCategories =
      group_by === "category" && filteredCategoryIds && filteredCategoryIds.length > 0;
    const level1GroupKeys = getGroupKeys(
      item,
      group_by,
      shouldFilterCategories ? filteredCategoryIds : null
    );

    // If item has no groups, add to uncategorized
    if (level1GroupKeys.length === 0) {
      level1GroupKeys.push({
        key: "uncategorized",
        name: "Uncategorized",
      });
    }

    // Add item to each level 1 group
    level1GroupKeys.forEach(({ key, name }) => {
      if (!groups[key]) {
        groups[key] = {
          groupKey: key,
          groupName: name,
          items: hasNestedGrouping ? {} : [], // Use object for nested grouping, array otherwise
          uncategorizedItems: [], // Items without level 2 groups (for nested grouping)
        };
      }

      if (hasNestedGrouping) {
        // Get level 2 group keys
        const level2GroupKeys = getGroupKeys(item, group_by_2);

        // Check if item has level 2 groups
        if (level2GroupKeys.length === 0 || level2GroupKeys[0].key === "uncategorized") {
          // No level 2 groups - add to uncategorizedItems array (rendered at top)
          groups[key].uncategorizedItems.push(item);
        } else {
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
        }
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

  // Sort groups
  switch (sort_groups) {
    case "count_desc":
      groupedArray.sort((a, b) => {
        // Uncategorized always first
        if (a.groupKey === "uncategorized") return -1;
        if (b.groupKey === "uncategorized") return 1;
        return getTotalCount(b) - getTotalCount(a);
      });
      break;
    case "count_asc":
      groupedArray.sort((a, b) => {
        // Uncategorized always first
        if (a.groupKey === "uncategorized") return -1;
        if (b.groupKey === "uncategorized") return 1;
        return getTotalCount(a) - getTotalCount(b);
      });
      break;
    case "alphabetical":
    default:
      groupedArray.sort((a, b) => {
        // Uncategorized and standard always first (no group heading)
        if (a.groupKey === "uncategorized" || a.groupKey === "content_type_standard") return -1;
        if (b.groupKey === "uncategorized" || b.groupKey === "content_type_standard") return 1;

        // Check if both are years (4-digit numbers)
        const aIsYear = /^\d{4}$/.test(a.groupName);
        const bIsYear = /^\d{4}$/.test(b.groupName);

        if (aIsYear && bIsYear) {
          // Both are years - sort descending (newest first)
          return parseInt(b.groupName) - parseInt(a.groupName);
        } else if (aIsYear && !bIsYear) {
          // Years come before non-years
          return -1;
        } else if (!aIsYear && bIsYear) {
          // Years come before non-years
          return 1;
        } else {
          // Both are non-years - sort alphabetically
          return a.groupName.localeCompare(b.groupName);
        }
      });
      break;
  }

  // If nested grouping, sort subgroups too
  if (hasNestedGrouping) {
    groupedArray.forEach((group) => {
      if (Array.isArray(group.items)) {
        switch (sort_groups) {
          case "count_desc":
            group.items.sort((a, b) => b.items.length - a.items.length);
            break;
          case "count_asc":
            group.items.sort((a, b) => a.items.length - b.items.length);
            break;
          case "alphabetical":
          default:
            group.items.sort((a, b) => {
              // Check if both are years (4-digit numbers)
              const aIsYear = /^\d{4}$/.test(a.groupName);
              const bIsYear = /^\d{4}$/.test(b.groupName);

              if (aIsYear && bIsYear) {
                // Both are years - sort descending (newest first)
                return parseInt(b.groupName) - parseInt(a.groupName);
              } else if (aIsYear && !bIsYear) {
                // Years come before non-years
                return -1;
              } else if (!aIsYear && bIsYear) {
                // Years come before non-years
                return 1;
              } else {
                // Both are non-years - sort alphabetically
                return a.groupName.localeCompare(b.groupName);
              }
            });
            break;
        }
      }
    });
  }

  console.log("[Grouping Helper] Created groups:", groupedArray.length);
  console.log(
    "[Grouping Helper] Sample group:",
    groupedArray[0]
      ? {
          key: groupedArray[0].groupKey,
          name: groupedArray[0].groupName,
          count: getTotalCount(groupedArray[0]),
        }
      : "none"
  );

  return groupedArray;
};
