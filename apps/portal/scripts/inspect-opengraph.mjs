 

const META_TAG_RE = /<meta\s+[^>]*>/gi;
const ATTR_RE = /(\w+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const LINK_TAG_RE = /<link\s+[^>]*>/gi;

function parseAttrs(tag) {
  const attrs = {};
  let match;
  while ((match = ATTR_RE.exec(tag))) {
    const key = match[1]?.toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    if (key) attrs[key] = value;
  }
  return attrs;
}

function extractMeta(html) {
  const meta = {};
  const tags = html.match(META_TAG_RE) ?? [];
  for (const tag of tags) {
    const attrs = parseAttrs(tag);
    const key = attrs.property || attrs.name;
    const content = attrs.content;
    if (!key || !content) continue;
    meta[key] = content;
  }
  return meta;
}

function extractCanonical(html) {
  const tags = html.match(LINK_TAG_RE) ?? [];
  for (const tag of tags) {
    const attrs = parseAttrs(tag);
    if ((attrs.rel ?? "").toLowerCase() === "canonical" && attrs.href) {
      return attrs.href;
    }
  }
  return undefined;
}

async function main() {
  const url = process.argv[2];
  const hostFlagIndex = process.argv.indexOf("--host");
  const hostOverride =
    hostFlagIndex !== -1 ? process.argv[hostFlagIndex + 1] : undefined;
  if (!url) {
    console.error(
      "Usage: pnpm -C apps/portal seo:inspect <url> [--host <host:port>]\nExample: pnpm -C apps/portal seo:inspect http://127.0.0.1:3024/course/forex-course --host wall-street-academy.localhost:3024",
    );
    process.exit(1);
  }

  const requestHeaders = {
    ...(hostOverride ? { host: hostOverride } : {}),
    ...(hostOverride ? { "x-forwarded-host": hostOverride } : {}),
    ...(hostOverride ? { "x-forwarded-proto": "http" } : {}),
    "x-seo-inspector": "1",
    "user-agent":
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    accept: "text/html,application/xhtml+xml",
  };

  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      ...requestHeaders,
    },
  });

  const html = await res.text();
  const meta = extractMeta(html);
  const canonical = extractCanonical(html);

  const keys = [
    "og:url",
    "og:type",
    "og:title",
    "og:description",
    "og:image",
    "og:image:secure_url",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ];

  console.log(`Status: ${res.status}`);
  console.log(`Final URL: ${res.url}`);
  if (canonical) console.log(`Canonical: ${canonical}`);
  console.log("");

  for (const key of keys) {
    if (meta[key]) console.log(`${key}: ${meta[key]}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


