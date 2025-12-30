interface BucketState {
  count: number;
  expiresAt: number;
}

const getStore = (): Map<string, BucketState> => {
  const g = globalThis as unknown as { __supportIpRateLimit?: Map<string, BucketState> };
  if (!g.__supportIpRateLimit) {
    g.__supportIpRateLimit = new Map<string, BucketState>();
  }
  return g.__supportIpRateLimit;
};

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : req.headers.get("x-real-ip") ?? "unknown";
}

export function checkIpRateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = Math.floor(now / args.windowMs);
  const bucketKey = `${args.key}:${windowStart}`;
  const store = getStore();

  const existing = store.get(bucketKey);
  if (!existing || existing.expiresAt <= now) {
    store.set(bucketKey, { count: 1, expiresAt: now + args.windowMs });
    return { allowed: true };
  }

  if (existing.count >= args.limit) {
    return { allowed: false, retryAfterMs: Math.max(0, existing.expiresAt - now) };
  }

  existing.count += 1;
  store.set(bucketKey, existing);
  return { allowed: true };
}


