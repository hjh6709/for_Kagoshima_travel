import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { PwaStatusBanner } from "./shared/components/PwaStatusBanner";
import { publishPwaStatus, setPwaUpdateHandler } from "./shared/pwaStatus";
import "./styles.css";

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh: () => publishPwaStatus("update-ready"),
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
