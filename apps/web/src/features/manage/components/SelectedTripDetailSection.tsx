import { formatKoreanDate } from "../../../shared/date";
import type { SelectedTripDetailSectionProps } from "../manageTypes";
import { ManageFlightCreateForm } from "./ManageFlightCreateForm";
import { ManageFlightList } from "./ManageFlightList";
import { ManagePlaceCreateForm } from "./ManagePlaceCreateForm";
import { ManagePlaceList } from "./ManagePlaceList";
import { ManageScheduleCreateForm } from "./ManageScheduleCreateForm";
import { ManageScheduleList } from "./ManageScheduleList";
import { ManageShareActions } from "./ManageShareActions";
import { TripBasicInfoForm } from "./TripBasicInfoForm";

// 선택한 여행의 상세 관리 화면만 담당한다. 실제 저장/삭제 동작은 상위에서 받은 콜백으로 처리한다.
export function SelectedTripDetailSection(props: SelectedTripDetailSectionProps) {
  const { onCloseOwnerTripDetail, selectedOwnerTrip } = props;

  if (!selectedOwnerTrip) {
    return null;
  }

  return (
    <section className="section-block owner-detail-section">
      <div className="section-title-row">
        <div>
          <span className="pill">선택한 여행</span>
          <h2>{selectedOwnerTrip.title}</h2>
          <p className="section-caption">
            {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
          </p>
        </div>
        <button className="secondary-button compact-button" onClick={onCloseOwnerTripDetail} type="button">
          목록으로
        </button>
      </div>

      <article className="owner-trip-detail-card">
        <div className="detail-grid">
          <div>
            <span className="muted-label">여행자</span>
            <p>
              {selectedOwnerTrip.travelers.length > 0
                ? selectedOwnerTrip.travelers.join(", ")
                : "여행자 미입력"}
            </p>
          </div>
          <div>
            <span className="muted-label">메모</span>
            <p>{selectedOwnerTrip.memo || "메모 없음"}</p>
          </div>
        </div>

        <TripBasicInfoForm {...props} />

        <ManageShareActions {...props} />

        <ManagePlaceCreateForm {...props} />

        <ManageFlightCreateForm
          {...props}
          tripEndDate={selectedOwnerTrip.endDate}
          tripStartDate={selectedOwnerTrip.startDate}
        />

        <ManageScheduleCreateForm
          {...props}
          tripEndDate={selectedOwnerTrip.endDate}
          tripStartDate={selectedOwnerTrip.startDate}
        />

        <ManageScheduleList {...props} />

        <ManagePlaceList {...props} />

        <ManageFlightList {...props} />
      </article>
    </section>
  );
}
