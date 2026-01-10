import crypto from "node:crypto";

type EncryptedPayload = {
  v: 1;
  alg: "aes-256-gcm";
  ivB64: string;
  tagB64: string;
  dataB64: string;
};

const deriveKey = (keyMaterial: string): Buffer => {
  // Allow base64 32-byte key, otherwise hash to 32 bytes.
  if (/^[A-Za-z0-9+/=]+$/.test(keyMaterial) && keyMaterial.length >= 40) {
    const buf = Buffer.from(keyMaterial, "base64");
    if (buf.length === 32) return buf;
  }
  return crypto.createHash("sha256").update(keyMaterial).digest();
};

export const encryptSecret = (plaintext: string, keyMaterial: string): string => {
  const key = deriveKey(keyMaterial);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    v: 1,
    alg: "aes-256-gcm",
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64"),
    dataB64: ciphertext.toString("base64"),
  };

  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  return `enc_v1:${encoded}`;
};

export const decryptSecret = (encoded: string, keyMaterial: string): string => {
  if (!encoded.startsWith("enc_v1:")) {
    throw new Error("Unsupported encrypted secret payload");
  }
  const raw = Buffer.from(encoded.slice("enc_v1:".length), "base64").toString(
    "utf8",
  );
  const parsed = JSON.parse(raw) as EncryptedPayload;
  if (parsed.v !== 1 || parsed.alg !== "aes-256-gcm") {
    throw new Error("Unsupported encrypted secret payload");
  }

  const key = deriveKey(keyMaterial);
  const iv = Buffer.from(parsed.ivB64, "base64");
  const tag = Buffer.from(parsed.tagB64, "base64");
  const data = Buffer.from(parsed.dataB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
};



