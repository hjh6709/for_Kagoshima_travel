export type ManageRoute =
  | { view: "list" }
  | { view: "trip"; tripId: string }
  | { view: "editHub"; tripId: string };

// "/manage/trips/:id/edit" -> 편집 허브, "/manage/trips/:id" -> 보기 화면,
// 그 외 "/manage"로 시작하는 모든 경로 -> 목록 화면.
export function parseManageRoute(pathname: string): ManageRoute {
  const editHubMatch = pathname.match(/^\/manage\/trips\/([^/]+)\/edit\/?$/);
  if (editHubMatch) {
    return { view: "editHub", tripId: decodeURIComponent(editHubMatch[1]) };
  }

  const tripMatch = pathname.match(/^\/manage\/trips\/([^/]+)\/?$/);
  if (tripMatch) {
    return { view: "trip", tripId: decodeURIComponent(tripMatch[1]) };
  }

  return { view: "list" };
}
