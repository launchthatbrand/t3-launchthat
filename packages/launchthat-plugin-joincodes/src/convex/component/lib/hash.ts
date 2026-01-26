const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const hashJoinCode = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(new Uint8Array(digest));
};

export const randomJoinCode = (bytes = 16): string => {
  const raw = new Uint8Array(bytes);
  crypto.getRandomValues(raw);
  return toBase64Url(raw);
};
