import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sanitizeHtml from "sanitize-html";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 1_000_000;

function ipv4ToNumber(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255))
    return undefined;
  return (((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!) >>> 0;
}

function inCidr(ip: number, base: string, prefix: number) {
  const baseNumber = ipv4ToNumber(base)!;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ip & mask) === (baseNumber & mask);
}

export function isPublicIp(address: string) {
  if (address.toLowerCase().startsWith("::ffff:")) return isPublicIp(address.slice(7));
  if (isIP(address) === 4) {
    const value = ipv4ToNumber(address)!;
    const blocked: Array<[string, number]> = [
      ["0.0.0.0", 8],
      ["10.0.0.0", 8],
      ["100.64.0.0", 10],
      ["127.0.0.0", 8],
      ["169.254.0.0", 16],
      ["172.16.0.0", 12],
      ["192.0.0.0", 24],
      ["192.0.2.0", 24],
      ["192.168.0.0", 16],
      ["198.18.0.0", 15],
      ["198.51.100.0", 24],
      ["203.0.113.0", 24],
      ["224.0.0.0", 4],
      ["240.0.0.0", 4],
    ];
    return !blocked.some(([base, prefix]) => inCidr(value, base, prefix));
  }
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    return !(
      value === "::" ||
      value === "::1" ||
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      /^fe[89ab]/.test(value) ||
      value.startsWith("ff") ||
      value.startsWith("2001:db8") ||
      value.startsWith("2001:10") ||
      value.startsWith("64:ff9b:1:")
    );
  }
  return false;
}

export async function validatePublicUrl(raw: string) {
  if (raw.length > 2_048) throw new Error("URL is too long.");
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  if (url.username || url.password)
    throw new Error("URLs with embedded credentials are not supported.");
  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".local") ||
    url.hostname.endsWith(".internal")
  )
    throw new Error("Local or internal hosts are blocked.");
  if (url.port && !["80", "443"].includes(url.port))
    throw new Error("Only standard web ports are supported.");
  const directIp = isIP(url.hostname.replace(/^\[|\]$/g, ""));
  const addresses = directIp
    ? [{ address: url.hostname.replace(/^\[|\]$/g, "") }]
    : await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address)))
    throw new Error("This address is not publicly routable.");
  return url;
}

function htmlToText(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchPublicJobText(raw: string) {
  let current = await validatePublicUrl(raw);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "text/html,text/plain;q=0.9",
        "User-Agent": "OfferLens/0.1 (+https://github.com/)",
      },
      cache: "no-store",
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS)
        throw new Error("The page redirected too many times.");
      current = await validatePublicUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`The page returned HTTP ${response.status}.`);
    const type = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!type.includes("text/html") && !type.includes("text/plain"))
      throw new Error("The page is not HTML or plain text.");
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_RESPONSE_BYTES) throw new Error("The page is too large to import safely.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("The page had no readable body.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("The page exceeded the safe import size.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const decoded = new TextDecoder().decode(bytes);
    const text = type.includes("html") ? htmlToText(decoded) : decoded.trim();
    if (text.length < 80) throw new Error("The page did not contain enough readable job text.");
    return { text: text.slice(0, 60_000), sourceUrl: current.toString() };
  }
  throw new Error("Unable to import the page.");
}
