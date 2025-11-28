/**
 * Theme configuration for CourseBuilderV3 components.
 * Allows customization of colors, spacing, typography, and dark mode.
 */
export interface ThemeConfig {
  colors?: Record<string, string>;
  spacing?: Record<string, string | number>;
  typography?: Record<string, string | number>;
  darkMode?: boolean;
}

/**
 * Sidebar component configuration options.
 */
export interface SidebarConfig {
  collapsible?: boolean;
  showProgress?: boolean;
}

/**
 * Utility type for partial/deep configuration overrides.
 */
export type PartialConfig<T> = {
  [P in keyof T]?: T[P] extends object ? PartialConfig<T[P]> : T[P];
};

/**
 * Accessibility configuration options.
 */
export interface AccessibilityConfig {
  highContrast?: boolean;
  ariaLabels?: Record<string, string>;
}

/**
 * Internationalization (i18n) configuration options.
 */
export interface I18nConfig {
  locale: string;
  translations: Record<string, string>;
}
