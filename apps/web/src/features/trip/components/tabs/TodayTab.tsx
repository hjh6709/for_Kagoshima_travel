import type { TripPageProps } from "../../tripPageTypes";
import { NextScheduleCard } from "../cards/NextScheduleCard";
import { TripDateEditor } from "../helpers/TripDateEditor";
import { HomeChecklistSection } from "../sections/HomeChecklistSection";
import { QuickActionGrid } from "../sections/QuickActionGrid";
import { RecommendedRoutesSection } from "../sections/RecommendedRoutesSection";
import { TodayHeaderSection } from "../sections/TodayHeaderSection";

// 오늘 탭 렌더링만 담당한다. 상태 변경은 상위에서 전달한 핸들러를 호출한다.
export function TodayTab(props: TripPageProps) {
  const {
    checkedItems,
    focusCompletedScheduleCount,
    focusSchedules,
    getDisplayDate,
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
    onNavigateToMyPage,
  } = props;
  return (
    <section className="screen">
      <TodayHeaderSection
        travelStatus={travelStatus}
        trip={trip}
        tripDates={tripDates}
        onNavigateToMyPage={onNavigateToMyPage}
      />
      <NextScheduleCard
        destinationCountry={trip.destinationCountry}
        getDisplayDate={getDisplayDate}
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
