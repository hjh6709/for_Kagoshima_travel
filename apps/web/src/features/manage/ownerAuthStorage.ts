export const ownerAuthStorageKey = "travel-app-owner-auth";

// 이전 버전이 localStorage에 남긴 JWT를 배포 후 즉시 제거한다.
// 현재 세션은 서버가 발급한 HttpOnly 쿠키로만 복원한다.
export function clearLegacyOwnerAuthStorage() {
  window.localStorage.removeItem(ownerAuthStorageKey);
}
