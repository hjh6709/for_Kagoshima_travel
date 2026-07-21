import React, { useEffect } from "react";
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
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          accent: "bg-emerald-500",
        };
      case "error":
        return {
          bg: "bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50",
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          accent: "bg-rose-500",
        };
      case "warning":
        return {
          bg: "bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-950/50",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          accent: "bg-amber-500",
        };
      case "info":
      default:
        return {
          bg: "bg-slate-900/90 border-blue-500/40 text-slate-100 shadow-slate-950/50",
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
          accent: "bg-blue-500",
        };
    }
  };

  const style = getToastStyles(toast.type);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all ${style.bg}`}
        role="alert"
      >
        <div className="mt-0.5">{style.icon}</div>
        <div className="flex-1 min-w-0">
          {toast.title && <h4 className="text-sm font-semibold mb-0.5 tracking-tight">{toast.title}</h4>}
          <p className="text-xs leading-relaxed text-slate-200/90 break-keep">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
