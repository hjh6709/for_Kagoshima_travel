import { useEffect, useState } from "react";
import { ManageAuthSection, ManageHeader, TripCreateSection, TripListSection } from "./components";
import type { TripManagePageProps } from "./manageTypes";

// API 호출과 세션 상태는 useTripManageController가 담당한다.
// 이 컴포넌트는 여행 목록과 새 여행 생성만 다룬다 — 특정 여행 보기/편집은 /manage/trips/:id로 분리됐다.
export function TripManagePage(props: TripManagePageProps) {
  const { auth, authChecked, ownerTrips, ownerTripsError, ownerTripsLoading } = props;
  const [isTripCreateOpen, setIsTripCreateOpen] = useState(false);

  useEffect(() => {
    if (!ownerTripsLoading && !ownerTripsError && ownerTrips.length === 0) {
      setIsTripCreateOpen(true);
    }
  }, [ownerTrips.length, ownerTripsError, ownerTripsLoading]);

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            <ManageAuthSection {...props} />

            {authChecked && auth && (
              <>
                <ManageHeader auth={auth} />
                <TripCreateSection
                  {...props}
                  isOpen={isTripCreateOpen}
                  onOpenChange={setIsTripCreateOpen}
                />
                {(ownerTripsLoading || ownerTripsError || ownerTrips.length > 0) && (
                  <TripListSection {...props} />
                )}
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
