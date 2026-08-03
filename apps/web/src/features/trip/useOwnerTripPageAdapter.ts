import { useMemo, useRef, useState, type FormEvent } from "react";
import type { ChecklistItemResponse } from "../../api/checklist";
import type { OwnerTrip, SharedFlight, SharedPlace, SharedSchedule } from "../../api/trips";
import {
  clampDate,
  getDateOffset,
  getTodayDateString,
  getTripDateRange,
  getTravelStatus,
  shiftDate,
  type TripDates,
} from "../../shared/date";
import { phrases } from "../../data/sampleTrip";
import type { ChecklistItem } from "../../types/travel";
import {
  deriveAccommodation,
  deriveHomeChecklist,
  deriveEmergencies,
  getOwnerPlaceById,
  getOwnerSchedulesForDate,
  getSavedOwnerScheduleCompletions,
  getSavedOwnerScheduleOrder,
  getSavedOwnerTripDates,
  mapOwnerChecklistItem,
  mapOwnerFlight,
  mapOwnerPlace,
  mapOwnerSchedule,
  saveOwnerScheduleCompletions,
  saveOwnerScheduleOrder,
  saveOwnerTripDates,
} from "./ownerTripAdapter";
import type { TripPageProps } from "./tripPageTypes";
import { getInitialTripView, type ChecklistCategory, type ScheduleOrderByDate, type Tab } from "./tripViewState";

type UseOwnerTripPageAdapterParams = {
  selectedOwnerTrip: OwnerTrip;
  ownerSchedules: SharedSchedule[];
  ownerPlaces: SharedPlace[];
  ownerFlights: SharedFlight[];
  checklistItems: ChecklistItemResponse[];
  checklistError: string;
  checklistSubmitting: boolean;
  newChecklistTitle: string;
  newChecklistCategory: ChecklistCategory;
  newChecklistDate: string;
  onNewChecklistTitleChange: (value: string) => void;
  onNewChecklistCategoryChange: (value: ChecklistCategory) => void;
  onNewChecklistDateChange: (value: string) => void;
  onAddChecklistItem: (event: FormEvent<HTMLFormElement>) => void;
  onToggleChecklistItem: (itemID: string, isCompleted: boolean) => void;
  onDeleteChecklistItem: (itemID: string) => void;
  editFlightsHref: string;
  editPlacesHref: string;
  editSchedulesHref: string;
  editTripHref: string;
};

