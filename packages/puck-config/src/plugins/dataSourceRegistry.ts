/**
 * Data Source Registry
 * Central registry for managing data source providers (WordPress, Shopify, etc.)
 */
export type DataSourceProviderConfig = Record<string, unknown> & {
  label?: string;
};

type RegisteredProviders = Record<string, DataSourceProviderConfig>;

export const dataSourceRegistry = {
  providers: {} as RegisteredProviders,

  register(name: string, config: DataSourceProviderConfig) {
    this.providers[name] = config;
  },

  get(name: string) {
    return this.providers[name];
  },

  getAll() {
    return this.providers;
  },

  getOptions() {
    return [
      { label: "None", value: "" },
      ...Object.keys(this.providers).map((key) => ({
        label: this.providers[key]?.label ?? key,
        value: key,
      })),
    ];
  },
};
