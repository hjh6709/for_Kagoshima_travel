// 375는 기준 기기(iPhone SE/13 mini 급), 320은 좁은 실사용 기기,
// 195는 200% 확대까지 포괄하는 디자인 스펙 최소 폭이다.
// 195에서 깨진 적이 세 번 있어 스모크의 기본 축으로 둔다.
export const VIEWPORTS = [
  { name: "375x812", width: 375, height: 812 },
  { name: "320x700", width: 320, height: 700 },
  { name: "195x700", width: 195, height: 700 },
] as const;

export type ViewportName = (typeof VIEWPORTS)[number]["name"];
