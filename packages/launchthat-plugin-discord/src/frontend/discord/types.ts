export type DiscordUiApi = {
  queries: {
    getOrgConfig: any;
    listGuildConnectionsForOrg: any;
    getGuildSettings: any;
    getTemplate: any;
    getMyDiscordLink: any;
  };
  mutations: {
    upsertGuildSettings: any;
    upsertTemplate: any;
    unlinkMyDiscordLink: any;
  };
  actions: {
    startBotInstall: any;
    disconnectGuild: any;
    startUserLink: any;
  };
};

export type DiscordPageProps = {
  api: DiscordUiApi;
  organizationId?: string;
  basePath?: string;
  className?: string;
};

export type DiscordGuildSettingsPageProps = DiscordPageProps & {
  guildId: string;
};

export type DiscordTemplatesPageProps = DiscordPageProps & {
  guildId?: string;
};

export type DiscordLinkComponentProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export type DiscordLinkComponent =
  React.ComponentType<DiscordLinkComponentProps>;
