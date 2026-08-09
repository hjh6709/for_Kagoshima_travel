import { useRef, useState } from "react";
import { ManageAuthSection, ManageHeader, TripCreateSection, TripListSection } from "./components";
import type { TripManagePageProps } from "./manageTypes";

// API 호출과 세션 상태는 useTripManageController가 담당한다.
// 이 컴포넌트는 여행 목록과 새 여행 생성만 다룬다 — 특정 여행 보기/편집은 /manage/trips/:id로 분리됐다.
export function TripManagePage(props: TripManagePageProps) {
  const { auth, authChecked, ownerTrips, ownerTripsError, ownerTripsLoading } = props;
  const [isTripCreateOpen, setIsTripCreateOpen] = useState(false);
  const tripCreateSectionRef = useRef<HTMLElement>(null);
  const isFirstTrip = !ownerTripsLoading && !ownerTripsError && ownerTrips.length === 0;

  const openTripCreateForm = () => {
    setIsTripCreateOpen(true);
    requestAnimationFrame(() => {
      const section = tripCreateSectionRef.current;
      section?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      section?.querySelector<HTMLInputElement>("input:not([type='hidden'])")?.focus();
    });
  };

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            <ManageAuthSection {...props} />

            {authChecked && auth && (
              <>
                <ManageHeader
                  auth={auth}
                  onCreateTrip={openTripCreateForm}
                  tripCount={ownerTrips.length}
                />
                {(ownerTripsLoading || ownerTripsError || ownerTrips.length > 0) && (
                  <TripListSection {...props} />
                )}
                {!ownerTripsLoading && !ownerTripsError && (
                  <TripCreateSection
                    {...props}
                    isFirstTrip={isFirstTrip}
                    isOpen={isTripCreateOpen}
                    onOpenChange={setIsTripCreateOpen}
                    sectionRef={tripCreateSectionRef}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
