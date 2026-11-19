import { useEffect, useRef, useState } from "react";
import type { AuthResponse } from "../../api/auth";
import {
  BottomTabs,
  ConciergeTab,
  FlightTab,
  MapTab,
  MyPageTab,
  ScheduleTab,
  TodayTab,
} from "./components";
import type { TripPageProps } from "./tripPageTypes";

type TripPageComponentProps = TripPageProps & {
  auth?: AuthResponse | null;
  notice?: string;
  onAuthChanged?: (auth: AuthResponse) => void;
  onLogout?: () => void;
};

// 일반 여행 화면의 탭 컴포넌트를 조립한다. 상태 저장과 API 흐름은 App.tsx가 관리한다.
export function TripPage(props: TripPageComponentProps) {
  const {
    activeTab,
    auth,
    contentRef,
    notice,
    onAuthChanged,
    onLogout,
    setActiveTab,
  } = props;
  const navigateToMyPage = props.isReadOnly
    ? undefined
    : () => setActiveTab("mypage");
  const [hasVisitedMap, setHasVisitedMap] = useState(activeTab === "map");
  const previousTabRef = useRef<TripPageProps["activeTab"] | null>(null);

  useEffect(() => {
    if (activeTab === "map") setHasVisitedMap(true);
  }, [activeTab]);

  // 오늘에서 진입하거나 해시로 바로 열 때는 여행 기준일을 사용한다.
  // 일정↔지도 이동에서는 사용자가 골랐던 날짜를 그대로 유지한다.
  useEffect(() => {
    const previousTab = previousTabRef.current;
    if (
      (activeTab === "schedule" || activeTab === "map") &&
      (previousTab === null || previousTab === "today")
    ) {
      props.setSelectedDate(props.focusDate);
    }
    previousTabRef.current = activeTab;
  }, [activeTab, props.focusDate, props.setSelectedDate]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    if (typeof content.scrollTo === "function") {
      content.scrollTo({ top: 0 });
    } else {
      content.scrollTop = 0;
    }
  }, [activeTab, contentRef]);

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <div className="content" ref={contentRef}>
          {notice && (
            <p className="shared-offline-warning" role="status">
              {notice}
            </p>
          )}
          {activeTab === "today" && (
            <TodayTab {...props} onNavigateToMyPage={navigateToMyPage} />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab {...props} onNavigateToMyPage={navigateToMyPage} />
          )}
          {activeTab === "flight" && (
            <FlightTab {...props} onNavigateToMyPage={navigateToMyPage} />
          )}
          {hasVisitedMap && (
            <div hidden={activeTab !== "map"}>
              <MapTab {...props} onNavigateToMyPage={navigateToMyPage} />
            </div>
          )}
          {activeTab === "concierge" && (
            <ConciergeTab {...props} onNavigateToMyPage={navigateToMyPage} />
          )}
          {activeTab === "mypage" && (
            <MyPageTab
              {...props}
              auth={auth}
              onAuthChanged={onAuthChanged}
              onLogout={onLogout}
              isDemo={props.isDemo}
            />
          )}
        </div>

        <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </section>
    </main>
  );
}
