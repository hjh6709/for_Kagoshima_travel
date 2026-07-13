import { PlusCircle } from "lucide-react";
import { formatKoreanDate } from "../../../shared/date";
import type { TripManagePageProps } from "../manageTypes";

type TripListSectionProps = Pick<
  TripManagePageProps,
  "onSelectOwnerTrip" | "ownerTrips" | "ownerTripsError" | "ownerTripsLoading"
>;

// 여행 목록 렌더링만 담당한다. 선택 시 상세 데이터 로딩은 상위 콜백이 처리한다.
export function TripListSection({
  onSelectOwnerTrip,
  ownerTrips,
  ownerTripsError,
  ownerTripsLoading,
}: TripListSectionProps) {
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
          <PlusCircle size={28} />
          <h2>아직 만든 여행이 없습니다</h2>
          <p className="muted">위 폼에서 첫 여행을 만들면 이 목록에 바로 표시됩니다.</p>
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
              <button
                className="secondary-button compact-button"
                onClick={() => onSelectOwnerTrip(ownerTrip.id)}
                type="button"
              >
                관리하기
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
