import { useEffect } from "react";
import { AlertCircle, ChevronLeft, Compass } from "lucide-react";
import { formatKoreanDate } from "../../shared/date";
import { getManageTripPath } from "../../shared/manageRoute";
import { ManageAuthSection } from "./components";
import { TripEditHubOverview } from "./components/TripEditHubOverview";
import { useTripManageController } from "./useTripManageController";

type TripEditHubPageProps = {
  tripId: string;
};

// "/manage/trips/:id/edit" 진입점. 현재 저장 상태를 바탕으로 다음 편집 행동을 하나 추천한다.
export function TripEditHubPage({ tripId }: TripEditHubPageProps) {
  const currentPath = window.location.pathname;
  const manage = useTripManageController({ currentPath, isLegacyOwnerRoute: false, isManageRoute: true });
  const {
    auth,
    authChecked,
    checklistItems,
    checklistLoading,
    onSelectOwnerTrip,
    ownerDetailDataError,
    ownerDetailDataLoading,
    ownerDetailDataTripID,
    ownerFlights,
    ownerPlaces,
    ownerSchedules,
    ownerTrips,
    ownerTripsError,
    ownerTripsLoading,
    selectedOwnerTrip,
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

  const requestedTripExists = ownerTrips.some((trip) => trip.id === tripId);
  const isSelectingTrip = requestedTripExists && selectedOwnerTrip?.id !== tripId;

  if (ownerTripsLoading || isSelectingTrip) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen manage-page-state">
              <Compass className="spin-slow" size={32} />
              <h1>여행 정보를 불러오는 중입니다</h1>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (ownerTripsError) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen manage-page-state" role="alert">
              <AlertCircle aria-hidden="true" size={28} />
              <h1>여행 목록을 불러오지 못했습니다</h1>
              <p className="muted">{ownerTripsError}</p>
              <a className="primary-button manage-page-state-action" href={currentPath}>다시 불러오기</a>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (!requestedTripExists || !selectedOwnerTrip) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen">
              <h1>여행을 찾을 수 없습니다</h1>
              <p className="muted">삭제되었거나 접근 권한이 없는 여행입니다.</p>
              <a className="primary-button manage-page-state-action" href="/manage">
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
            <a className="edit-hub-back-link" href="/manage">
              <ChevronLeft aria-hidden="true" size={18} />
              여행 목록
            </a>

            <header className="edit-hub-header">
              <div>
                <span className="pill">여행 편집</span>
                <h1>{selectedOwnerTrip.title}</h1>
                <p className="muted">
                  {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
                </p>
              </div>
              <a className="secondary-button compact-button" href={getManageTripPath(selectedOwnerTrip.id)}>
                여행 보기
              </a>
            </header>

            {ownerDetailDataError ? (
              <section className="edit-hub-data-state" role="alert">
                <AlertCircle aria-hidden="true" size={22} />
                <div>
                  <h2>편집 정보를 불러오지 못했습니다</h2>
                  <p>{ownerDetailDataError}</p>
                </div>
                <a className="secondary-button" href={currentPath}>다시 불러오기</a>
              </section>
            ) : ownerDetailDataLoading || checklistLoading || ownerDetailDataTripID !== selectedOwnerTrip.id ? (
              <section className="edit-hub-data-state" aria-live="polite">
                <Compass aria-hidden="true" className="spin-slow" size={24} />
                <div>
                  <h2>저장한 여행 내용을 확인하고 있습니다</h2>
                  <p>장소와 일정에 맞는 다음 단계를 준비합니다.</p>
                </div>
              </section>
            ) : (
              <TripEditHubOverview
                checklistCount={checklistItems.length}
                flightCount={ownerFlights.length}
                placeCount={ownerPlaces.length}
                scheduleCount={ownerSchedules.length}
                tripId={selectedOwnerTrip.id}
              />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
