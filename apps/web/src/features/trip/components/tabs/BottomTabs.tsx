import { CalendarDays, Home, Map as MapIcon, Plane, Shield } from "lucide-react";
import type { Tab } from "../../tripViewState";

type BottomTabsProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const tabs: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "today", label: "오늘", icon: Home },
  { id: "schedule", label: "일정", icon: CalendarDays },
  { id: "flight", label: "항공", icon: Plane },
  { id: "map", label: "지도", icon: MapIcon },
  { id: "concierge", label: "긴급", icon: Shield },
];

// 여행 중 가장 자주 쓰는 다섯 화면으로 이동하는 하단 내비게이션이다.
export function BottomTabs({ activeTab, setActiveTab }: BottomTabsProps) {
  return (
    <nav className="bottom-tabs" aria-label="여행 메뉴">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={isActive ? "active" : ""}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <Icon size={21} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
