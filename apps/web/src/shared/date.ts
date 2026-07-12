export type TripDates = {
  startDate: string;
  endDate: string;
};

export type TravelPhase = "before" | "during" | "after";

export function formatKoreanDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]})`;
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
}

export function getDateOffset(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);
}

export function shiftDate(baseDate: string, offset: number): string {
  const date = new Date(`${baseDate}T00:00:00`);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function clampDate(date: string, startDate: string, endDate: string): string {
  if (date < startDate) return startDate;
  if (date > endDate) return endDate;
  return date;
}

export function getTravelPhase(today: string, dates: TripDates): TravelPhase {
  if (today < dates.startDate) return "before";
  if (today > dates.endDate) return "after";
  return "during";
}

export function getTravelStatus(today: string, dates: TripDates): { phase: TravelPhase; label: string; description: string } {
  const phase = getTravelPhase(today, dates);
  if (phase === "before") {
    const daysLeft = Math.max(getDateOffset(today, dates.startDate), 0);
    return {
      phase,
      label: daysLeft === 0 ? "오늘 출발" : `출발 D-${daysLeft}`,
      description: "출발 전 준비물과 항공편을 먼저 확인하세요.",
    };
  }
  if (phase === "after") {
    return {
      phase,
      label: "여행 완료",
      description: "입국 후 짐과 분실물을 한 번 더 확인하세요.",
    };
  }

  const dayNumber = getDateOffset(dates.startDate, today) + 1;
  return {
    phase,
    label: `여행 ${dayNumber}일차`,
    description: "오늘 일정과 다음 이동만 확인하면 됩니다.",
  };
}