// 실제 소유자 여행 데이터를 /demo와 동일한 TripPage가 요구하는 props 모양으로 조립한다.
// 새 API 호출은 하지 않는다 — 인자로 받은 값은 전부 useTripManageController가 이미 불러온 것이다.
export function useOwnerTripPageAdapter({
  selectedOwnerTrip,
  ownerSchedules,
  ownerPlaces,
  ownerFlights,
  checklistItems,
  checklistError,
  checklistSubmitting,
  newChecklistTitle,
  newChecklistCategory,
  newChecklistDate,
  onNewChecklistTitleChange,
  onNewChecklistCategoryChange,
  onNewChecklistDateChange,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  editFlightsHref,
  editPlacesHref,
  editSchedulesHref,
  editTripHref,
}: UseOwnerTripPageAdapterParams): TripPageProps {
  const contentRef = useRef<HTMLDivElement>(null);
  const tripId = selectedOwnerTrip.id;
  const initialView = getInitialTripView(window.location.hash);

  const [activeTab, setActiveTab] = useState<Tab>(initialView.activeTab);
  const [scheduleView, setScheduleView] = useState<"itinerary" | "checklist">(initialView.scheduleView);
  const [addressCopied, setAddressCopied] = useState(false);
  const [isChecklistEditing, setIsChecklistEditing] = useState(false);
  const [checklistDateFilter, setChecklistDateFilter] = useState("all");
  const [tripDates, setTripDatesState] = useState<TripDates>(() =>
    getSavedOwnerTripDates(tripId, { startDate: selectedOwnerTrip.startDate, endDate: selectedOwnerTrip.endDate })
  );
  const [completedSchedules, setCompletedSchedulesState] = useState<Record<string, boolean>>(() =>
    getSavedOwnerScheduleCompletions(tripId)
  );
  const [scheduleOrderByDate, setScheduleOrderByDateState] = useState<ScheduleOrderByDate>(() =>
    getSavedOwnerScheduleOrder(tripId)
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => ownerSchedules[0]?.date ?? selectedOwnerTrip.startDate);

  const trip = useMemo(
    () => ({
      title: selectedOwnerTrip.title,
      startDate: selectedOwnerTrip.startDate,
      endDate: selectedOwnerTrip.endDate,
      travelers: selectedOwnerTrip.travelers,
      destinationCountry: selectedOwnerTrip.destinationCountry,
      memo: selectedOwnerTrip.memo,
    }),
    [selectedOwnerTrip]
  );

  const schedules = useMemo(() => ownerSchedules.map(mapOwnerSchedule), [ownerSchedules]);
  const places = useMemo(() => ownerPlaces.map(mapOwnerPlace), [ownerPlaces]);
  const flights = useMemo(() => ownerFlights.map(mapOwnerFlight), [ownerFlights]);
  const allChecklist = useMemo(() => checklistItems.map(mapOwnerChecklistItem), [checklistItems]);
  const checkedItems = useMemo(
    () => Object.fromEntries(checklistItems.map((item) => [item.id, item.isCompleted])),
    [checklistItems]
  );
  const accommodation = useMemo(() => deriveAccommodation(places), [places]);

  const dates = useMemo(() => getTripDateRange(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const selectedSchedules = useMemo(
    () => getOwnerSchedulesForDate(selectedDate, schedules, scheduleOrderByDate),
    [selectedDate, schedules, scheduleOrderByDate]
  );
  const completedScheduleCount = selectedSchedules.filter((item) => completedSchedules[item.id]).length;

  const today = getTodayDateString();
  const travelStatus = getTravelStatus(today, tripDates);
  const displayFocusDate = clampDate(today, tripDates.startDate, tripDates.endDate);
  const focusDateOffset = getDateOffset(tripDates.startDate, displayFocusDate);
  const focusScheduleDate = shiftDate(trip.startDate, focusDateOffset);
  const focusSchedules = useMemo(
    () => getOwnerSchedulesForDate(focusScheduleDate, schedules, scheduleOrderByDate),
    [focusScheduleDate, schedules, scheduleOrderByDate]
  );
  const nextSchedule =
    travelStatus.phase === "after"
      ? null
      : focusSchedules.find((item) => !completedSchedules[item.id]) ??
        schedules.find((item) => item.date > focusScheduleDate && !completedSchedules[item.id]) ??
        null;
  const focusCompletedScheduleCount = focusSchedules.filter((item) => completedSchedules[item.id]).length;

  const homeChecklistCategories: ChecklistCategory[] =
    travelStatus.phase === "before" ? ["before", "airport"] : travelStatus.phase === "during" ? ["daily"] : ["return"];
  const homeChecklist = deriveHomeChecklist(
    allChecklist,
    checkedItems,
    homeChecklistCategories,
    travelStatus.phase === "during" ? focusScheduleDate : undefined,
  );

  const emergencies = useMemo(() => deriveEmergencies(places), [places]);

  function getDisplayDate(dateStr: string) {
    return shiftDate(tripDates.startDate, getDateOffset(trip.startDate, dateStr));
  }

  function getPlace(placeId?: string) {
    return getOwnerPlaceById(placeId, places);
  }

  function updateTripDate(field: "startDate" | "endDate", value: string) {
    if (!value) return;
    const next = { ...tripDates, [field]: value };
    if (next.endDate < next.startDate) {
      next.endDate = next.startDate;
    }
    setTripDatesState(next);
    saveOwnerTripDates(tripId, next);
  }

  function copyAccommodationAddress() {
    navigator.clipboard
      ?.writeText(accommodation.address)
      .then(() => {
        setAddressCopied(true);
        window.setTimeout(() => setAddressCopied(false), 2000);
      })
      .catch(() => {});
  }

  function toggleCheck(id: string) {
    const item = checklistItems.find((checklistItem) => checklistItem.id === id);
    if (!item) return;
    onToggleChecklistItem(id, !item.isCompleted);
  }

  function removeChecklistItem(item: ChecklistItem) {
    onDeleteChecklistItem(item.id);
  }

  // 기본 체크리스트 "숨김/복원" 개념은 실제 데이터 모델에 없다(항목은 삭제로만 없앤다).
  function restoreDefaultChecklistItems() {}

  function toggleScheduleComplete(id: string) {
    const next = { ...completedSchedules, [id]: !completedSchedules[id] };
    setCompletedSchedulesState(next);
    saveOwnerScheduleCompletions(tripId, next);
  }

  function moveSchedule(scheduleID: string, direction: "up" | "down") {
    const currentOrder = selectedSchedules.map((item) => item.id);
    const currentIndex = currentOrder.indexOf(scheduleID);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
    const nextOrderByDate = { ...scheduleOrderByDate, [selectedDate]: nextOrder };
    setScheduleOrderByDateState(nextOrderByDate);
    saveOwnerScheduleOrder(tripId, nextOrderByDate);
  }

  return {
    accommodation,
    activeTab,
    addressCopied,
    allChecklist,
    checkedItems,
    checklistError,
    checklistSubmitting,
    checklistDateFilter,
    completedScheduleCount,
    completedSchedules,
    contentRef,
    dates,
    editFlightsHref,
    editPlacesHref,
    editSchedulesHref,
    editTripHref,
    emergencies,
    flights,
    focusDate: focusScheduleDate,
    focusCompletedScheduleCount,
    focusSchedules,
    getDisplayDate,
    getPlace,
    hiddenChecklistIDs: [],
    homeChecklistCompletedCount: homeChecklist.completedCount,
    homeChecklistItems: homeChecklist.items,
    homeChecklistTotalCount: homeChecklist.totalCount,
    isChecklistEditing,
    newChecklistCategory,
    newChecklistDate,
    newChecklistTitle,
    nextSchedule,
    phrases,
    places,
    routes: [],
    scheduleView,
    selectedDate,
    selectedSchedules,
    trip,
    tripDates,
    travelStatus,
    addChecklistItem: onAddChecklistItem,
    copyAccommodationAddress,
    moveSchedule,
    removeChecklistItem,
    restoreDefaultChecklistItems,
    setActiveTab,
    setChecklistDateFilter,
    setIsChecklistEditing,
    setNewChecklistCategory: onNewChecklistCategoryChange,
    setNewChecklistDate: onNewChecklistDateChange,
    setNewChecklistTitle: onNewChecklistTitleChange,
    setScheduleView,
    setSelectedDate,
    toggleCheck,
    toggleScheduleComplete,
    updateTripDate,
  };
}
