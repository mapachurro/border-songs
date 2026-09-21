export function siteUrl(path = "") {
  const base = import.meta.env.BASE_URL;

  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const cleanPath = path.replace(/^\/+/, "");

  return `${cleanBase}${cleanPath}`;
}
