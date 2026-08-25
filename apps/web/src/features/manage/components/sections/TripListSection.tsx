import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Plane,
  Share2,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { OwnerTrip } from "../../../../api/trips";
import { AlertDialog } from "../../../../shared/components/AlertDialog";
import {
  formatKoreanDate,
  getTodayDateString,
  getTravelPhase,
  getTravelStatus,
  type TravelPhase,
} from "../../../../shared/date";
import {
  getManageTripEditSectionPath,
  getManageTripEditorPath,
  getManageTripPath,
} from "../../../../shared/manageRoute";
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
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

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
            const shareHref = getManageTripEditSectionPath(ownerTrip.id, "share");
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
                {typeof ownerTrip.placeCount === "number" && (
                  <div className="owner-trip-stats">
                    {/* 아이콘+숫자만으로는 무엇을 세는 값인지 한눈에 안 들어와서
                        라벨 텍스트를 붙였다 — aria-label은 시각 텍스트와 중복되므로 뺀다. */}
                    <span>
                      <MapPin aria-hidden="true" size={16} />
                      장소 {ownerTrip.placeCount}
                    </span>
                    <span>
                      <CalendarDays aria-hidden="true" size={16} />
                      일정 {ownerTrip.scheduleCount ?? 0}
                    </span>
                    <span>
                      <Plane aria-hidden="true" size={16} />
                      항공편 {ownerTrip.flightCount ?? 0}
                    </span>
                  </div>
                )}
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
                <details aria-label={`${ownerTrip.title} 관리 메뉴`} className="owner-trip-manage">
                  <summary>
                    <MoreHorizontal aria-hidden="true" size={18} />
                    <span className="visually-hidden">관리 메뉴 열기</span>
                  </summary>
                  <div className="owner-trip-manage-panel">
                    <a className="secondary-button compact-button" href={shareHref}>
                      <Share2 aria-hidden="true" size={16} />
                      공유 링크
                    </a>
                    <button
                      className="danger-button compact-button"
                      disabled={isDeleting}
                      onClick={() => setPendingDelete({ id: ownerTrip.id, title: ownerTrip.title })}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                      {isDeleting ? "삭제 중" : "여행 삭제"}
                    </button>
                    <p>삭제하면 일정과 장소를 복구할 수 없습니다.</p>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}

      {pendingDelete && (
        <AlertDialog
          action={{
            label: "삭제",
            onClick: () => {
              onDeleteTrip(pendingDelete.id);
              setPendingDelete(null);
            },
            tone: "destructive",
          }}
          cancelLabel="취소"
          description="삭제하면 일정과 장소를 복구할 수 없습니다."
          onCancel={() => setPendingDelete(null)}
          title={`'${pendingDelete.title}' 여행을 영구 삭제하시겠습니까?`}
        />
      )}
    </section>
  );
}
