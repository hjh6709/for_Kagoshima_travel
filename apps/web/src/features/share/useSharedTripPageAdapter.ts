import { useMemo, useRef, useState, type FormEvent } from "react";
import type { SharedTripResponse } from "../../api/trips";
import {
  clampDate,
  getTodayDateString,
  getTravelStatus,
  type TripDates,
} from "../../shared/date";
import { checklistCategories } from "../../shared/travelOptions";
import { phrases } from "../../data/sampleTrip";
import {
  deriveAccommodation,
  deriveEmergencies,
  mapOwnerChecklistItem,
  mapOwnerFlight,
  mapOwnerPlace,
  mapOwnerSchedule,
} from "../trip/ownerTripAdapter";
import type { TripPageProps } from "../trip/tripPageTypes";
import type { ChecklistCategory, Tab } from "../trip/tripViewState";

function noOp() {}

// 공개 API 데이터를 실제 여행 화면의 읽기 전용 props로 변환한다.
// 계정 정보와 편집 URL은 만들지 않으며, 공개 화면에서 서버 상태를 변경하는 핸들러도 제공하지 않는다.
export function useSharedTripPageAdapter(sharedTrip: SharedTripResponse): TripPageProps {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [scheduleView, setScheduleView] = useState<"itinerary" | "checklist">("itinerary");
  const [selectedDate, setSelectedDate] = useState(sharedTrip.schedules[0]?.date ?? sharedTrip.trip.startDate);
  const [addressCopied, setAddressCopied] = useState(false);

  const tripDates: TripDates = {
    startDate: sharedTrip.trip.startDate,
    endDate: sharedTrip.trip.endDate,
  };
  const trip = useMemo(
    () => ({
      title: sharedTrip.trip.title,
      startDate: sharedTrip.trip.startDate,
      endDate: sharedTrip.trip.endDate,
      travelers: sharedTrip.trip.travelers,
      destinationCountry: sharedTrip.trip.destinationCountry,
    }),
    [sharedTrip.trip],
  );
  const schedules = useMemo(
    () =>
      sharedTrip.schedules
        .map(mapOwnerSchedule)
        .sort((left, right) => left.date.localeCompare(right.date) || left.time.localeCompare(right.time)),
    [sharedTrip.schedules],
  );
  const places = useMemo(() => sharedTrip.places.map(mapOwnerPlace), [sharedTrip.places]);
  const flights = useMemo(
    () => sharedTrip.flights.map((flight) => ({ ...mapOwnerFlight(flight), memo: undefined })),
    [sharedTrip.flights],
  );
  const allChecklist = useMemo(() => sharedTrip.checklist.map(mapOwnerChecklistItem), [sharedTrip.checklist]);
  const checkedItems = useMemo(
    () => Object.fromEntries(sharedTrip.checklist.map((item) => [item.id, item.isCompleted])),
    [sharedTrip.checklist],
  );
  const completedSchedules = useMemo<Record<string, boolean>>(() => ({}), []);
  const accommodation = useMemo(() => deriveAccommodation(places), [places]);
  const emergencies = useMemo(() => deriveEmergencies(places), [places]);

  const dates = useMemo(() => Array.from(new Set(schedules.map((item) => item.date))), [schedules]);
  const schedulesForDate = (date: string) => schedules.filter((item) => item.date === date);
  const selectedSchedules = schedulesForDate(selectedDate);
  const today = getTodayDateString();
  const focusDate = clampDate(today, tripDates.startDate, tripDates.endDate);
  const focusSchedules = schedulesForDate(focusDate);
  const travelStatus = getTravelStatus(today, tripDates);
  const nextSchedule =
    travelStatus.phase === "after"
      ? null
      : focusSchedules[0] ?? schedules.find((item) => item.date > focusDate) ?? null;

  const homeChecklistCategories: ChecklistCategory[] =
    travelStatus.phase === "before" ? ["before", "airport"] : travelStatus.phase === "during" ? ["daily"] : ["return"];
  const homeChecklistItems = allChecklist.filter((item) => homeChecklistCategories.includes(item.category)).slice(0, 4);
  const homeChecklistCompletedCount = homeChecklistItems.filter((item) => checkedItems[item.id]).length;
  const completedCount = allChecklist.filter((item) => checkedItems[item.id]).length;
  const groupedChecklist = checklistCategories
    .map(([category, label]) => ({
      category,
      label,
      items: allChecklist.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

  function copyAccommodationAddress() {
    if (!accommodation.address || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(accommodation.address)
      .then(() => {
        setAddressCopied(true);
        window.setTimeout(() => setAddressCopied(false), 2000);
      })
      .catch(noOp);
  }

  return {
    accommodation,
    activeTab,
    addressCopied,
    allChecklist,
    checkedItems,
    completedCount,
    completedScheduleCount: 0,
    completedSchedules,
    contentRef,
    dates,
    emergencies,
    flights,
    focusDate,
    focusCompletedScheduleCount: 0,
    focusSchedules,
    getDisplayDate: (date) => date,
    getPlace: (placeID) => places.find((place) => place.id === placeID),
    groupedChecklist,
    hiddenChecklistIDs: [],
    homeChecklistCompletedCount,
    homeChecklistItems,
    isChecklistEditing: false,
    isReadOnly: true,
    newChecklistCategory: "before",
    newChecklistTitle: "",
    nextSchedule,
    phrases,
    places,
    routes: sharedTrip.routes,
    scheduleView,
    selectedDate,
    selectedSchedules,
    trip,
    tripDates,
    travelStatus,
    addChecklistItem: (event: FormEvent<HTMLFormElement>) => event.preventDefault(),
    copyAccommodationAddress,
    moveSchedule: noOp,
    removeChecklistItem: noOp,
    restoreDefaultChecklistItems: noOp,
    setActiveTab,
    setIsChecklistEditing: noOp,
    setNewChecklistCategory: noOp,
    setNewChecklistTitle: noOp,
    setScheduleView,
    setSelectedDate,
    toggleCheck: noOp,
    toggleScheduleComplete: noOp,
    updateTripDate: noOp,
  };
}
