import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

// Define extraction rule types
interface RegexExtractionRule {
  regex: string;
  flags?: string;
  group?: number;
}

interface PositionExtractionRule {
  before?: string;
  after?: string;
  maxLength?: number;
}

interface BooleanExtractionRule {
  contains?: string;
  regex?: string;
  flags?: string;
}

interface ListExtractionRule {
  itemPrefix?: string;
  regex?: string;
  flags?: string;
  group?: number;
}

type ExtractionRule = RegexExtractionRule &
  PositionExtractionRule &
  BooleanExtractionRule &
  ListExtractionRule;

interface TemplateField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  extractionRules?: ExtractionRule;
}

interface Template {
  userId: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  createdAt: number;
  updatedAt: number;
}

interface ParsedData {
  [key: string]:
    | string
    | number
    | boolean
    | string[]
    | null
    | { amount: number; currency: string }
    | null;
}

/**
 * Extract structured data from email content based on templates
 */
export const parseEmail = mutation({
  args: {
    emailId: v.id("emails"),
    templateId: v.optional(v.id("templates")),
  },
  handler: async (ctx, args) => {
    // Ensure the user is authenticated
    const userId = await requireUser(ctx);

    // Get the email
    const email = await ctx.db.get(args.emailId);
    if (!email) {
      throw new ConvexError("Email not found");
    }

    // Check permissions
    if (email.userId !== userId) {
      // Check if the email is shared with the user
      const isShared = await ctx.db
        .query("sharedResources")
        .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
          q.eq("resourceId", args.emailId).eq("sharedWithUserId", userId),
        )
        .unique();

      if (!isShared) {
        throw new ConvexError("You don't have permission to access this email");
      }
    }

    // If a template is specified, get it
    let template = null;
    if (args.templateId) {
      template = await ctx.db.get(args.templateId);
      if (!template) {
        throw new ConvexError("Template not found");
      }

      // Check permissions for the template
      if (template.userId !== userId) {
        // Check if the template is shared with the user
        const isShared = await ctx.db
          .query("sharedResources")
          .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
            q.eq("resourceId", args.templateId).eq("sharedWithUserId", userId),
          )
          .unique();

        if (!isShared) {
          throw new ConvexError(
            "You don't have permission to use this template",
          );
        }
      }
    }

    // Extract data from the email
    const extractedData = template
      ? parseEmailWithTemplate(email.content, template as Template)
      : parseEmailGeneric(email.content);

    // Store the parsed result
    const parsedResultId = await ctx.db.insert("parsedResults", {
      userId,
      emailId: args.emailId,
      templateId: args.templateId,
      data: extractedData,
      createdAt: Date.now(),
    });

    return parsedResultId;
  },
});

/**
 * Parse an email using a template
 * This is a helper function that applies a template's rules to extract data
 */
function parseEmailWithTemplate(
  emailContent: string,
  template: Template,
): ParsedData {
  const result: ParsedData = {};

  try {
    // Process each field in the template
    for (const field of template.fields ?? []) {
      const { name, type, extractionRules } = field;

      // Skip fields without extraction rules
      if (!extractionRules) continue;

      // Apply extraction rules based on type
      if (type === "text") {
        // Extract text based on patterns or positions
        result[name] = extractTextByRules(emailContent, extractionRules);
      } else if (type === "date") {
        // Extract and format date
        const extractedText = extractTextByRules(emailContent, extractionRules);
        result[name] = parseDateFromText(extractedText);
      } else if (type === "number") {
        // Extract and parse number
        const extractedText = extractTextByRules(emailContent, extractionRules);
        result[name] = parseNumberFromText(extractedText);
      } else if (type === "currency") {
        // Extract and parse currency amount
        const extractedText = extractTextByRules(emailContent, extractionRules);
        result[name] = parseCurrencyFromText(extractedText);
      } else if (type === "boolean") {
        // Check for presence of specific text
        result[name] = checkBooleanCondition(emailContent, extractionRules);
      } else if (type === "list") {
        // Extract list of items
        result[name] = extractListItems(emailContent, extractionRules);
      }
    }

    return result;
  } catch (error) {
    console.error("Error parsing email with template:", error);
    // Return partial results on error
    return result;
  }
}

