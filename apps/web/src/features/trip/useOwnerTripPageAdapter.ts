import { useMemo, useRef, useState, type FormEvent } from "react";
import type { ChecklistItemResponse } from "../../api/checklist";
import type { OwnerTrip, SharedFlight, SharedPlace, SharedSchedule } from "../../api/trips";
import {
  clampDate,
  getDateOffset,
  getTodayDateString,
  getTravelStatus,
  shiftDate,
  type TripDates,
} from "../../shared/date";
import { checklistCategories } from "../../shared/travelOptions";
import { getGoogleDirectionsUrl } from "../../utils/mapLinks";
import { phrases } from "../../data/sampleTrip";
import type { ChecklistItem, ScheduleItem } from "../../types/travel";
import {
  deriveAccommodation,
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
import type { ChecklistCategory, ScheduleOrderByDate, Tab } from "./tripViewState";

type UseOwnerTripPageAdapterParams = {
  selectedOwnerTrip: OwnerTrip;
  ownerSchedules: SharedSchedule[];
  ownerPlaces: SharedPlace[];
  ownerFlights: SharedFlight[];
  checklistItems: ChecklistItemResponse[];
  newChecklistTitle: string;
  newChecklistCategory: ChecklistCategory;
  onNewChecklistTitleChange: (value: string) => void;
  onNewChecklistCategoryChange: (value: ChecklistCategory) => void;
  onAddChecklistItem: (event: FormEvent<HTMLFormElement>) => void;
  onToggleChecklistItem: (itemID: string, isCompleted: boolean) => void;
  onDeleteChecklistItem: (itemID: string) => void;
  editTripHref: string;
};

const FALLBACK_SCHEDULE_ID = "__owner-trip-no-schedule__";

// 실제 소유자 여행 데이터를 /demo와 동일한 TripPage가 요구하는 props 모양으로 조립한다.
// 새 API 호출은 하지 않는다 — 인자로 받은 값은 전부 useTripManageController가 이미 불러온 것이다.
export function useOwnerTripPageAdapter({
  selectedOwnerTrip,
  ownerSchedules,
  ownerPlaces,
  ownerFlights,
  checklistItems,
  newChecklistTitle,
  newChecklistCategory,
  onNewChecklistTitleChange,
  onNewChecklistCategoryChange,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  editTripHref,
}: UseOwnerTripPageAdapterParams): TripPageProps {
  const contentRef = useRef<HTMLDivElement>(null);
  const tripId = selectedOwnerTrip.id;

  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [addressCopied, setAddressCopied] = useState(false);
  const [isChecklistEditing, setIsChecklistEditing] = useState(false);
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

  const dates = useMemo(() => Array.from(new Set(schedules.map((item) => item.date))), [schedules]);
  const selectedSchedules = useMemo(
    () => getOwnerSchedulesForDate(selectedDate, schedules, scheduleOrderByDate),
    [selectedDate, schedules, scheduleOrderByDate]
  );
  const completedScheduleCount = selectedSchedules.filter((item) => completedSchedules[item.id]).length;
  const completedCount = allChecklist.filter((item) => checkedItems[item.id]).length;

  const today = getTodayDateString();
  const travelStatus = getTravelStatus(today, tripDates);
  const displayFocusDate = clampDate(today, tripDates.startDate, tripDates.endDate);
  const focusDateOffset = getDateOffset(tripDates.startDate, displayFocusDate);
  const focusScheduleDate = shiftDate(trip.startDate, focusDateOffset);
  const focusSchedules = useMemo(
    () => getOwnerSchedulesForDate(focusScheduleDate, schedules, scheduleOrderByDate),
    [focusScheduleDate, schedules, scheduleOrderByDate]
  );
  const fallbackSchedule: ScheduleItem = {
    id: FALLBACK_SCHEDULE_ID,
    date: trip.startDate,
    time: "",
    type: "etc",
    title: "등록된 일정이 없습니다",
    guideMemo: "편집 화면에서 일정을 추가해보세요.",
  };
  const nextSchedule =
    focusSchedules.find((item) => !completedSchedules[item.id]) ??
    schedules.find((item) => !completedSchedules[item.id]) ??
    schedules[0] ??
    fallbackSchedule;
  const focusCompletedScheduleCount = focusSchedules.filter((item) => completedSchedules[item.id]).length;

  const homeChecklistCategories: ChecklistCategory[] =
    travelStatus.phase === "before" ? ["before", "airport"] : travelStatus.phase === "during" ? ["daily"] : ["return"];
  const homeChecklistItems = allChecklist.filter((item) => homeChecklistCategories.includes(item.category)).slice(0, 4);
  const homeChecklistCompletedCount = homeChecklistItems.filter((item) => checkedItems[item.id]).length;

  const emergencies = useMemo(() => {
    const hotel = places.find((place) => place.category === "hotel");
    return [
      {
        id: "emergency-family",
        title: "가족 연락",
        description: "문제가 생기면 가장 먼저 가족에게 연락하세요.",
        phone: undefined,
      },
      {
        id: "emergency-hotel",
        title: "숙소 연락",
        description: hotel 
          ? `${hotel.name}\n${hotel.address || ""}` 
          : "장소 관리에서 숙소(호텔)를 등록하면 여기에 표시됩니다.",
        phone: undefined,
        address: hotel?.address,
      },
      {
        id: "emergency-passport",
        title: "여권 분실",
        description: "가족에게 연락한 뒤 가까운 경찰서와 영사관 안내를 확인하세요.",
      },
    ];
  }, [places]);

  const groupedChecklist = useMemo(
    () =>
      checklistCategories
        .map(([category, label]) => ({
          category,
          label,
          items: allChecklist.filter((item) => item.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [allChecklist]
  );

  function getDisplayDate(dateStr: string) {
    return shiftDate(tripDates.startDate, getDateOffset(trip.startDate, dateStr));
  }

  function getMapUrl(place?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    name?: string;
    googlePlaceId?: string;
  }) {
    return getGoogleDirectionsUrl(place);
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
    completedCount,
    completedScheduleCount,
    completedSchedules,
    contentRef,
    dates,
    editTripHref,
    emergencies,
    flights,
    focusCompletedScheduleCount,
    focusSchedules,
    getDisplayDate,
    getMapUrl,
    getPlace,
    groupedChecklist,
    hiddenChecklistIDs: [],
    homeChecklistCompletedCount,
    homeChecklistItems,
    isChecklistEditing,
    newChecklistCategory,
    newChecklistTitle,
    nextSchedule,
    phrases,
    places,
    routes: [],
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
    setIsChecklistEditing,
    setNewChecklistCategory: onNewChecklistCategoryChange,
    setNewChecklistTitle: onNewChecklistTitleChange,
    setSelectedDate,
    toggleCheck,
    toggleScheduleComplete,
    updateTripDate,
  };
}
