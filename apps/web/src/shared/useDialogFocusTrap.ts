import { useEffect, type RefObject } from "react";

type DialogFocusTrapOptions = {
  isOpen: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
};

const FOCUSABLE_SELECTOR = "button, [href], [tabindex]:not([tabindex='-1'])";

/**
 * 모달과 바텀 시트가 공유하는 키보드 접근성 규칙.
 * 열리면 지정한 요소로 포커스를 옮기고, Escape로 닫고, Tab을 안에서 순환시키며,
 * 닫힐 때 원래 포커스를 되돌린다.
 */
export function useDialogFocusTrap({
  isOpen,
  onClose,
  dialogRef,
  initialFocusRef,
}: DialogFocusTrapOptions) {
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [dialogRef, initialFocusRef, isOpen, onClose]);
}
