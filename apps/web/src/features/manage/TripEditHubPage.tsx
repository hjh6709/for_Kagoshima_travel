import { useEffect } from "react";
import { Compass, Luggage, MapPin, Plane, CalendarDays, ListChecks, Link2 } from "lucide-react";
import { formatKoreanDate } from "../../shared/date";
import { ManageAuthSection } from "./components/ManageAuthSection";
import { useTripManageController } from "./useTripManageController";

type TripEditHubPageProps = {
  tripId: string;
};

const editCategories = [
  { icon: Luggage, label: "기본정보" },
  { icon: MapPin, label: "장소" },
  { icon: Plane, label: "항공편" },
  { icon: CalendarDays, label: "일정" },
  { icon: ListChecks, label: "체크리스트" },
  { icon: Link2, label: "공유 링크" },
] as const;

// "/manage/trips/:id/edit" 진입점. 카테고리별 실제 편집 페이지는 이후 별도 작업에서 연결한다.
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
              {editCategories.map(({ icon: Icon, label }) => (
                <article className="info-card" key={label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={20} />
                  <div style={{ flex: 1 }}>
                    <strong>{label}</strong>
                  </div>
                  <span className="pill subtle">준비 중</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
