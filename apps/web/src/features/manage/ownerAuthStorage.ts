import type { AuthResponse } from "../../api/auth";

export const ownerAuthStorageKey = "travel-app-owner-auth";

// 관리 계정 세션은 브라우저 저장소에서 복원하되, 필요한 최소 필드만 검증한다.
export function getSavedOwnerAuth(): AuthResponse | null {
  const saved = window.localStorage.getItem(ownerAuthStorageKey);
  try {
    const parsed = saved ? JSON.parse(saved) : null;
    if (
      parsed &&
      typeof parsed.accessToken === "string" &&
      typeof parsed.user?.id === "string" &&
      typeof parsed.user?.email === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
