export type EditSection = "basic" | "places" | "flights" | "schedules" | "checklist" | "share";

const EDIT_SECTIONS: readonly EditSection[] = ["basic", "places", "flights", "schedules", "checklist", "share"];

function isEditSection(value: string): value is EditSection {
  return (EDIT_SECTIONS as readonly string[]).includes(value);
}

export type ManageRoute =
  | { view: "list" }
  | { view: "trip"; tripId: string }
  | { view: "editHub"; tripId: string }
  | { view: "editSection"; tripId: string; section: EditSection };

// "/manage/trips/:id/edit/:section" -> 카테고리 편집 페이지 (section이 알 수 없는 값이면 편집 허브로 되돌린다),
// "/manage/trips/:id/edit" -> 편집 허브, "/manage/trips/:id" -> 보기 화면,
// 그 외 "/manage"로 시작하는 모든 경로 -> 목록 화면.
export function parseManageRoute(pathname: string): ManageRoute {
  const editSectionMatch = pathname.match(/^\/manage\/trips\/([^/]+)\/edit\/([^/]+)\/?$/);
  if (editSectionMatch) {
    const tripId = decodeURIComponent(editSectionMatch[1]);
    const section = decodeURIComponent(editSectionMatch[2]);
    if (isEditSection(section)) {
      return { view: "editSection", tripId, section };
    }
    return { view: "editHub", tripId };
  }

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
