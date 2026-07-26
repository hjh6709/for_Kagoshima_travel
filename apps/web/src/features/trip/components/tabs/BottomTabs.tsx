import { CalendarDays, Home, Map as MapIcon, Plane, Shield } from "lucide-react";
import type { Tab } from "../../tripViewState";

type BottomTabsProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const tabs: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "today", label: "오늘", icon: Home },
  { id: "schedule", label: "전체 일정", icon: CalendarDays },
  { id: "flight", label: "항공", icon: Plane },
  { id: "map", label: "지도", icon: MapIcon },
  { id: "concierge", label: "긴급", icon: Shield },
];

/**
 * BottomTabs 컴포넌트
 * WCAG 2.1 AA 표준 접근성(A11y) 규격을 준수하는 하단 네비게이션 탭 바입니다.
 */
export function BottomTabs({ activeTab, setActiveTab }: BottomTabsProps) {
  return (
    <nav className="bottom-tabs" aria-label="주요 탭 메뉴 내비게이션">
      <div role="tablist" aria-label="여행 탭 리스트" style={{ display: "contents" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`tabpanel-${tab.id}`}
              aria-selected={isActive}
              aria-label={`${tab.label} 탭${isActive ? ", 현재 선택됨" : ""}`}
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
      </div>
    </nav>
  );
}
