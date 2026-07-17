import { CalendarDays, Home, Map as MapIcon, Plane, Shield, User } from "lucide-react";
import type { Tab } from "../tripViewState";

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
  { id: "mypage", label: "마이페이지", icon: User },
];

// 하단 탭 내비게이션만 담당한다. 현재 탭 상태는 상위에서 관리한다.
export function BottomTabs({ activeTab, setActiveTab }: BottomTabsProps) {
  return (
    <nav className="bottom-tabs" aria-label="주요 메뉴">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={21} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
