// 375는 기준 기기(iPhone SE/13 mini 급), 195는 디자인 스펙이 요구하는 최소 폭이다.
// 195에서 깨진 적이 세 번 있어 스모크의 기본 축으로 둔다.
export const VIEWPORTS = [
  { name: "375x812", width: 375, height: 812 },
  { name: "195x700", width: 195, height: 700 },
] as const;

export type ViewportName = (typeof VIEWPORTS)[number]["name"];
