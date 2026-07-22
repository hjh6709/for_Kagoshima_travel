import { useEffect } from "react";
import { Compass } from "lucide-react";
import { formatKoreanDate } from "../../shared/date";
import type { EditSection } from "../../shared/manageRoute";
import { ChinaPaymentHelper } from "./components/ChinaPaymentHelper";
import { ManageAuthSection } from "./components/ManageAuthSection";
import { ManageChecklistSection } from "./components/ManageChecklistSection";
import { ManageFlightCreateForm } from "./components/ManageFlightCreateForm";
import { ManageFlightList } from "./components/ManageFlightList";
import { ManagePlaceCreateForm } from "./components/ManagePlaceCreateForm";
import { ManagePlaceList } from "./components/ManagePlaceList";
import { ManageScheduleCreateForm } from "./components/ManageScheduleCreateForm";
import { ManageScheduleList } from "./components/ManageScheduleList";
import { ManageShareActions } from "./components/ManageShareActions";
import { TripBasicInfoForm } from "./components/TripBasicInfoForm";
import { useTripManageController } from "./useTripManageController";

type TripEditSectionPageProps = {
  tripId: string;
  section: EditSection;
};

const sectionLabels: Record<EditSection, string> = {
  basic: "기본정보",
  places: "장소",
  flights: "항공편",
  schedules: "일정",
  checklist: "체크리스트",
  share: "공유 링크",
};

// "/manage/trips/:id/edit/:section" 진입점. 카테고리 하나만 렌더링한다는 점만 다르고,
// 실제 폼/목록 컴포넌트와 상태 관리는 기존 giant form(SelectedTripDetailSection)이 쓰던 것을 그대로 재사용한다.
export function TripEditSectionPage({ tripId, section }: TripEditSectionPageProps) {
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
                <span className="pill">편집 · {sectionLabels[section]}</span>
                <h1>{selectedOwnerTrip.title}</h1>
                <p className="muted">
                  {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
                </p>
              </div>
              <a className="secondary-button compact-button" href={`/manage/trips/${selectedOwnerTrip.id}/edit`}>
                편집 허브로
              </a>
            </div>

            {section === "basic" && (
              <>
                {selectedOwnerTrip.destinationCountry === "CN" && <ChinaPaymentHelper />}
                <TripBasicInfoForm {...manage} />
              </>
            )}

            {section === "places" && (
              <>
                <ManagePlaceCreateForm {...manage} />
                <ManagePlaceList {...manage} destinationCountry={selectedOwnerTrip.destinationCountry} />
              </>
            )}

            {section === "flights" && (
              <>
                <ManageFlightCreateForm
                  {...manage}
                  tripEndDate={selectedOwnerTrip.endDate}
                  tripStartDate={selectedOwnerTrip.startDate}
                />
                <ManageFlightList {...manage} />
              </>
            )}

            {section === "schedules" && (
              <>
                <ManageScheduleCreateForm
                  {...manage}
                  tripEndDate={selectedOwnerTrip.endDate}
                  tripStartDate={selectedOwnerTrip.startDate}
                />
                <ManageScheduleList {...manage} />
              </>
            )}

            {section === "checklist" && (
              <ManageChecklistSection
                checklistItems={manage.checklistItems}
                checklistLoading={manage.checklistLoading}
                checklistError={manage.checklistError}
                newChecklistTitle={manage.newChecklistTitle}
                setNewChecklistTitle={manage.onNewChecklistTitleChange}
                newChecklistCategory={manage.newChecklistCategory}
                setNewChecklistCategory={manage.onNewChecklistCategoryChange}
                checklistSubmitting={manage.checklistSubmitting}
                handleAddChecklistItem={manage.onAddChecklistItem}
                handleToggleChecklistItem={manage.onToggleChecklistItem}
                handleDeleteChecklistItem={manage.onDeleteChecklistItem}
              />
            )}

            {section === "share" && <ManageShareActions {...manage} />}
          </section>
        </div>
      </section>
    </main>
  );
}
