import { TripManagePage } from "./features/manage/TripManagePage";
import { useTripManageController } from "./features/manage/useTripManageController";
import { SharedTripPage } from "./features/share/SharedTripPage";
import { useSharedTripController } from "./features/share/useSharedTripController";
import { StartPage } from "./features/start/StartPage";
import { TripPage } from "./features/trip/TripPage";
import { useTripPageController } from "./features/trip/useTripPageController";
import { getShareTokenFromPath } from "./shared/share";

function App() {
  const currentPath = window.location.pathname;
  const isLegacyOwnerRoute = currentPath === "/owner" || currentPath.startsWith("/owner/");
  const isManageRoute = currentPath === "/manage" || currentPath.startsWith("/manage/") || isLegacyOwnerRoute;
  const isDemoRoute = currentPath === "/demo" || currentPath.startsWith("/demo/");
  const shareToken = getShareTokenFromPath(currentPath);
  const { isShareRoute, sharedTrip, sharedTripError, sharedTripLoading } = useSharedTripController({ shareToken });
  const managePageProps = useTripManageController({ currentPath, isLegacyOwnerRoute, isManageRoute });
  const tripPageProps = useTripPageController();

  if (isShareRoute) {
    return <SharedTripPage error={sharedTripError} loading={sharedTripLoading} sharedTrip={sharedTrip} />;
  }

  if (isManageRoute) {
    return <TripManagePage {...managePageProps} />;
  }

  if (isDemoRoute) {
    return <TripPage {...tripPageProps} />;
  }

  return <StartPage />;
}

export default App;