/**
 * Parse an email without a template using generic extraction
 * This uses common patterns to identify data
 */
function parseEmailGeneric(emailContent: string): ParsedData {
  const result: ParsedData = {};

  try {
    // Extract key-value pairs using common patterns
    result.keyValuePairs = extractKeyValuePairs(emailContent);

    // Extract dates
    result.dates = extractDates(emailContent);

    // Extract monetary amounts
    result.amounts = extractCurrencyAmounts(emailContent);

    // Extract URLs
    result.urls = extractUrls(emailContent);

    // Extract potential names (proper nouns)
    result.names = extractProperNouns(emailContent);

    // Extract email addresses
    result.emailAddresses = extractEmailAddresses(emailContent);

    // Extract phone numbers
    result.phoneNumbers = extractPhoneNumbers(emailContent);

    return result;
  } catch (error) {
    console.error("Error parsing email with generic extraction:", error);
    return result;
  }
}

/**
 * Extract text based on extraction rules
 */
function extractTextByRules(content: string, rules: ExtractionRule): string {
  // Implementation depends on the structure of rules
  if (rules.regex) {
    // Extract using regex
    const regex = new RegExp(rules.regex, rules.flags ?? "");
    const match = content.match(regex);
    return match ? (rules.group ? match[rules.group] : match[0]) : "";
  }

  if (rules.before && rules.after) {
    // Extract text between two strings
    const beforeIndex = content.indexOf(rules.before);
    if (beforeIndex === -1) return "";

    const startIndex = beforeIndex + rules.before.length;
    const afterIndex = content.indexOf(rules.after, startIndex);
    if (afterIndex === -1) return "";

    return content.substring(startIndex, afterIndex).trim();
  }

  if (rules.after) {
    // Extract text after a string
    const afterIndex = content.indexOf(rules.after);
    if (afterIndex === -1) return "";

    const startIndex = afterIndex + rules.after.length;
    const endIndex = rules.maxLength
      ? startIndex + rules.maxLength
      : content.length;

    return content.substring(startIndex, endIndex).trim();
  }

  if (rules.before) {
    // Extract text before a string
    const beforeIndex = content.indexOf(rules.before);
    if (beforeIndex === -1) return "";

    const startIndex = rules.maxLength
      ? Math.max(0, beforeIndex - rules.maxLength)
      : 0;

    return content.substring(startIndex, beforeIndex).trim();
  }

  return "";
}

/**
 * Parse date from text
 */
