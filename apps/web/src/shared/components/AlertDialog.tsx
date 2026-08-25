import { useRef } from "react";
import { useDialogFocusTrap } from "../useDialogFocusTrap";

type AlertAction = {
  label: string;
  onClick: () => void;
  // iOS 시스템 알럿 규칙: destructive는 danger 색, 그 외 기본 액션은 굵게 강조한다.
  tone?: "default" | "destructive";
};

type AlertDialogProps = {
  title: string;
  description?: string;
  cancelLabel: string;
  onCancel: () => void;
  action: AlertAction;
};

// iOS 네이티브 알럿 스펙을 그대로 옮긴 확인 다이얼로그.
// Figma 커뮤니티 "iOS Alerts" 참조(popover 14px, 팝오버 폭 270px, 구분선 rgba(0,0,0,0.24) 0.5px)를
// 프로젝트 토큰(--radius-control, --c-danger)에 맞춰 이식했다.
// window.confirm은 Capacitor 네이티브 셸 안에서 WKWebView 기본 다이얼로그로 밋밋하게 뜨기 때문에 대체한다.
export function AlertDialog({ title, description, cancelLabel, onCancel, action }: AlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ dialogRef, initialFocusRef: primaryButtonRef, isOpen: true, onClose: onCancel });

  return (
    <div className="ios-alert-backdrop">
      <div aria-describedby={description ? "ios-alert-description" : undefined} aria-labelledby="ios-alert-title" aria-modal="true" className="ios-alert-popover" ref={dialogRef} role="alertdialog">
        <div className="ios-alert-content">
          <p className="ios-alert-title" id="ios-alert-title">
            {title}
          </p>
          {description && (
            <p className="ios-alert-description" id="ios-alert-description">
              {description}
            </p>
          )}
        </div>
        <div className="ios-alert-actions">
          <button className="ios-alert-action" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={`ios-alert-action ios-alert-action-emphasis${action.tone === "destructive" ? " ios-alert-action-destructive" : ""}`}
            onClick={action.onClick}
            ref={primaryButtonRef}
            type="button"
          >
            {action.label}
          </button>
        </div>
      </div>
    </div>
  );
}
