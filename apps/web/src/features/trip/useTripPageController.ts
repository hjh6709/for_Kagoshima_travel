import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  accommodation,
  checklist,
  emergencies,
  flights,
  phrases,
  places,
  routes,
  schedules,
  trip,
} from "../../data/sampleTrip";
import {
  clampDate,
  getDateOffset,
  getTodayDateString,
  getTravelStatus,
  shiftDate,
  type TripDates,
} from "../../shared/date";
import { checklistCategories } from "../../shared/travelOptions";
import type { ChecklistItem } from "../../types/travel";
import type { TripPageProps } from "./tripPageTypes";
import {
  getMapUrl,
  getOrderedSchedulesForDate,
  getPlace,
  getSavedChecklistCompletions,
  getSavedCustomChecklist,
  getSavedHiddenChecklistIDs,
  getSavedScheduleCompletions,
  getSavedScheduleOrder,
  getSavedTripDates,
  isCustomChecklistItem,
  saveChecklistCompletions,
  saveCustomChecklistItems,
  saveHiddenChecklistIDs,
  saveScheduleCompletions,
  saveScheduleOrder as persistScheduleOrder,
  saveTripDates,
  type ChecklistCategory,
  type CustomChecklistItem,
  type ScheduleOrderByDate,
  type Tab,
} from "./tripViewState";

