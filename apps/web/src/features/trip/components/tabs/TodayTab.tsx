import type { TripPageProps } from "../../tripPageTypes";
import { NextScheduleCard } from "../cards/NextScheduleCard";
import { TripDateEditor } from "../helpers/TripDateEditor";
import { HomeChecklistSection } from "../sections/HomeChecklistSection";
import { TodayHeaderSection } from "../sections/TodayHeaderSection";

// 오늘 탭 렌더링만 담당한다. 상태 변경은 상위에서 전달한 핸들러를 호출한다.
export function TodayTab(props: TripPageProps) {
  const {
    checkedItems,
    focusDate,
    focusCompletedScheduleCount,
    focusSchedules,
    getDisplayDate,
    getPlace,
    homeChecklistCompletedCount,
    homeChecklistItems,
    isDemo,
    nextSchedule,
    setActiveTab,
    setScheduleView,
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
        focusDate={focusDate}
        getDisplayDate={getDisplayDate}
        getPlace={getPlace}
        nextSchedule={nextSchedule}
        onOpenSchedule={() => {
          setScheduleView("itinerary");
          setActiveTab("schedule");
        }}
        travelPhase={travelStatus.phase}
      />
      <HomeChecklistSection
        checkedItems={checkedItems}
        focusCompletedScheduleCount={focusCompletedScheduleCount}
        focusScheduleCount={focusSchedules.length}
        homeChecklistCompletedCount={homeChecklistCompletedCount}
        homeChecklistItems={homeChecklistItems}
        onOpenChecklist={() => {
          setScheduleView("checklist");
          setActiveTab("schedule");
        }}
        toggleCheck={toggleCheck}
        travelPhase={travelStatus.phase}
      />
      {isDemo && (
        <details className="date-details today-demo-tools">
          <summary>데모 여행 날짜 조정</summary>
          <TripDateEditor tripDates={tripDates} updateTripDate={updateTripDate} />
        </details>
      )}
    </section>
  );
}
