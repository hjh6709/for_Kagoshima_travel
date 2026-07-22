import { BottomTabs } from "./components/BottomTabs";
import { ConciergeTab } from "./components/ConciergeTab";
import { FlightTab } from "./components/FlightTab";
import { MapTab } from "./components/MapTab";
import { ScheduleTab } from "./components/ScheduleTab";
import { TodayTab } from "./components/TodayTab";
import { MyPageTab } from "./components/MyPageTab";
import type { TripPageProps } from "./tripPageTypes";

type TripPageComponentProps = TripPageProps & {
  onLogout?: () => void;
};

// 일반 여행 화면의 탭 컴포넌트를 조립한다. 상태 저장과 API 흐름은 App.tsx가 관리한다.
export function TripPage(props: TripPageComponentProps) {
  const { activeTab, contentRef, onLogout, setActiveTab } = props;

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <div className="content" ref={contentRef}>
          {activeTab === "today" && <TodayTab {...props} />}
          {activeTab === "schedule" && <ScheduleTab {...props} />}
          {activeTab === "flight" && <FlightTab {...props} />}
          {activeTab === "map" && <MapTab {...props} />}
          {activeTab === "concierge" && <ConciergeTab {...props} />}
          {activeTab === "mypage" && <MyPageTab {...props} onLogout={onLogout} />}
        </div>

        <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </section>
    </main>
  );
}
