import { useEffect, type ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastMessage = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
};

type ToastNotificationProps = {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  placement?: "top" | "bottom";
};

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={20} aria-hidden="true" />,
  error: <AlertCircle size={20} aria-hidden="true" />,
  warning: <AlertTriangle size={20} aria-hidden="true" />,
  info: <Info size={20} aria-hidden="true" />,
};

export function ToastNotification({
  toast,
  onClose,
  duration = 4000,
  actionLabel,
  onAction,
  placement = "top",
}: ToastNotificationProps) {
  useEffect(() => {
    if (!toast || duration <= 0) return;

    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const isUrgent = toast.type === "error" || toast.type === "warning";

  return (
    <div className={`toast-viewport toast-viewport-${placement}`}>
      <div
        className={`toast-card toast-${toast.type}`}
        role={isUrgent ? "alert" : "status"}
        aria-live={isUrgent ? "assertive" : "polite"}
      >
        <span className="toast-icon">{ICONS[toast.type]}</span>
        <div className="toast-content">
          {toast.title && <h2>{toast.title}</h2>}
          <p>{toast.message}</p>
          {actionLabel && onAction && (
            <button type="button" className="toast-action" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
        <button type="button" className="toast-close" onClick={onClose} aria-label="알림 닫기">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
