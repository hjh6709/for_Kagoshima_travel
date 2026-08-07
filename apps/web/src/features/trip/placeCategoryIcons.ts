import {
  BedDouble,
  Bus,
  Camera,
  Coffee,
  Flag,
  MapPin,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { PlaceCategory } from "../../types/travel";

// 장소 상세 시트의 아이콘 타일에 쓴다.
export const placeCategoryIcons: Record<PlaceCategory, LucideIcon> = {
  hotel: BedDouble,
  meal: Utensils,
  golf: Flag,
  cafe: Coffee,
  sightseeing: Camera,
  shopping: ShoppingBag,
  transport: Bus,
  etc: MapPin,
};
