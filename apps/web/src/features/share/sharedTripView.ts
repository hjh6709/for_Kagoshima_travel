import type { ChecklistItemResponse } from "../../api/checklist";
import type { SharedSchedule } from "../../api/schedules";
import { clampDate, type TravelPhase } from "../../shared/date";

export function getSharedFocusDate(startDate: string, endDate: string, today: string) {
  return clampDate(today, startDate, endDate);
}

export function getSharedSchedulesForDate(
  schedules: SharedSchedule[],
  focusDate: string,
): SharedSchedule[] {
  return schedules
    .filter((schedule) => schedule.date === focusDate)
    .sort((left, right) => left.time.localeCompare(right.time));
}

export function getSharedChecklistForPhase(
  checklist: readonly ChecklistItemResponse[],
  phase: TravelPhase,
): readonly ChecklistItemResponse[] {
  const category = phase === "before" ? "before" : phase === "during" ? "daily" : "return";
  return checklist.filter((item) => item.category === category);
}
