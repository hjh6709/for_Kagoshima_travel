import { ArrowRight, CalendarDays, ChevronDown, Compass, PencilLine, Trash2, UsersRound } from "lucide-react";
import type { OwnerTrip } from "../../../../api/trips";
import {
  formatKoreanDate,
  getTodayDateString,
  getTravelPhase,
  getTravelStatus,
  type TravelPhase,
} from "../../../../shared/date";
import { getManageTripEditorPath, getManageTripPath } from "../../../../shared/manageRoute";
import type { TripListSectionProps } from "../../manageTypes";

const phasePriority: Record<TravelPhase, number> = {
  during: 0,
  before: 1,
  after: 2,
};

export function sortOwnerTripsByRelevance(ownerTrips: OwnerTrip[], today: string): OwnerTrip[] {
  return ownerTrips
    .map((trip, index) => ({ trip, index, phase: getTravelPhase(today, trip) }))
    .sort((a, b) => {
      const phaseOrder = phasePriority[a.phase] - phasePriority[b.phase];
      if (phaseOrder !== 0) return phaseOrder;

      if (a.phase === "after") {
        return b.trip.endDate.localeCompare(a.trip.endDate) || a.index - b.index;
      }

      return a.trip.startDate.localeCompare(b.trip.startDate) || a.index - b.index;
    })
    .map(({ trip }) => trip);
}

// 여행 목록 렌더링만 담당한다. 관리 상세 화면 이동은 링크(전체 페이지 이동)로 처리한다.
export function TripListSection({
  ownerTrips,
  ownerTripsError,
  ownerTripsLoading,
  deletingTripID,
  onDeleteTrip,
}: TripListSectionProps) {
  const today = getTodayDateString();
  const sortedOwnerTrips = sortOwnerTripsByRelevance(ownerTrips, today);

  return (
    <section className="section-block">
      <div className="section-title-row">
        <h2>여행 목록</h2>
        <span className="pill subtle">{ownerTrips.length}개</span>
      </div>

      {ownerTripsLoading && <p className="muted">여행 목록을 불러오는 중입니다.</p>}

      {ownerTripsError && <p className="form-error">{ownerTripsError}</p>}

      {!ownerTripsLoading && !ownerTripsError && ownerTrips.length === 0 && (
        <article className="info-card empty-state-card">
          <div className="brand-badge-circle" style={{ width: "44px", height: "44px", marginBottom: "8px" }}>
            <Compass size={22} className="auth-hero-icon" />
          </div>
          <h2>아직 만든 여행이 없습니다</h2>
          <p className="muted">아래 폼에서 첫 여행을 만들면 이 목록에 바로 표시됩니다.</p>
        </article>
      )}

      {!ownerTripsLoading && !ownerTripsError && ownerTrips.length > 0 && (
        <div className="card-stack">
          {sortedOwnerTrips.map((ownerTrip) => {
            const isDeleting = deletingTripID === ownerTrip.id;
            const status = getTravelStatus(today, ownerTrip);
            return (
              <article className={`owner-trip-card${isDeleting ? " is-deleting" : ""}`} key={ownerTrip.id}>
                <div className="owner-trip-summary">
                  <span className={`pill owner-trip-status status-${status.phase}`}>{status.label}</span>
                  <h2>{ownerTrip.title}</h2>
                  <p className="owner-trip-meta">
                    <CalendarDays aria-hidden="true" size={16} />
                    {formatKoreanDate(ownerTrip.startDate)} ~ {formatKoreanDate(ownerTrip.endDate)}
                  </p>
                  {ownerTrip.travelers.length > 0 && (
                    <p className="owner-trip-meta">
                      <UsersRound aria-hidden="true" size={16} />
                      {ownerTrip.travelers.join(", ")}
                    </p>
                  )}
                </div>
                <div className="owner-trip-actions">
                  <a className="primary-button compact-button" href={getManageTripPath(ownerTrip.id)}>
                    여행 열기
                    <ArrowRight aria-hidden="true" size={17} />
                  </a>
                  <a className="secondary-button compact-button" href={getManageTripEditorPath(ownerTrip.id)}>
                    <PencilLine aria-hidden="true" size={17} />
                    여행 편집
                  </a>
                </div>
                <details className="owner-trip-manage">
                  <summary>
                    삭제 메뉴
                    <ChevronDown aria-hidden="true" size={16} />
                  </summary>
                  <div className="owner-trip-manage-panel">
                    <p>삭제하면 일정과 장소를 복구할 수 없습니다.</p>
                    <button
                      className="danger-button compact-button"
                      disabled={isDeleting}
                      onClick={() => {
                        if (window.confirm(`정말로 '${ownerTrip.title}' 여행 일정을 영구 삭제하시겠습니까?`)) {
                          onDeleteTrip(ownerTrip.id);
                        }
                      }}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                      {isDeleting ? "삭제 중" : "여행 삭제"}
                    </button>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
