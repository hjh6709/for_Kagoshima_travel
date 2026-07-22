import { Compass } from "lucide-react";
import { formatKoreanDate } from "../../../shared/date";
import type { TripListSectionProps } from "../manageTypes";

// 여행 목록 렌더링만 담당한다. 관리 상세 화면 이동은 링크(전체 페이지 이동)로 처리한다.
export function TripListSection({ ownerTrips, ownerTripsError, ownerTripsLoading }: TripListSectionProps) {
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
          {ownerTrips.map((ownerTrip) => (
            <article className="owner-trip-card" key={ownerTrip.id}>
              <div>
                <span className="pill subtle">여행</span>
                <h2>{ownerTrip.title}</h2>
                <p className="muted">
                  {formatKoreanDate(ownerTrip.startDate)} ~ {formatKoreanDate(ownerTrip.endDate)}
                </p>
                <p>{ownerTrip.travelers.length > 0 ? ownerTrip.travelers.join(", ") : "여행자 미입력"}</p>
              </div>
              <a className="secondary-button compact-button" href={`/manage/trips/${ownerTrip.id}`}>
                관리하기
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
