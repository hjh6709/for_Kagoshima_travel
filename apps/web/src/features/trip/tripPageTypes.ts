import type { FormEvent, RefObject } from "react";
import type { TripDates } from "../../shared/date";
import type {
  AccommodationInfo,
  ChecklistItem,
  EmergencyInfo,
  FlightInfo,
  Place,
  RecommendedRoute,
  ScheduleItem,
  Trip,
  UsefulPhrase,
} from "../../types/travel";
import type { ChecklistCategory, Tab } from "./tripViewState";

export type TripPageProps = {
  accommodation: AccommodationInfo;
  activeTab: Tab;
  addressCopied: boolean;
  allChecklist: ChecklistItem[];
  checkedItems: Record<string, boolean>;
  completedCount: number;
  completedScheduleCount: number;
  completedSchedules: Record<string, boolean>;
  contentRef: RefObject<HTMLDivElement | null>;
  dates: string[];
  editTripHref?: string;
  emergencies: EmergencyInfo[];
  flights: FlightInfo[];
  focusCompletedScheduleCount: number;
  focusSchedules: ScheduleItem[];
  getDisplayDate: (dateStr: string) => string;
  getMapUrl: (place?: Place) => string;
  getPlace: (placeId?: string) => Place | undefined;
  groupedChecklist: Array<{ category: ChecklistCategory; label: string; items: ChecklistItem[] }>;
  hiddenChecklistIDs: string[];
  homeChecklistCompletedCount: number;
  homeChecklistItems: ChecklistItem[];
  isChecklistEditing: boolean;
  newChecklistCategory: ChecklistCategory;
  newChecklistTitle: string;
  nextSchedule: ScheduleItem;
  phrases: UsefulPhrase[];
  places: Place[];
  routes: RecommendedRoute[];
  selectedDate: string;
  selectedSchedules: ScheduleItem[];
  trip: Trip;
  tripDates: TripDates;
  travelStatus: { phase: string; label: string; description: string };
  addChecklistItem: (event: FormEvent<HTMLFormElement>) => void;
  copyAccommodationAddress: () => void;
  moveSchedule: (scheduleID: string, direction: "up" | "down") => void;
  removeChecklistItem: (item: ChecklistItem) => void;
  restoreDefaultChecklistItems: () => void;
  setActiveTab: (tab: Tab) => void;
  setIsChecklistEditing: (value: boolean) => void;
  setNewChecklistCategory: (category: ChecklistCategory) => void;
  setNewChecklistTitle: (title: string) => void;
  setSelectedDate: (date: string) => void;
  toggleCheck: (id: string) => void;
  toggleScheduleComplete: (id: string) => void;
  updateTripDate: (field: "startDate" | "endDate", value: string) => void;
  onNavigateToMyPage?: () => void;
  isDemo?: boolean;
};
