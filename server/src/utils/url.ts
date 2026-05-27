import dns from 'node:dns/promises';

const privateRanges = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^0\.0\.0\.0$/,
];

// Guards outbound image fetches against SSRF to private/loopback addresses.
export async function assertPublicUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }

  const { address } = await dns.lookup(parsed.hostname);
  if (privateRanges.some((range) => range.test(address))) {
    throw new Error('URL resolves to a private address');
  }
}
