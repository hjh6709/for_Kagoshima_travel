import { useEffect } from "react";
import { Compass } from "lucide-react";
import { ManageAuthSection } from "../manage/components/ManageAuthSection";
import { useTripManageController } from "../manage/useTripManageController";
import { TripPage } from "./TripPage";
import { useOwnerTripPageAdapter } from "./useOwnerTripPageAdapter";

type OwnerTripViewPageProps = {
  tripId: string;
};

// "/manage/trips/:id" 진입점. useTripManageController가 이미 갖고 있는 인증/여행목록/상세데이터를
// tripId로 자동 선택시킨 뒤, TripPage(오늘/전체 일정/항공/지도/긴급/마이페이지 탭)로 그대로 넘긴다.
export function OwnerTripViewPage({ tripId }: OwnerTripViewPageProps) {
  const currentPath = window.location.pathname;
  const manage = useTripManageController({ currentPath, isLegacyOwnerRoute: false, isManageRoute: true });
  const {
    auth,
    authChecked,
    ownerTrips,
    ownerTripsLoading,
    selectedOwnerTrip,
    onSelectOwnerTrip,
    ownerDetailDataLoading,
    ownerDetailDataError,
    ownerSchedules,
    ownerPlaces,
    ownerFlights,
    checklistItems,
    checklistLoading,
    newChecklistTitle,
    newChecklistCategory,
    onNewChecklistTitleChange,
    onNewChecklistCategoryChange,
    onAddChecklistItem,
    onToggleChecklistItem,
    onDeleteChecklistItem,
    onLogout,
  } = manage;

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

  if (ownerTripsLoading || (!selectedOwnerTrip && ownerDetailDataLoading)) {
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

  if (ownerDetailDataLoading || checklistLoading) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen" style={{ display: "grid", placeItems: "center", gap: "10px", padding: "48px 0" }}>
              <Compass className="spin-slow" size={32} />
              <h1>{selectedOwnerTrip.title} 일정을 불러오는 중입니다</h1>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (ownerDetailDataError) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen">
              <h1>여행 정보를 불러오지 못했습니다</h1>
              <p className="form-error">{ownerDetailDataError}</p>
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
    <OwnerTripViewContent
      checklistItems={checklistItems}
      editTripHref={`/manage/trips/${selectedOwnerTrip.id}/edit`}
      newChecklistCategory={newChecklistCategory}
      newChecklistTitle={newChecklistTitle}
      onAddChecklistItem={onAddChecklistItem}
      onDeleteChecklistItem={onDeleteChecklistItem}
      onLogout={onLogout}
      onNewChecklistCategoryChange={onNewChecklistCategoryChange}
      onNewChecklistTitleChange={onNewChecklistTitleChange}
      onToggleChecklistItem={onToggleChecklistItem}
      ownerFlights={ownerFlights}
      ownerPlaces={ownerPlaces}
      ownerSchedules={ownerSchedules}
      selectedOwnerTrip={selectedOwnerTrip}
    />
  );
}

type OwnerTripViewContentProps = Parameters<typeof useOwnerTripPageAdapter>[0] & {
  onLogout: () => void;
};

// useOwnerTripPageAdapter는 훅이라 이른 return 뒤에서 호출할 수 없으므로,
// "데이터 준비 완료" 상태만 들어오는 별도 컴포넌트로 분리해 훅 순서 규칙을 지킨다.
function OwnerTripViewContent({ onLogout, ...adapterParams }: OwnerTripViewContentProps) {
  const tripPageProps = useOwnerTripPageAdapter(adapterParams);
  return <TripPage {...tripPageProps} onLogout={onLogout} isDemo={false} />;
}
