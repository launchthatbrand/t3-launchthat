type EncryptedPayload = {
  v: number;
  alg: "aes-256-gcm";
  ivB64: string;
  tagB64: string;
  dataB64: string;
};

const enc = new TextEncoder();
const dec = new TextDecoder();

const getWebCrypto = (): Crypto => {
  const c = (globalThis as any).crypto as Crypto | undefined;
  if (c?.subtle) return c;

  // In some Node runtimes, WebCrypto may not be global. Fall back to node:crypto.webcrypto
  // via dynamic require (so this module can still be bundled for Convex V8).
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = (0, eval)("require") as (id: string) => any;
    const nodeCrypto = req("node:crypto");
    const wc = nodeCrypto?.webcrypto as Crypto | undefined;
    if (wc?.subtle) return wc;
  } catch {
    // ignore
  }

  throw new Error("WebCrypto is not available in this runtime");
};

const bytesToB64 = (bytes: Uint8Array): string => {
  // Node runtime
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  // Browser/V8 runtime
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

const b64ToBytes = (b64: string): Uint8Array => {
  // Node runtime
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  // Browser/V8 runtime
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const sha256 = async (input: string): Promise<ArrayBuffer> => {
  const wc = getWebCrypto();
  return await wc.subtle.digest("SHA-256", enc.encode(input));
};

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

export const encryptSecret = async (
  plaintext: string,
  keyMaterial: string,
): Promise<string> => {
  const wc = getWebCrypto();
  const keyRaw = await sha256(keyMaterial);
  const key = await wc.subtle.importKey(
    "raw",
    keyRaw,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const iv = wc.getRandomValues(new Uint8Array(12));
  const sealed = await wc.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    enc.encode(plaintext),
  );
  const sealedBytes = new Uint8Array(sealed);
  // WebCrypto AES-GCM appends tag to ciphertext; Node exposes separately.
  const tag = sealedBytes.slice(sealedBytes.length - 16);
  const ciphertext = sealedBytes.slice(0, sealedBytes.length - 16);
  const payload: EncryptedPayload = {
    v: 1,
    alg: "aes-256-gcm",
    ivB64: bytesToB64(iv),
    tagB64: bytesToB64(tag),
    dataB64: bytesToB64(ciphertext),
  };
  const encoded = bytesToB64(enc.encode(JSON.stringify(payload)));
  return `enc_v1:${encoded}`;
};

export const decryptSecret = async (
  ciphertext: string,
  keyMaterial: string,
): Promise<string> => {
  const wc = getWebCrypto();
  if (!ciphertext.startsWith("enc_v1:")) {
    throw new Error("Expected enc_v1 ciphertext");
  }
  const raw = ciphertext.slice("enc_v1:".length);
  const decoded = dec.decode(b64ToBytes(raw));
  const parsed = JSON.parse(decoded) as EncryptedPayload;
  if (parsed.alg !== "aes-256-gcm") {
    throw new Error("Unsupported ciphertext alg");
  }
  const keyRaw = await sha256(keyMaterial);
  const key = await wc.subtle.importKey(
    "raw",
    keyRaw,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const iv = b64ToBytes(parsed.ivB64);
  const tag = b64ToBytes(parsed.tagB64);
  const data = b64ToBytes(parsed.dataB64);
  const sealed = new Uint8Array(data.length + tag.length);
  sealed.set(data, 0);
  sealed.set(tag, data.length);
  const plaintext = await wc.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(sealed),
  );
  return dec.decode(new Uint8Array(plaintext));
};
