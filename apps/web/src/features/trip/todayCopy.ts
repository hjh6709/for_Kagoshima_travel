import type { TravelPhase } from "../../shared/date";

export type TodayTabCopy = {
  screenTitle: string;
  dayLabel: string;
  scheduleStatLabel: string;
  routeHeading: string;
};

/**
 * 오늘 탭은 여행 전·중·후 모두에서 열린다. 이때 화면이 가리키는 날짜는
 * "오늘"이 아니라 여행의 첫날(여행 전) 또는 마지막 날(여행 후)이므로,
 * 단계에 맞는 문구를 한곳에서 정해 세 섹션이 같은 말을 쓰게 한다.
 */
export function getTodayTabCopy(phase: TravelPhase): TodayTabCopy {
  if (phase === "before") {
    return {
      screenTitle: "출발 준비",
      dayLabel: "첫날",
      scheduleStatLabel: "첫날 일정",
      routeHeading: "첫날 동선",
    };
  }

  if (phase === "after") {
    return {
      screenTitle: "여행 마무리",
      dayLabel: "마지막 날",
      scheduleStatLabel: "마지막 날 일정",
      routeHeading: "마지막 날 동선",
    };
  }

  return {
    screenTitle: "오늘",
    dayLabel: "오늘",
    scheduleStatLabel: "오늘 일정",
    routeHeading: "오늘의 동선",
  };
}
