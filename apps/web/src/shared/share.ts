export function toAbsoluteWebURL(path: string) {
  return new URL(path, window.location.origin).toString();
}

export function getShareTokenFromPath(path: string) {
  const match = path.match(/^\/share\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}
