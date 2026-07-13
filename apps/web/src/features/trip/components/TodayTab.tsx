import type { TripPageProps } from "../tripPageTypes";
import { HomeChecklistSection } from "./HomeChecklistSection";
import { NextScheduleCard } from "./NextScheduleCard";
import { QuickActionGrid } from "./QuickActionGrid";
import { RecommendedRoutesSection } from "./RecommendedRoutesSection";
import { TodayHeaderSection } from "./TodayHeaderSection";
import { TripDateEditor } from "./TripDateEditor";

// 오늘 탭 렌더링만 담당한다. 상태 변경은 상위에서 전달한 핸들러를 호출한다.
export function TodayTab({
  checkedItems,
  focusCompletedScheduleCount,
  focusSchedules,
  getDisplayDate,
  getMapUrl,
  getPlace,
  homeChecklistCompletedCount,
  homeChecklistItems,
  nextSchedule,
  routes,
  setActiveTab,
  toggleCheck,
  trip,
  tripDates,
  travelStatus,
  updateTripDate,
}: TripPageProps) {
  return (
    <section className="screen">
      <TodayHeaderSection travelStatus={travelStatus} trip={trip} tripDates={tripDates} />
      <NextScheduleCard
        getDisplayDate={getDisplayDate}
        getMapUrl={getMapUrl}
        getPlace={getPlace}
        nextSchedule={nextSchedule}
      />
      <HomeChecklistSection
        checkedItems={checkedItems}
        focusCompletedScheduleCount={focusCompletedScheduleCount}
        focusScheduleCount={focusSchedules.length}
        homeChecklistCompletedCount={homeChecklistCompletedCount}
        homeChecklistItems={homeChecklistItems}
        setActiveTab={setActiveTab}
        toggleCheck={toggleCheck}
      />
      <QuickActionGrid setActiveTab={setActiveTab} />
      <TripDateEditor tripDates={tripDates} updateTripDate={updateTripDate} />
      <RecommendedRoutesSection routes={routes} />
    </section>
  );
}
