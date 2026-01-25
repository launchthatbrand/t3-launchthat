export type DiscordUiApi = {
  queries: {
    getOrgConfig: any;
    listGuildConnectionsForOrg: any;
    getGuildSettings: any;
    getTemplate: any;
    listTemplates: any;
    getTemplateById: any;
    getMyDiscordLink: any;
    // Optional: host app can provide symbol options for rule builder UI.
    listSymbolOptions: any;
    getRoutingRuleSet: any;
    listRoutingRules: any;
    resolveChannelsForEvent: any;
  };
  mutations: {
    upsertGuildSettings: any;
    upsertTemplate: any;
    createTemplate: any;
    updateTemplate: any;
    deleteTemplate: any;
    unlinkMyDiscordLink: any;
    upsertRoutingRuleSet: any;
    replaceRoutingRules: any;
  };
  actions: {
    startBotInstall: any;
    disconnectGuild: any;
    startUserLink: any;
    listGuildChannels: any;
    sendTestDiscordMessage: any;
  };
};

export type DiscordUiTheme = {
  pageClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  cardClassName?: string;
  cardHeaderClassName?: string;
  cardTitleClassName?: string;
  cardDescriptionClassName?: string;
  cardContentClassName?: string;
  listClassName?: string;
  emptyStateClassName?: string;
  badgeClassName?: string;
  badgePositiveClassName?: string;
  badgeNegativeClassName?: string;
  buttonClassName?: string;
  outlineButtonClassName?: string;
};

export type DiscordPageProps = {
  api: DiscordUiApi;
  organizationId?: string;
  basePath?: string;
  className?: string;
  ui?: DiscordUiTheme;
};

export type DiscordGuildSettingsPageProps = DiscordPageProps & {
  guildId: string;
};

export type DiscordTemplatesPageProps = DiscordPageProps & {
  guildId?: string;
  templateContexts?: DiscordTemplateContext[];
  defaultTemplateKind?: string;
};

export type DiscordChannelField = {
  /**
   * Key in the guildSettings document (e.g. "mentorTradesChannelId").
   * This keeps the mapping UI modular while persisting to the shared plugin table.
   */
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
};

export type DiscordChannelsPageProps = DiscordPageProps & {
  guildId?: string;
  channelFields?: DiscordChannelField[];
};

export type DiscordTemplateField = {
  key: string;
  label: string;
  description?: string;
  example?: string;
};

export type DiscordTemplateContext = {
  kind: string;
  label: string;
  description?: string;
  fields: DiscordTemplateField[];
  defaultTemplate?: string;
};

export type DiscordLinkComponentProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export type DiscordLinkComponent =
  React.ComponentType<DiscordLinkComponentProps>;