function parseDateFromText(text: string): number | null {
  if (!text) return null;

  try {
    // Try to parse as ISO date first
    const isoDate = new Date(text);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.getTime();
    }

    // Try various date formats
    const datePatterns = [
      // MM/DD/YYYY
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      // MM-DD-YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
      // Month DD, YYYY
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{1,2}),? (\d{4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        // Convert to Date object based on pattern
        let date: Date;
        if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
          // MM/DD/YYYY or MM-DD-YYYY
          date = new Date(
            Number(match[3]),
            Number(match[1]) - 1,
            Number(match[2]),
          );
        } else {
          // Month DD, YYYY
          const months = [
            "jan",
            "feb",
            "mar",
            "apr",
            "may",
            "jun",
            "jul",
            "aug",
            "sep",
            "oct",
            "nov",
            "dec",
          ];
          const month = months.indexOf(match[1].toLowerCase().substring(0, 3));
          date = new Date(Number(match[3]), month, Number(match[2]));
        }

        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}

/**
 * Parse number from text
 */
function parseNumberFromText(text: string): number | null {
  if (!text) return null;

  try {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^\d.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  } catch (error) {
    console.error("Error parsing number:", error);
    return null;
  }
}

/**
 * Parse currency amount from text
 */
function parseCurrencyFromText(
  text: string,
): { amount: number; currency: string } | null {
  if (!text) return null;

  try {
    // Detect currency symbol/code
    const currencyRegex = /(\$|€|£|USD|EUR|GBP)/i;
    const currencyMatch = currencyRegex.exec(text);
    const currency = currencyMatch ? currencyMatch[1].toUpperCase() : "USD";

    // Extract the numeric amount
    const amount = parseNumberFromText(text);

    return amount !== null ? { amount, currency } : null;
  } catch (error) {
    console.error("Error parsing currency:", error);
    return null;
  }
}

/**
 * Check boolean condition in text
 */
function checkBooleanCondition(
  content: string,
  rules: ExtractionRule,
): boolean {
  if (rules.contains) {
    return content.includes(rules.contains);
  }

  if (rules.regex) {
    const regex = new RegExp(rules.regex, rules.flags ?? "");
    return regex.test(content);
  }

  return false;
}

/**
 * Extract list items from text
 */
function extractListItems(content: string, rules: ExtractionRule): string[] {
  const items: string[] = [];

  try {
    if (rules.itemPrefix) {
      // Split by newlines and look for prefixed items
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith(rules.itemPrefix)) {
          const item = trimmedLine.substring(rules.itemPrefix.length).trim();
          if (item) {
            items.push(item);
          }
        }
      }
    }

    if (rules.regex && rules.group !== undefined) {
      // Extract items using regex with capturing group
      const regex = new RegExp(rules.regex, rules.flags ?? "g");
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (rules.group < match.length) {
          const item = match[rules.group].trim();
          if (item) {
            items.push(item);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error extracting list items:", error);
  }

  return items;
}

/**
 * Extract key-value pairs from text
 */
function extractKeyValuePairs(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  try {
    // Look for patterns like "Key: Value" or "Key = Value"
    const lines = content.split("\n");
    const colonRegex = /^([^:]+):\s*(.+)$/;
    const equalsRegex = /^([^=]+)=\s*(.+)$/;

    for (const line of lines) {
      // Try "Key: Value" pattern
      const colonMatch = colonRegex.exec(line);
      if (colonMatch) {
        const key = colonMatch[1].trim();
        const value = colonMatch[2].trim();
        if (key && value) {
          result[key] = value;
        }
        continue;
      }

      // Try "Key = Value" pattern
      const equalsMatch = equalsRegex.exec(line);
      if (equalsMatch) {
        const key = equalsMatch[1].trim();
        const value = equalsMatch[2].trim();
        if (key && value) {
          result[key] = value;
        }
      }
    }
  } catch (error) {
    console.error("Error extracting key-value pairs:", error);
  }

  return result;
}

/**
 * Extract dates from text
 */
function extractDates(content: string): number[] {
  const dates: number[] = [];

  try {
    // Common date patterns
    const datePatterns = [
      // ISO date (YYYY-MM-DD)
      /\b(\d{4})-(\d{2})-(\d{2})\b/g,
      // MM/DD/YYYY
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
      // MM-DD-YYYY
      /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/g,
      // Month DD, YYYY
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{1,2}),? (\d{4})\b/gi,
    ];

    // Extract dates using each pattern
    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const dateText = match[0];
        const parsedDate = parseDateFromText(dateText);
        if (parsedDate !== null) {
          dates.push(parsedDate);
        }
      }
    }
  } catch (error) {
    console.error("Error extracting dates:", error);
  }

  return dates;
}

/**
 * Extract currency amounts from text
 */
