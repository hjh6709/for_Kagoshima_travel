import { TripManagePage } from "./features/manage/TripManagePage";
import { TripEditHubPage } from "./features/manage/TripEditHubPage";
import { TripEditSectionPage } from "./features/manage/TripEditSectionPage";
import { useTripManageController } from "./features/manage/useTripManageController";
import { SharedTripPage } from "./features/share/SharedTripPage";
import { useSharedTripController } from "./features/share/useSharedTripController";
import { StartPage } from "./features/start/StartPage";
import { OwnerTripViewPage } from "./features/trip/OwnerTripViewPage";
import { TripPage } from "./features/trip/TripPage";
import { useTripPageController } from "./features/trip/useTripPageController";
import { parseManageRoute } from "./shared/manageRoute";
import { getShareTokenFromPath } from "./shared/share";

function App() {
  const currentPath = window.location.pathname;
  const isLegacyOwnerRoute = currentPath === "/owner" || currentPath.startsWith("/owner/");
  const isManageRoute = currentPath === "/manage" || currentPath.startsWith("/manage/") || isLegacyOwnerRoute;
  const isDemoRoute = currentPath === "/demo" || currentPath.startsWith("/demo/");
  const shareToken = getShareTokenFromPath(currentPath);
  const { isShareRoute, sharedTrip, sharedTripError, sharedTripWarning, sharedTripLoading } = useSharedTripController({ shareToken });
  const managePageProps = useTripManageController({ currentPath, isLegacyOwnerRoute, isManageRoute });
  const tripPageProps = useTripPageController();

  if (isShareRoute) {
    return <SharedTripPage error={sharedTripError} warning={sharedTripWarning} loading={sharedTripLoading} sharedTrip={sharedTrip} />;
  }

  if (isManageRoute && !isLegacyOwnerRoute) {
    const manageRoute = parseManageRoute(currentPath);
    if (manageRoute.view === "trip") {
      return <OwnerTripViewPage tripId={manageRoute.tripId} />;
    }
    if (manageRoute.view === "editSection") {
      return <TripEditSectionPage section={manageRoute.section} tripId={manageRoute.tripId} />;
    }
    if (manageRoute.view === "editHub") {
      return <TripEditHubPage tripId={manageRoute.tripId} />;
    }
    return <TripManagePage {...managePageProps} />;
  }

  if (isManageRoute) {
    // 레거시 /owner 경로: useTripManageController 내부의 리다이렉트 effect가 /manage로 옮겨준다.
    return <TripManagePage {...managePageProps} />;
  }

  if (isDemoRoute) {
    return <TripPage {...tripPageProps} isDemo={true} />;
  }

  return <StartPage />;
}

export default App;
