export interface SupportChatFieldToggles {
  fullName: boolean;
  email: boolean;
  phone: boolean;
  company: boolean;
}

export interface SupportChatSettings {
  requireContact: boolean;
  fields: SupportChatFieldToggles;
  introHeadline: string;
  welcomeMessage: string;
  privacyMessage: string;
}

export const supportChatSettingsOptionKey = "support_chat_settings";

export const defaultSupportChatSettings: SupportChatSettings = {
  requireContact: true,
  fields: {
    fullName: true,
    email: true,
    phone: false,
    company: false,
  },
  introHeadline: "Before we get started",
  welcomeMessage:
    "Tell us a bit more about yourself so we can personalize your experience.",
  privacyMessage:
    "We’ll use this information to reply to your questions and keep you updated.",
};
