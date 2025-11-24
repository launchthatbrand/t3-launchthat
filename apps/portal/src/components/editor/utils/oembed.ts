export interface OEmbedPayload {
  url: string;
  html: string;
  providerName?: string;
  title?: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

interface RawOEmbedResponse {
  html?: string;
  provider_name?: string;
  title?: string;
  width?: number;
  height?: number;
  thumbnail_url?: string;
}

interface OEmbedProvider {
  name: string;
  displayName: string;
  matcher: RegExp;
  endpoint: string;
}

const OEMBED_PROVIDERS: readonly OEmbedProvider[] = [
  {
    name: "vimeo",
    displayName: "Vimeo",
    matcher: /^https?:\/\/(www\.)?vimeo\.com\/.+/i,
    endpoint: "https://vimeo.com/api/oembed.json",
  },
  {
    name: "vimeo-player",
    displayName: "Vimeo",
    matcher: /^https?:\/\/player\.vimeo\.com\/video\/.+/i,
    endpoint: "https://vimeo.com/api/oembed.json",
  },
];

const buildEndpointUrl = (provider: OEmbedProvider, url: string) => {
  const searchParams = new URLSearchParams({
    url,
    format: "json",
  });

  return `${provider.endpoint}?${searchParams.toString()}`;
};

const extractProvider = (url: string) =>
  OEMBED_PROVIDERS.find((provider) => provider.matcher.test(url)) ?? null;

const normalizeResponse = (
  url: string,
  provider: OEmbedProvider,
  response: RawOEmbedResponse,
): OEmbedPayload | null => {
  if (!response.html) {
    return null;
  }

  return {
    url,
    html: response.html,
    providerName: response.provider_name ?? provider.displayName,
    title: response.title,
    width: typeof response.width === "number" ? response.width : undefined,
    height: typeof response.height === "number" ? response.height : undefined,
    thumbnailUrl: response.thumbnail_url,
  };
};

export const isLikelyOEmbedUrl = (text: string) => {
  if (!text || /\s/.test(text)) {
    return false;
  }

  try {
    const candidate = new URL(text);
    return extractProvider(candidate.toString()) !== null;
  } catch {
    return false;
  }
};

export const fetchOEmbedPayload = async (
  url: string,
): Promise<OEmbedPayload | null> => {
  const provider = extractProvider(url);

  if (!provider) {
    return null;
  }

  try {
    const response = await fetch(buildEndpointUrl(provider, url));
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as RawOEmbedResponse;
    return normalizeResponse(url, provider, json);
  } catch {
    return null;
  }
};
