import { useEffect } from "react";
import { ChevronRight, Compass, Luggage, MapPin, Plane, CalendarDays, ListChecks, Link2 } from "lucide-react";
import { formatKoreanDate } from "../../shared/date";
import type { EditSection } from "../../shared/manageRoute";
import { ManageAuthSection } from "./components/ManageAuthSection";
import { useTripManageController } from "./useTripManageController";

type TripEditHubPageProps = {
  tripId: string;
};

const editCategories: Array<{ icon: typeof Luggage; label: string; section: EditSection }> = [
  { icon: Luggage, label: "기본정보", section: "basic" },
  { icon: MapPin, label: "장소", section: "places" },
  { icon: Plane, label: "항공편", section: "flights" },
  { icon: CalendarDays, label: "일정", section: "schedules" },
  { icon: ListChecks, label: "체크리스트", section: "checklist" },
  { icon: Link2, label: "공유 링크", section: "share" },
];

// "/manage/trips/:id/edit" 진입점. 카드를 누르면 /manage/trips/:id/edit/:section으로 이동한다.
export function TripEditHubPage({ tripId }: TripEditHubPageProps) {
  const currentPath = window.location.pathname;
  const manage = useTripManageController({ currentPath, isLegacyOwnerRoute: false, isManageRoute: true });
  const { auth, authChecked, ownerTrips, ownerTripsLoading, selectedOwnerTrip, onSelectOwnerTrip } = manage;

  useEffect(() => {
    if (ownerTripsLoading || ownerTrips.length === 0) return;
    if (selectedOwnerTrip?.id === tripId) return;
    onSelectOwnerTrip(tripId);
  }, [tripId, ownerTripsLoading, ownerTrips, selectedOwnerTrip, onSelectOwnerTrip]);

  if (!authChecked || !auth) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen owner-screen">
              <ManageAuthSection {...manage} />
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (ownerTripsLoading) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen" style={{ display: "grid", placeItems: "center", gap: "10px", padding: "48px 0" }}>
              <Compass className="spin-slow" size={32} />
              <h1>여행 정보를 불러오는 중입니다</h1>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (!selectedOwnerTrip) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen">
              <h1>여행을 찾을 수 없습니다</h1>
              <p className="muted">삭제되었거나 접근 권한이 없는 여행입니다.</p>
              <a className="primary-button" href="/manage" style={{ marginTop: "16px" }}>
                여행 목록으로
              </a>
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            <div className="section-title-row">
              <div>
                <span className="pill">편집</span>
                <h1>{selectedOwnerTrip.title}</h1>
                <p className="muted">
                  {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
                </p>
              </div>
              <a className="secondary-button compact-button" href={`/manage/trips/${selectedOwnerTrip.id}`}>
                보기 화면으로
              </a>
            </div>

            <div className="card-stack">
              {editCategories.map(({ icon: Icon, label, section }) => (
                <a
                  className="info-card"
                  href={`/manage/trips/${selectedOwnerTrip.id}/edit/${section}`}
                  key={section}
                  style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}
                >
                  <Icon size={20} />
                  <div style={{ flex: 1 }}>
                    <strong>{label}</strong>
                  </div>
                  <ChevronRight size={18} className="muted" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
