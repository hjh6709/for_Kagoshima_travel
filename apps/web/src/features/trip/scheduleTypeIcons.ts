import {
  BedDouble,
  Camera,
  Flag,
  MapPin,
  Navigation,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { ScheduleItem } from "../../types/travel";

// 일정 카드의 아이콘 타일에 쓴다. 종류가 늘면 여기에만 추가하면 된다.
export const scheduleTypeIcons: Record<ScheduleItem["type"], LucideIcon> = {
  move: Navigation,
  meal: Utensils,
  golf: Flag,
  sightseeing: Camera,
  hotel: BedDouble,
  shopping: ShoppingBag,
  etc: MapPin,
};

// item.type이 알려진 값이 아니면(레거시 데이터, 다른 클라이언트가 보낸 값 등)
// scheduleTypeIcons[type]이 undefined가 되고, 그대로 렌더하면 "Element type is
// invalid" 크래시로 화면 전체가 죽는다 — 라벨은 getScheduleTypeLabel처럼 안전하게
// 폴백하도록 아이콘도 같은 패턴으로 감싼다.
export function getScheduleTypeIcon(type: string): LucideIcon {
  return scheduleTypeIcons[type as ScheduleItem["type"]] ?? MapPin;
}
