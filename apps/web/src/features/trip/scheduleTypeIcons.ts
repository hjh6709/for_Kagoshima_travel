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