// 일반 여행 화면의 탭, 체크리스트, 일정 완료/정렬, 로컬 저장 상태를 모아 TripPage props로 변환한다.
export function useTripPageController(): TripPageProps {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [tripDates, setTripDates] = useState<TripDates>(getSavedTripDates);
  const [selectedDate, setSelectedDate] = useState(schedules[0]?.date ?? trip.startDate);
  const [addressCopied, setAddressCopied] = useState(false);
  const [customChecklistItems, setCustomChecklistItems] = useState<CustomChecklistItem[]>(getSavedCustomChecklist);
  const [hiddenChecklistIDs, setHiddenChecklistIDs] = useState<string[]>(getSavedHiddenChecklistIDs);
  const [isChecklistEditing, setIsChecklistEditing] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistCategory, setNewChecklistCategory] = useState<ChecklistCategory>("before");
  const [completedSchedules, setCompletedSchedules] = useState<Record<string, boolean>>(getSavedScheduleCompletions);
  const [scheduleOrderByDate, setScheduleOrderByDate] = useState<ScheduleOrderByDate>(getSavedScheduleOrder);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(getSavedChecklistCompletions);

  const dates = useMemo(() => Array.from(new Set(schedules.map((item) => item.date))), []);
  const selectedSchedules = useMemo(
    () => getOrderedSchedulesForDate(selectedDate, scheduleOrderByDate),
    [selectedDate, scheduleOrderByDate]
  );
  const completedScheduleCount = selectedSchedules.filter((item) => completedSchedules[item.id]).length;
  const allChecklist = useMemo(
    () => [...checklist.filter((item) => !hiddenChecklistIDs.includes(item.id)), ...customChecklistItems],
    [customChecklistItems, hiddenChecklistIDs]
  );
  const completedCount = allChecklist.filter((item) => checkedItems[item.id]).length;
  const today = getTodayDateString();
  const travelStatus = getTravelStatus(today, tripDates);
  const displayFocusDate = clampDate(today, tripDates.startDate, tripDates.endDate);
  const focusDateOffset = getDateOffset(tripDates.startDate, displayFocusDate);
  const focusScheduleDate = shiftDate(trip.startDate, focusDateOffset);
  const focusSchedules = useMemo(
    () => getOrderedSchedulesForDate(focusScheduleDate, scheduleOrderByDate),
    [focusScheduleDate, scheduleOrderByDate]
  );
  const nextSchedule =
    focusSchedules.find((item) => !completedSchedules[item.id]) ??
    schedules.find((item) => !completedSchedules[item.id]) ??
    schedules[0];
  const focusCompletedScheduleCount = focusSchedules.filter((item) => completedSchedules[item.id]).length;
  const homeChecklistCategories: ChecklistCategory[] =
    travelStatus.phase === "before" ? ["before", "airport"] : travelStatus.phase === "during" ? ["daily"] : ["return"];
  const homeChecklistItems = allChecklist.filter((item) => homeChecklistCategories.includes(item.category)).slice(0, 4);
  const homeChecklistCompletedCount = homeChecklistItems.filter((item) => checkedItems[item.id]).length;
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

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  function getDisplayDate(dateStr: string) {
    return shiftDate(tripDates.startDate, getDateOffset(trip.startDate, dateStr));
  }

  function updateTripDate(field: "startDate" | "endDate", value: string) {
    if (!value) return;
    const next = { ...tripDates, [field]: value };
    if (next.endDate < next.startDate) {
      next.endDate = next.startDate;
    }
    setTripDates(next);
    saveTripDates(next);
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
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    saveChecklistCompletions(next);
  }

  function saveCustomChecklist(items: CustomChecklistItem[]) {
    setCustomChecklistItems(items);
    saveCustomChecklistItems(items);
  }

  function addChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newChecklistTitle.trim();
    if (!title) return;
    const nextItem: CustomChecklistItem = {
      id: `custom-check-${Date.now()}`,
      category: newChecklistCategory,
      title,
      custom: true,
    };
    saveCustomChecklist([...customChecklistItems, nextItem]);
    setNewChecklistTitle("");
  }

  function removeCustomChecklistItem(id: string) {
    saveCustomChecklist(customChecklistItems.filter((item) => item.id !== id));
    removeChecklistCompletion(id);
  }

  function removeChecklistCompletion(id: string) {
    const nextCheckedItems = { ...checkedItems };
    delete nextCheckedItems[id];
    setCheckedItems(nextCheckedItems);
    saveChecklistCompletions(nextCheckedItems);
  }

  function hideDefaultChecklistItem(id: string) {
    const nextHiddenIDs = Array.from(new Set([...hiddenChecklistIDs, id]));
    setHiddenChecklistIDs(nextHiddenIDs);
    saveHiddenChecklistIDs(nextHiddenIDs);
    removeChecklistCompletion(id);
  }

  function removeChecklistItem(item: ChecklistItem) {
    if (isCustomChecklistItem(item)) {
      removeCustomChecklistItem(item.id);
      return;
    }
    hideDefaultChecklistItem(item.id);
  }

  function restoreDefaultChecklistItems() {
    setHiddenChecklistIDs([]);
    saveHiddenChecklistIDs([]);
  }

  function saveCompletedSchedules(next: Record<string, boolean>) {
    setCompletedSchedules(next);
    saveScheduleCompletions(next);
  }

  function toggleScheduleComplete(id: string) {
    saveCompletedSchedules({ ...completedSchedules, [id]: !completedSchedules[id] });
  }

  function saveScheduleOrder(next: ScheduleOrderByDate) {
    setScheduleOrderByDate(next);
    persistScheduleOrder(next);
  }

  function moveSchedule(scheduleID: string, direction: "up" | "down") {
    const currentOrder = selectedSchedules.map((item) => item.id);
    const currentIndex = currentOrder.indexOf(scheduleID);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
    saveScheduleOrder({ ...scheduleOrderByDate, [selectedDate]: nextOrder });
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
    emergencies,
    flights,
    focusCompletedScheduleCount,
    focusSchedules,
    getDisplayDate,
    getMapUrl,
    getPlace,
    groupedChecklist,
    hiddenChecklistIDs,
    homeChecklistCompletedCount,
    homeChecklistItems,
    isChecklistEditing,
    newChecklistCategory,
    newChecklistTitle,
    nextSchedule,
    phrases,
    places,
    routes,
    selectedDate,
    selectedSchedules,
    trip,
    tripDates,
    travelStatus,
    addChecklistItem,
    copyAccommodationAddress,
    moveSchedule,
    removeChecklistItem,
    restoreDefaultChecklistItems,
    setActiveTab,
    setIsChecklistEditing,
    setNewChecklistCategory,
    setNewChecklistTitle,
    setSelectedDate,
    toggleCheck,
    toggleScheduleComplete,
    updateTripDate,
  };
}
