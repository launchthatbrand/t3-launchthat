import { createPublicKey } from "crypto";
import type { KeyLike } from "jose";
import { exportJWK, importPKCS8, importSPKI } from "jose";

import { env } from "~/env";

let cachedPrivateKey: KeyLike | null = null;
let cachedPublicKey: KeyLike | null = null;
let cachedJwks: { keys: Array<Record<string, unknown>> } | null = null;

export async function getLaunchthatIssuer(): Promise<string> {
  const issuer = env.LAUNCHTHAT_JWT_ISSUER_DOMAIN;
  if (!issuer) {
    throw new Error("Missing LAUNCHTHAT_JWT_ISSUER_DOMAIN");
  }
  return issuer;
}

export function getLaunchthatKid(): string {
  const kid = env.LAUNCHTHAT_JWT_KID;
  if (!kid) {
    throw new Error("Missing LAUNCHTHAT_JWT_KID");
  }
  return kid;
}

export async function getLaunchthatPrivateKey(): Promise<KeyLike> {
  if (cachedPrivateKey) return cachedPrivateKey;
  const pk = env.LAUNCHTHAT_JWT_PRIVATE_KEY;
  if (!pk) {
    throw new Error("Missing LAUNCHTHAT_JWT_PRIVATE_KEY");
  }
  cachedPrivateKey = await importPKCS8(pk, "RS256");
  return cachedPrivateKey;
}

export async function getLaunchthatPublicKey(): Promise<KeyLike> {
  if (cachedPublicKey) return cachedPublicKey;

  // Derive the public key from the private key so we only need to store one secret.
  const pk = env.LAUNCHTHAT_JWT_PRIVATE_KEY;
  if (!pk) {
    throw new Error("Missing LAUNCHTHAT_JWT_PRIVATE_KEY");
  }
  const publicPem = createPublicKey(pk).export({
    format: "pem",
    type: "spki",
  }) as string;
  cachedPublicKey = await importSPKI(publicPem, "RS256");
  return cachedPublicKey;
}

export async function getLaunchthatJwks(): Promise<{
  keys: Array<Record<string, unknown>>;
}> {
  if (cachedJwks) return cachedJwks;

  const kid = getLaunchthatKid();
  const pubKey = await getLaunchthatPublicKey();
  const jwk = await exportJWK(pubKey);

  cachedJwks = {
    keys: [
      {
        ...jwk,
        kid,
        use: "sig",
        alg: "RS256",
      },
    ],
  };
  return cachedJwks;
}

