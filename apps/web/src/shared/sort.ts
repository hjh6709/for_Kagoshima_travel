import type { SharedFlight, SharedPlace, SharedSchedule } from "../api/trips";

export function sortSharedSchedules(items: SharedSchedule[]): SharedSchedule[] {
  return [...items].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) return byDate;

    const byTime = left.time.localeCompare(right.time);
    if (byTime !== 0) return byTime;

    return left.title.localeCompare(right.title);
  });
}

export function sortSharedPlaces(items: SharedPlace[]): SharedPlace[] {
  return [...items].sort((left, right) => {
    const byCategory = left.category.localeCompare(right.category);
    if (byCategory !== 0) return byCategory;

    return left.name.localeCompare(right.name);
  });
}

export function sortSharedFlights(items: SharedFlight[]): SharedFlight[] {
  return [...items].sort((left, right) => {
    const byDate = left.departureDate.localeCompare(right.departureDate);
    if (byDate !== 0) return byDate;

    const byTime = left.departureTime.localeCompare(right.departureTime);
    if (byTime !== 0) return byTime;

    return left.label.localeCompare(right.label);
  });
}
