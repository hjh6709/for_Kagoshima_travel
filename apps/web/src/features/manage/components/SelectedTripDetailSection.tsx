import { formatKoreanDate } from "../../../shared/date";
import type { SelectedTripDetailSectionProps } from "../manageTypes";
import { ManageFlightCreateForm } from "./ManageFlightCreateForm";
import { ManageFlightList } from "./ManageFlightList";
import { ManageDetailStepGuide } from "./ManageDetailStepGuide";
import { ManagePlaceCreateForm } from "./ManagePlaceCreateForm";
import { ManagePlaceList } from "./ManagePlaceList";
import { ManageScheduleCreateForm } from "./ManageScheduleCreateForm";
import { ManageScheduleList } from "./ManageScheduleList";
import { ManageShareActions } from "./ManageShareActions";
import { TripBasicInfoForm } from "./TripBasicInfoForm";
import { ManageChecklistSection } from "./ManageChecklistSection";
import { ChinaPaymentHelper } from "./ChinaPaymentHelper";

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

        <ManageDetailStepGuide />

        {selectedOwnerTrip.destinationCountry === "CN" && <ChinaPaymentHelper />}

        {/* 상세 섹션들은 같은 선택 여행 컨텍스트를 공유하므로 공통 props를 넘기고 각 컴포넌트 타입에서 필요한 값만 사용한다. */}
        <TripBasicInfoForm {...props} />

        <ManagePlaceCreateForm {...props} />

        <ManagePlaceList {...props} destinationCountry={selectedOwnerTrip.destinationCountry} />

        <ManageFlightCreateForm
          {...props}
          tripEndDate={selectedOwnerTrip.endDate}
          tripStartDate={selectedOwnerTrip.startDate}
        />

        <ManageFlightList {...props} />

        <ManageScheduleCreateForm
          {...props}
          tripEndDate={selectedOwnerTrip.endDate}
          tripStartDate={selectedOwnerTrip.startDate}
        />

        <ManageScheduleList {...props} />

        <ManageChecklistSection
          checklistItems={props.checklistItems}
          checklistLoading={props.checklistLoading}
          checklistError={props.checklistError}
          newChecklistTitle={props.newChecklistTitle}
          setNewChecklistTitle={props.onNewChecklistTitleChange}
          newChecklistCategory={props.newChecklistCategory}
          setNewChecklistCategory={props.onNewChecklistCategoryChange}
          checklistSubmitting={props.checklistSubmitting}
          handleAddChecklistItem={props.onAddChecklistItem}
          handleToggleChecklistItem={props.onToggleChecklistItem}
          handleDeleteChecklistItem={props.onDeleteChecklistItem}
        />

        <ManageShareActions {...props} />
      </article>
    </section>
  );
}
