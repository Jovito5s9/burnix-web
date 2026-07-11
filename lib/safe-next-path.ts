export function getSafeNextPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://burnix.local");
    if (parsed.origin !== "https://burnix.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