function extractCurrencyAmounts(
  content: string,
): { amount: number; currency: string }[] {
  const amounts: { amount: number; currency: string }[] = [];

  try {
    // Currency patterns
    const patterns = [
      // $X,XXX.XX
      /\$\s?(\d{1,3}(,\d{3})*(\.\d{1,2})?)/g,
      // X,XXX.XX USD/EUR/GBP
      /(\d{1,3}(,\d{3})*(\.\d{1,2})?)\s?(USD|EUR|GBP)/g,
      // EUR/GBP X,XXX.XX
      /(EUR|GBP)\s?(\d{1,3}(,\d{3})*(\.\d{1,2})?)/g,
    ];

    // Extract amounts using each pattern
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const amountText = match[0];
        const parsed = parseCurrencyFromText(amountText);
        if (parsed !== null) {
          amounts.push(parsed);
        }
      }
    }
  } catch (error) {
    console.error("Error extracting currency amounts:", error);
  }

  return amounts;
}

/**
 * Extract URLs from text
 */
function extractUrls(content: string): string[] {
  const urls: string[] = [];

  try {
    // URL pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;

    let match;
    while ((match = urlPattern.exec(content)) !== null) {
      urls.push(match[1]);
    }
  } catch (error) {
    console.error("Error extracting URLs:", error);
  }

  return urls;
}

/**
 * Extract proper nouns (potential names) from text
 */
function extractProperNouns(content: string): string[] {
  const properNouns: string[] = [];

  try {
    // Simple pattern for proper nouns (capitalized words not at the start of sentences)
    const lines = content.split("\n");

    for (const line of lines) {
      const words = line.split(" ");
      for (let i = 1; i < words.length; i++) {
        const word = words[i].trim();
        // Check if word starts with capital letter and is not all caps (acronym)
        if (
          word.length > 1 &&
          word.startsWith(word[0].toUpperCase()) &&
          word.slice(1) !== word.slice(1).toUpperCase() &&
          /^[A-Z][a-z]+$/.test(word)
        ) {
          properNouns.push(word);
        }
      }
    }
  } catch (error) {
    console.error("Error extracting proper nouns:", error);
  }

  return properNouns;
}

/**
 * Extract email addresses from text
 */
function extractEmailAddresses(content: string): string[] {
  const emails: string[] = [];

  try {
    // Email pattern
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    let match;
    while ((match = emailPattern.exec(content)) !== null) {
      emails.push(match[0]);
    }
  } catch (error) {
    console.error("Error extracting email addresses:", error);
  }

  return emails;
}

/**
 * Extract phone numbers from text
 */
function extractPhoneNumbers(content: string): string[] {
  const phones: string[] = [];

  try {
    // Phone number patterns
    const phonePatterns = [
      // (XXX) XXX-XXXX
      /\(\d{3}\)\s*\d{3}[-.\s]\d{4}/g,
      // XXX-XXX-XXXX
      /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
      // +X XXX XXX XXXX (international)
      /\+\d{1,2}\s*\d{3}\s*\d{3}\s*\d{4}/g,
    ];

    // Extract phone numbers using each pattern
    for (const pattern of phonePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        phones.push(match[0]);
      }
    }
  } catch (error) {
    console.error("Error extracting phone numbers:", error);
  }

  return phones;
}

/**
 * Get parsed results for an email
 */
export const getParsedResults = query({
  args: {
    emailId: v.id("emails"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    // Get the email to check permissions
    const email = await ctx.db.get(args.emailId);
    if (!email) {
      throw new ConvexError("Email not found");
    }

    // Check permissions
    if (email.userId !== userId) {
      // Check if the email is shared with the user
      const isShared = await ctx.db
        .query("sharedResources")
        .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
          q.eq("resourceId", args.emailId).eq("sharedWithUserId", userId),
        )
        .unique();

      if (!isShared) {
        throw new ConvexError("You don't have permission to access this email");
      }
    }

    // Get parsed results for this email
    const results = await ctx.db
      .query("parsedResults")
      .withIndex("by_emailId", (q) => q.eq("emailId", args.emailId))
      .collect();

    return results;
  },
});
