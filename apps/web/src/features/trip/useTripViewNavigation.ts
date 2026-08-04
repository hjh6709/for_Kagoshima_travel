import { useEffect, useState } from "react";
import { getInitialTripView, getTripViewHash } from "./tripViewState";

// 소유자·데모·공유 화면이 같은 탭 URL 계약을 사용하도록 현재 보기를 동기화한다.
export function useTripViewNavigation() {
  const initialView = getInitialTripView(window.location.hash);
  const [activeTab, setActiveTab] = useState(initialView.activeTab);
  const [scheduleView, setScheduleView] = useState(initialView.scheduleView);

  useEffect(() => {
    const handleHashChange = () => {
      const nextView = getInitialTripView(window.location.hash);
      setActiveTab(nextView.activeTab);
      setScheduleView(nextView.scheduleView);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const nextHash = getTripViewHash(activeTab, scheduleView);
    if (window.location.hash === nextHash) return;

    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}${nextHash}`,
    );
  }, [activeTab, scheduleView]);

  return { activeTab, scheduleView, setActiveTab, setScheduleView };
}
