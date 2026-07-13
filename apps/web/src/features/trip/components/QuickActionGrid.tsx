import { AlertTriangle, CalendarDays, Plane } from "lucide-react";
import type { Tab } from "../tripViewState";

type QuickActionGridProps = {
  setActiveTab: (tab: Tab) => void;
};

// 홈 화면에서 자주 쓰는 탭으로 빠르게 이동한다.
export function QuickActionGrid({ setActiveTab }: QuickActionGridProps) {
  return (
    <div className="grid-two">
      <button className="quick-button" onClick={() => setActiveTab("schedule")}>
        <CalendarDays size={22} />
        일정 보기
      </button>
      <button className="quick-button" onClick={() => setActiveTab("flight")}>
        <Plane size={22} />
        항공편
      </button>
      <button className="quick-button danger" onClick={() => setActiveTab("concierge")}>
        <AlertTriangle size={22} />
        긴급 연락
      </button>
    </div>
  );
}
