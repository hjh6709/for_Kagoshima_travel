import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { hasPendingApiMutation } from "./api/auth";
import { PwaStatusBanner } from "./shared/components/PwaStatusBanner";
import { publishPwaStatus, setPwaUpdateHandler } from "./shared/pwaStatus";
import {
  coordinatePwaUpdate,
  createPwaFormChangeTracker,
} from "./shared/pwaUpdateCoordinator";
import "./styles.css";

const pwaFormChangeTracker = createPwaFormChangeTracker();
const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh: () => {
    coordinatePwaUpdate({
      hasPendingMutation: hasPendingApiMutation,
      hasUnsavedFormChanges: pwaFormChangeTracker.hasUnsavedChanges,
      onBlocked: () => publishPwaStatus("update-ready"),
      updateServiceWorker,
    });
  },
  onOfflineReady: () => publishPwaStatus("offline-ready"),
  onRegisterError: () => publishPwaStatus("register-error"),
});

setPwaUpdateHandler(updateServiceWorker);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PwaStatusBanner />
    <App />
  </StrictMode>
);
