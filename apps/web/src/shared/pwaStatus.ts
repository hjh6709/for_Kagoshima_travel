export type PwaStatus = "offline-ready" | "update-ready" | "register-error";

type PwaStatusListener = (status: PwaStatus) => void;
type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

const listeners = new Set<PwaStatusListener>();
let latestStatus: PwaStatus | null = null;
let updateServiceWorker: UpdateServiceWorker | null = null;

export function publishPwaStatus(status: PwaStatus) {
  latestStatus = status;
  listeners.forEach((listener) => listener(status));
}

export function subscribePwaStatus(listener: PwaStatusListener) {
  listeners.add(listener);

  if (latestStatus) {
    listener(latestStatus);
  }

  return () => {
    listeners.delete(listener);
  };
}

export function setPwaUpdateHandler(handler: UpdateServiceWorker) {
  updateServiceWorker = handler;
}

export function applyPwaUpdate() {
  return updateServiceWorker?.(true);
}
