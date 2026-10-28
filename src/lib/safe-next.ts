/**
 * Only allow redirects to paths on this site; anything else goes to the
 * dashboard. Browsers treat "\" like "/" and drop tabs and newlines in URLs,
 * so "/\evil.com" or "/\t/evil.com" would otherwise leave the site.
 */
export function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || /[\\\s]/.test(value.slice(0, 2)) || value.startsWith("//")) return "/dashboard";
  try {
    const u = new URL(value, "https://placeholder.invalid");
    if (u.host !== "placeholder.invalid") return "/dashboard";
    return u.pathname + u.search + u.hash;
  } catch {
    return "/dashboard";
  }
}
