/**
 * Data Source Registry
 * Central registry for managing data source providers (WordPress, Shopify, etc.)
 */
export const dataSourceRegistry = {
  providers: {},

  register(name, config) {
    this.providers[name] = config;
  },

  get(name) {
    return this.providers[name];
  },

  getAll() {
    return this.providers;
  },

  getOptions() {
    return [
      { label: "None", value: "" },
      ...Object.keys(this.providers).map((key) => ({
        label: this.providers[key].label,
        value: key,
      })),
    ];
  },
};
