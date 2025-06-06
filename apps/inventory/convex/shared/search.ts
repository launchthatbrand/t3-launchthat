/**
 * Normalizes a string for search by converting to lowercase,
 * removing diacritics, and replacing common special characters
 * @param text - The text to normalize
 * @returns The normalized text
 */
export const normalizeSearchText = (text: string): string => {
  if (!text) return "";

  // Convert to lowercase
  return (
    text
      .toLowerCase()
      // Remove diacritics
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Replace common special characters with spaces
      .replace(/[^\w\s]/g, " ")
      // Replace multiple spaces with a single space
      .replace(/\s+/g, " ")
      .trim()
  );
};

/**
 * Generates search tokens from a string by breaking it into words and normalizing
 * @param text - The text to tokenize
 * @returns Array of search tokens
 */
export const generateSearchTokens = (text: string): string[] => {
  if (!text) return [];

  const normalized = normalizeSearchText(text);
  return normalized.split(/\s+/).filter((token) => token.length > 1); // Filter out single-character tokens
};

/**
 * Creates a search filter predicate function for Convex queries
 * @param searchText - The search text
 * @param fields - The fields to search in (e.g., ['name', 'description'])
 * @returns A function that returns true if any field contains the search text
 */
export const createSearchFilter = (
  searchText: string,
  fields: string[],
): ((item: Record<string, unknown>) => boolean) => {
  if (!searchText || !fields.length) {
    return () => true;
  }

  const normalizedSearch = normalizeSearchText(searchText);
  const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);

  return (item) => {
    if (!searchTerms.length) return true;

    // Check if any of the fields contain all search terms
    return fields.some((field) => {
      const fieldValue =
        item[field] !== undefined && item[field] !== null
          ? String(item[field])
          : "";
      const normalizedField = normalizeSearchText(fieldValue);

      return searchTerms.every((term) => normalizedField.includes(term));
    });
  };
};

/**
 * Scores search results based on relevance to the search query
 * @param item - The item to score
 * @param searchText - The search text
 * @param fields - The fields to consider, with optional weight
 * @returns The relevance score
 */
export const scoreSearchResult = (
  item: Record<string, unknown>,
  searchText: string,
  fields: (string | { field: string; weight: number })[],
): number => {
  if (!searchText) return 0;

  const normalizedSearch = normalizeSearchText(searchText);
  const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);

  if (!searchTerms.length) return 0;

  let totalScore = 0;

  fields.forEach((fieldDef) => {
    // Extract field name and weight
    let fieldName: string;
    let weight = 1.0;

    if (typeof fieldDef === "string") {
      fieldName = fieldDef;
    } else {
      fieldName = fieldDef.field;
      weight = fieldDef.weight !== undefined ? fieldDef.weight : 1.0;
    }

    const fieldValue =
      item[fieldName] !== undefined && item[fieldName] !== null
        ? String(item[fieldName])
        : "";
    const normalizedField = normalizeSearchText(fieldValue);

    // Score based on term presence
    searchTerms.forEach((term) => {
      if (normalizedField.includes(term)) {
        // Exact match score
        if (normalizedField === term) {
          totalScore += 10 * weight;
        }
        // Starts with term score
        else if (normalizedField.startsWith(term)) {
          totalScore += 5 * weight;
        }
        // Contains term score
        else {
          totalScore += 1 * weight;
        }
      }
    });
  });

  return totalScore;
};
